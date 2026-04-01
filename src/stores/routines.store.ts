import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  isTauri,
  initDatabase,
  loadRoutines,
  saveRoutine,
  saveAllRoutines,
  deleteRoutineFromDb,
  getSetting,
  setSetting,
} from '@/services/database.service';
import { useProfilesStore } from '@/stores/profiles.store';

export type TTimeBlock = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type TDayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type TRecurrence = 'daily' | 'weekly' | 'monthly';

export interface IRoutineItem {
  id: string;
  label: string;
  durationMin?: number;
  completed: boolean;
}

export interface IRoutine {
  id: string;
  name: string;
  icon: string;
  color: string;
  timeBlock: TTimeBlock;
  days: TDayOfWeek[];       // empty = every day (only used for 'daily' recurrence)
  recurrence: TRecurrence;  // reset period
  reminderTime?: string;    // 'HH:MM' 24h
  items: IRoutineItem[];
  streak: number;
  completedDates: string[];
  createdAt: string;
}

const STORAGE_KEY = 'routify_routines';

const DAY_KEYS: TDayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function todayDow(): TDayOfWeek {
  return DAY_KEYS[new Date().getDay()];
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Returns the Monday of the week containing `date` (ISO date string). */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().split('T')[0];
}

/** Returns the Sunday of the week containing `date` (ISO date string). */
function getWeekEnd(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day));
  return d.toISOString().split('T')[0];
}

/** Returns 'YYYY-MM' for the month containing `date`. */
function getMonthPrefix(date: Date): string {
  return date.toISOString().slice(0, 7);
}

// Migrate old format (frequency field) to new format (timeBlock + days + recurrence)
function migrate(raw: Record<string, unknown>[]): IRoutine[] {
  return raw.map((r) => {
    const result = { ...r };
    // Legacy frequency field
    if ('frequency' in result) {
      const freq = result.frequency as string;
      result.timeBlock = freq === 'daily' ? 'morning' : 'anytime';
      result.days = freq === 'weekly' ? ['mon', 'wed', 'fri'] : [];
      delete result.frequency;
    }
    // Default recurrence for old records
    if (!result.recurrence) result.recurrence = 'daily';
    return result as unknown as IRoutine;
  });
}

const DEFAULT_ROUTINES: IRoutine[] = [
  {
    id: generateId(),
    name: 'Morning Routine',
    icon: '☀',
    color: '#f59e0b',
    timeBlock: 'morning',
    days: [],
    recurrence: 'daily',
    streak: 0,
    createdAt: todayStr(),
    completedDates: [],
    items: [
      { id: generateId(), label: 'Drink a glass of water', durationMin: 1, completed: false },
      { id: generateId(), label: 'Stretch for 5 minutes', durationMin: 5, completed: false },
      { id: generateId(), label: 'Journaling', durationMin: 10, completed: false },
      { id: generateId(), label: 'Cold shower', durationMin: 5, completed: false },
    ],
  },
  {
    id: generateId(),
    name: 'Skincare',
    icon: '✦',
    color: '#ec4899',
    timeBlock: 'morning',
    days: [],
    recurrence: 'daily',
    streak: 0,
    createdAt: todayStr(),
    completedDates: [],
    items: [
      { id: generateId(), label: 'Cleanse', durationMin: 2, completed: false },
      { id: generateId(), label: 'Toner', durationMin: 1, completed: false },
      { id: generateId(), label: 'Serum', durationMin: 2, completed: false },
      { id: generateId(), label: 'Moisturizer + SPF', durationMin: 2, completed: false },
    ],
  },
  {
    id: generateId(),
    name: 'Workout',
    icon: '◈',
    color: '#14b8a6',
    timeBlock: 'anytime',
    days: ['mon', 'wed', 'fri'],
    recurrence: 'daily',
    streak: 0,
    createdAt: todayStr(),
    completedDates: [],
    items: [
      { id: generateId(), label: 'Warm-up (10 min)', durationMin: 10, completed: false },
      { id: generateId(), label: 'Main workout (40 min)', durationMin: 40, completed: false },
      { id: generateId(), label: 'Cool down & stretch', durationMin: 10, completed: false },
    ],
  },
  {
    id: generateId(),
    name: 'Evening Wind Down',
    icon: '◑',
    color: '#8b5cf6',
    timeBlock: 'evening',
    days: [],
    recurrence: 'daily',
    streak: 0,
    createdAt: todayStr(),
    completedDates: [],
    items: [
      { id: generateId(), label: 'No screens 30 min before bed', durationMin: 30, completed: false },
      { id: generateId(), label: 'Read or meditate', durationMin: 15, completed: false },
      { id: generateId(), label: "Set tomorrow's intention", durationMin: 2, completed: false },
    ],
  },
];

