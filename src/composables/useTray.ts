import { watch } from 'vue';
import { useRoutineStore } from '@/stores/routines.store';

// Only invoke Tauri commands when running inside Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

async function invokeTauri(cmd: string, args?: Record<string, unknown>) {
  if (!isTauri) return;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke(cmd, args);
  } catch {
    // Ignore — browser dev mode or permission not granted
  }
}

export function useTray() {
  const store = useRoutineStore();

  async function syncTray() {
    const today = Object.values(store.routinesByBlock)
      .flat()
      .map((r) => ({ id: r.id, name: r.name, icon: r.icon }));

    await invokeTauri('update_tray_menu', { routines: today });
  }

  // Rebuild menu whenever routines change
  watch(() => store.routines, syncTray, { deep: true, immediate: true });

  return { syncTray };
}
