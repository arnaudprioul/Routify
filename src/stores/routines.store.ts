import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type TTimeBlock = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type TDayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

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
  days: TDayOfWeek[];       // empty = every day
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

// Migrate old format (frequency field) to new format (timeBlock + days)
function migrate(raw: Record<string, unknown>[]): IRoutine[] {
  return raw.map((r) => {
    if ('frequency' in r) {
      const freq = r.frequency as string;
      const timeBlock: TTimeBlock =
        freq === 'daily' ? 'morning' : 'anytime';
      const days: TDayOfWeek[] =
        freq === 'weekly' ? ['mon', 'wed', 'fri'] : [];
      const { frequency: _f, ...rest } = r;
      return { ...rest, timeBlock, days } as unknown as IRoutine;
    }
    return r as unknown as IRoutine;
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
  const routines = ref<IRoutine[]>(loadFromStorage());

  function loadFromStorage(): IRoutine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_ROUTINES;
      const parsed = JSON.parse(raw) as Record<string, unknown>[];
      return migrate(parsed);
    } catch {
      return DEFAULT_ROUTINES;
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines.value));
  }

  // Returns routines scheduled for the given date (defaults to today)
  function routinesForToday(dateStr?: string): IRoutine[] {
    const dow = dateStr
      ? DAY_KEYS[new Date(dateStr + 'T12:00:00').getDay()]
      : todayDow();
    return routines.value.filter(
      (r) => r.days.length === 0 || r.days.includes(dow),
    );
  }

  // Grouped by time block, only for today
  const routinesByBlock = computed(() => {
    const today = routinesForToday();
    return {
      morning:   today.filter((r) => r.timeBlock === 'morning'),
      afternoon: today.filter((r) => r.timeBlock === 'afternoon'),
      evening:   today.filter((r) => r.timeBlock === 'evening'),
      anytime:   today.filter((r) => r.timeBlock === 'anytime'),
    };
  });

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
    save();
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
    routines.value.push({
      ...data,
      id: generateId(),
      createdAt: todayStr(),
      streak: 0,
      completedDates: [],
    });
    save();
  }

  function addItemToRoutine(
    routineId: string,
    item: Omit<IRoutineItem, 'id' | 'completed'>,
  ) {
    const routine = routines.value.find((r) => r.id === routineId);
    if (!routine) return;
    routine.items.push({ ...item, id: generateId(), completed: false });
    save();
  }

  function updateRoutine(id: string, patch: Partial<Omit<IRoutine, 'id' | 'createdAt'>>) {
    const routine = routines.value.find((r) => r.id === id);
    if (!routine) return;
    Object.assign(routine, patch);
    save();
  }

  function reorderItems(routineId: string, from: number, to: number) {
    const routine = routines.value.find((r) => r.id === routineId);
    if (!routine || from === to) return;
    const items = [...routine.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    routine.items = items;
    save();
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
    save();
  }

  function deleteItem(routineId: string, itemId: string) {
    const routine = routines.value.find((r) => r.id === routineId);
    if (!routine) return;
    routine.items = routine.items.filter((i) => i.id !== itemId);
    save();
  }

  function deleteRoutine(id: string) {
    routines.value = routines.value.filter((r) => r.id !== id);
    save();
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
    routinesByBlock,
    routinesForToday,
    totalCompleted,
    totalItems,
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
