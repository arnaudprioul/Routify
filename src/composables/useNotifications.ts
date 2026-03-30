import { onMounted, onUnmounted } from 'vue';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { useRoutineStore } from '@/stores/routines.store';

/**
 * Checks every minute whether a routine with reminderTime has not been
 * completed today, and fires a native macOS notification if so.
 * Tracks already-notified routines (per day) to avoid spam.
 */
export function useNotifications() {
  const store = useRoutineStore();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  // Key: "routineId:YYYY-MM-DD" — prevents double-notifying in the same minute
  const notifiedKeys = new Set<string>();

  async function checkAndNotify() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hh}:${mm}`;
    const today = now.toISOString().split('T')[0];

    for (const routine of store.routinesForToday()) {
      if (!routine.reminderTime || routine.reminderTime !== currentTime) continue;

      const key = `${routine.id}:${today}`;
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
            ? `Time to start your routine!`
            : `${remaining} item${remaining > 1 ? 's' : ''} left to complete.`,
      });
    }
  }

  async function init() {
    let granted = await isPermissionGranted();
    if (!granted) {
      const result = await requestPermission();
      granted = result === 'granted';
    }
    if (!granted) return;

    await checkAndNotify();
    intervalId = setInterval(checkAndNotify, 60_000);
  }

  onMounted(() => void init());
  onUnmounted(() => {
    if (intervalId !== null) clearInterval(intervalId);
  });
}