export const useRoutineStore = defineStore('routines', () => {
  const routines = ref<IRoutine[]>(_loadFromStorage());
  const profilesStore = useProfilesStore();

  /** Routines filtered by the active profile (or all if no profile active). */
  const visibleRoutines = computed(() => {
    const active = profilesStore.activeProfile;
    if (!active) return routines.value;
    return routines.value.filter((r) => active.routineIds.includes(r.id));
  });

  function _loadFromStorage(): IRoutine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_ROUTINES;
      const parsed = JSON.parse(raw) as Record<string, unknown>[];
      return migrate(parsed);
    } catch {
      return DEFAULT_ROUTINES;
    }
  }

  /**
   * Must be called once before the app mounts.
   * Loads from SQLite in Tauri, then runs periodic reset checks.
   */
  async function init(): Promise<void> {
    const dbReady = await initDatabase();
    if (dbReady) {
      const migrated = await getSetting('ls_migrated_v1');
      if (!migrated) {
        await saveAllRoutines(routines.value);
        await setSetting('ls_migrated_v1', 'true');
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const dbRoutines = await loadRoutines();
        if (dbRoutines !== null) routines.value = dbRoutines;
      }
    }
    // Always run reset check — needed in both browser and Tauri
    await _checkAndReset();
  }

  /** Resets completed items for each recurrence type when the period has rolled over. */
  async function _checkAndReset(): Promise<void> {
    const now = new Date();
    const today = todayStr();
    const weekStart = getWeekStart(now);
    const monthPrefix = getMonthPrefix(now);

    async function getDate(key: string): Promise<string> {
      if (isTauri) return (await getSetting(key)) ?? '';
      return localStorage.getItem(key) ?? '';
    }
    async function setDate(key: string, val: string): Promise<void> {
      if (isTauri) await setSetting(key, val);
      else localStorage.setItem(key, val);
    }

    const [lastDaily, lastWeekly, lastMonthly] = await Promise.all([
      getDate('last_reset_daily'),
      getDate('last_reset_weekly'),
      getDate('last_reset_monthly'),
    ]);

    const toSave: IRoutine[] = [];

    if (lastDaily !== today) {
      routines.value.filter((r) => (r.recurrence ?? 'daily') === 'daily').forEach((r) => {
        r.items.forEach((i) => (i.completed = false));
        toSave.push(r);
      });
      await setDate('last_reset_daily', today);
    }

    if (lastWeekly !== weekStart) {
      routines.value.filter((r) => r.recurrence === 'weekly').forEach((r) => {
        r.items.forEach((i) => (i.completed = false));
        toSave.push(r);
      });
      await setDate('last_reset_weekly', weekStart);
    }

    if (lastMonthly !== monthPrefix) {
      routines.value.filter((r) => r.recurrence === 'monthly').forEach((r) => {
        r.items.forEach((i) => (i.completed = false));
        toSave.push(r);
      });
      await setDate('last_reset_monthly', monthPrefix);
    }

    for (const r of toSave) save(r);
  }

  function save(changedRoutine?: IRoutine) {
    if (!isTauri) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routines.value));
      return;
    }
    // Fire-and-forget: persist the changed routine (or all) to SQLite
    if (changedRoutine) {
      void saveRoutine(changedRoutine);
    } else {
      void saveAllRoutines(routines.value);
    }
  }

  /**
   * Returns routines that should appear today, respecting both recurrence and day-of-week.
   * Optional `recurrence` filter limits to one type only (used for tab views).
   */
  function routinesForToday(dateStr?: string, recurrence?: TRecurrence): IRoutine[] {
    const date = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
    const dow = DAY_KEYS[date.getDay()];
    const weekStart = getWeekStart(date);
    const weekEnd   = getWeekEnd(date);
    const monthPfx  = getMonthPrefix(date);

    return visibleRoutines.value.filter((r) => {
      const rec = r.recurrence ?? 'daily';
      if (recurrence && rec !== recurrence) return false;

      if (rec === 'daily') {
        return r.days.length === 0 || r.days.includes(dow);
      }
      if (rec === 'weekly') {
        // Show unless already completed somewhere within this week
        return !r.completedDates.some((d) => d >= weekStart && d <= weekEnd);
      }
      if (rec === 'monthly') {
        return !r.completedDates.some((d) => d.startsWith(monthPfx));
      }
      return true;
    });
  }

  type TBlockMap = Record<TTimeBlock, IRoutine[]>;

  function _blockMap(list: IRoutine[]): TBlockMap {
    return {
      morning:   list.filter((r) => r.timeBlock === 'morning'),
      afternoon: list.filter((r) => r.timeBlock === 'afternoon'),
      evening:   list.filter((r) => r.timeBlock === 'evening'),
      anytime:   list.filter((r) => r.timeBlock === 'anytime'),
    };
  }

  /** All today's routines grouped by time block (used by the default "All" view). */
  const routinesByBlock = computed(() => _blockMap(routinesForToday()));

  /** Today's routines grouped by time block, filtered by recurrence tab. */
  function routinesByBlockFor(rec: TRecurrence): TBlockMap {
    return _blockMap(routinesForToday(undefined, rec));
  }

  const totalCompleted = computed(() =>
    routinesForToday().reduce((acc, r) => {
      return acc + r.items.filter((i) => i.completed).length;
    }, 0),
  );

  const totalItems = computed(() =>
    routinesForToday().reduce((acc, r) => acc + r.items.length, 0),
  );

  function toggleItem(routineId: string, itemId: string) {
    const routine = routines.value.find((r) => r.id === routineId);
    if (!routine) return;
    const item = routine.items.find((i) => i.id === itemId);
    if (!item) return;
    item.completed = !item.completed;

    const allDone = routine.items.length > 0 && routine.items.every((i) => i.completed);
    if (allDone) {
      const t = todayStr();
      if (!routine.completedDates.includes(t)) {
        routine.completedDates.push(t);
        routine.streak = computeStreak(routine.completedDates);
      }
    }
    save(routine);
  }

  function computeStreak(dates: string[]): number {
    if (!dates.length) return 0;
    const sorted = [...dates].sort().reverse();
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) streak++;
      else break;
    }
    return streak;
  }

  function addRoutine(data: Omit<IRoutine, 'id' | 'createdAt' | 'streak' | 'completedDates'>) {
    const routine: IRoutine = {
      ...data,
      id: generateId(),
      createdAt: todayStr(),
      streak: 0,
      completedDates: [],
    };
    routines.value.push(routine);
    save(routine);
  }

  function addItemToRoutine(
    routineId: string,
    item: Omit<IRoutineItem, 'id' | 'completed'>,
  ) {
    const routine = routines.value.find((r) => r.id === routineId);
    if (!routine) return;
    routine.items.push({ ...item, id: generateId(), completed: false });
    save(routine);
  }

  function updateRoutine(id: string, patch: Partial<Omit<IRoutine, 'id' | 'createdAt'>>) {
    const routine = routines.value.find((r) => r.id === id);
    if (!routine) return;
    Object.assign(routine, patch);
    save(routine);
  }

  function reorderItems(routineId: string, from: number, to: number) {
    const routine = routines.value.find((r) => r.id === routineId);
    if (!routine || from === to) return;
    const items = [...routine.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    routine.items = items;
    save(routine);
  }

  function updateItem(
    routineId: string,
    itemId: string,
    patch: Partial<Pick<IRoutineItem, 'label' | 'durationMin'>>,
  ) {
    const routine = routines.value.find((r) => r.id === routineId);
    if (!routine) return;
    const item = routine.items.find((i) => i.id === itemId);
    if (!item) return;
    Object.assign(item, patch);
    save(routine);
  }

  function deleteItem(routineId: string, itemId: string) {
    const routine = routines.value.find((r) => r.id === routineId);
    if (!routine) return;
    routine.items = routine.items.filter((i) => i.id !== itemId);
    save(routine);
  }

  function deleteRoutine(id: string) {
    if (isTauri) void deleteRoutineFromDb(id);
    routines.value = routines.value.filter((r) => r.id !== id);
    if (!isTauri) localStorage.setItem(STORAGE_KEY, JSON.stringify(routines.value));
  }

  function resetTodayItems() {
    const dow = todayDow();
    routines.value.forEach((r) => {
      if (r.days.length === 0 || r.days.includes(dow)) {
        r.items.forEach((i) => (i.completed = false));
      }
    });
    save();
  }

  return {
    routines,
    visibleRoutines,
    routinesByBlock,
    routinesByBlockFor,
    routinesForToday,
    totalCompleted,
    totalItems,
    init,
    toggleItem,
    addRoutine,
    addItemToRoutine,
    reorderItems,
    updateItem,
    deleteItem,
    updateRoutine,
    deleteRoutine,
    resetTodayItems,
  };
});
