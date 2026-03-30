import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  registerActionTypes,
  onAction,
} from '@tauri-apps/plugin-notification';
import { useRoutineStore } from '@/stores/routines.store';

const ACTION_TYPE_ID = 'routine-reminder';

/**
 * Checks every minute whether a routine with reminderTime has not been
 * completed today, fires a native macOS notification with action buttons:
 *   - "Start"      → opens Focus mode
 *   - "Done"       → marks routine complete
 *   - "Later +30"  → reschedules reminder by 30 minutes (session-only)
 */
export function useNotifications() {
  const store = useRoutineStore();
  const router = useRouter();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let actionUnlisten: (() => void) | null = null;

  // Key: "routineId:YYYY-MM-DD" — prevents double-notifying in the same minute
  const notifiedKeys = new Set<string>();

  // Session-only reminder overrides: routineId → 'HH:MM'
  const reminderOverrides = new Map<string, string>();

  function getReminderTime(routineId: string, defaultTime: string): string {
    return reminderOverrides.get(routineId) ?? defaultTime;
  }

  function addThirtyMin(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + 30;
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }

  async function checkAndNotify() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hh}:${mm}`;
    const today = now.toISOString().split('T')[0];

    for (const routine of store.routinesForToday()) {
      if (!routine.reminderTime) continue;

      const effectiveTime = getReminderTime(routine.id, routine.reminderTime);
      if (effectiveTime !== currentTime) continue;

      const key = `${routine.id}:${today}:${effectiveTime}`;
      if (notifiedKeys.has(key)) continue;

      const allDone =
        routine.items.length > 0 && routine.items.every((i) => i.completed);
      if (allDone) continue;

      notifiedKeys.add(key);

      const remaining = routine.items.filter((i) => !i.completed).length;
      await sendNotification({
        title: `${routine.icon} ${routine.name}`,
        body:
          remaining === routine.items.length
            ? 'Time to start your routine!'
            : `${remaining} item${remaining > 1 ? 's' : ''} left to complete.`,
        actionTypeId: ACTION_TYPE_ID,
        extra: { routineId: routine.id },
      });
    }
  }

  async function setupActionListener() {
    const unlisten = await onAction(({ notification, actionId }) => {
      const routineId = notification.extra?.routineId as string | undefined;
      if (!routineId) return;

      switch (actionId) {
        case 'start':
          router.push(`/focus/${routineId}`);
          break;

        case 'done': {
          const routine = store.routines.find((r) => r.id === routineId);
          if (routine) {
            // Mark all items as completed via the store
            for (const item of routine.items) {
              if (!item.completed) {
                store.toggleItem(routineId, item.id);
              }
            }
          }
          break;
        }

        case 'later': {
          const routine = store.routines.find((r) => r.id === routineId);
          if (routine?.reminderTime) {
            const current = getReminderTime(routineId, routine.reminderTime);
            reminderOverrides.set(routineId, addThirtyMin(current));
          }
          break;
        }
      }
    });
    return unlisten;
  }

  async function init() {
    let granted = await isPermissionGranted();
    if (!granted) {
      const result = await requestPermission();
      granted = result === 'granted';
    }
    if (!granted) return;

    await registerActionTypes([
      {
        id: ACTION_TYPE_ID,
        actions: [
          { id: 'start', title: 'Start' },
          { id: 'done', title: 'Done' },
          { id: 'later', title: 'Later +30min', destructive: false },
        ],
      },
    ]);

    actionUnlisten = await setupActionListener();

    await checkAndNotify();
    intervalId = setInterval(checkAndNotify, 60_000);
  }

  onMounted(() => void init());
  onUnmounted(() => {
    if (intervalId !== null) clearInterval(intervalId);
    if (actionUnlisten !== null) actionUnlisten();
  });
}
