import { ref } from 'vue';
import { useRoutineStore } from '@/stores/routines.store';
import { isTauri } from '@/services/database.service';

async function tauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(cmd, args);
}

export type TImportMode = 'replace' | 'merge';

export function useDataSync() {
  const store = useRoutineStore();
  const iCloudAvailable = ref(false);
  const status = ref<'idle' | 'busy' | 'success' | 'error'>('idle');
  const errorMsg = ref('');

  async function checkICloud() {
    if (!isTauri) return;
    iCloudAvailable.value = await tauri<boolean>('icloud_backup_exists');
  }

  // ---------------------------------------------------------------------------
  // JSON Export (works in browser + Tauri via Blob download)
  // ---------------------------------------------------------------------------
  function exportJson() {
    const payload = JSON.stringify(store.routines, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routify-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------------------
  // JSON Import
  // ---------------------------------------------------------------------------
  function importJson(file: File, mode: TImportMode = 'merge'): Promise<number> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target!.result as string);
          const incoming = Array.isArray(raw) ? raw : [];
          let count = 0;

          if (mode === 'replace') {
            // Replace all — clear and reload
            store.routines.splice(0, store.routines.length, ...incoming);
            // Persist
            for (const r of store.routines) store.updateRoutine(r.id, r);
            count = incoming.length;
          } else {
            // Merge — add routines whose ID doesn't exist yet
            const existingIds = new Set(store.routines.map((r) => r.id));
            for (const r of incoming) {
              if (!existingIds.has(r.id)) {
                store.addRoutine(r);
                count++;
              }
            }
          }
          resolve(count);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // ---------------------------------------------------------------------------
  // iCloud — back up current routines
  // ---------------------------------------------------------------------------
  async function backupToICloud() {
    if (!isTauri) return;
    status.value = 'busy';
    try {
      const data = JSON.stringify(store.routines, null, 2);
      await tauri('icloud_export', { data });
      iCloudAvailable.value = true;
      status.value = 'success';
    } catch (e) {
      errorMsg.value = String(e);
      status.value = 'error';
    }
  }

  // ---------------------------------------------------------------------------
  // iCloud — restore (merge)
  // ---------------------------------------------------------------------------
  async function restoreFromICloud() {
    if (!isTauri) return;
    status.value = 'busy';
    try {
      const raw = await tauri<string>('icloud_import');
      const incoming: typeof store.routines = JSON.parse(raw);
      const existingIds = new Set(store.routines.map((r) => r.id));
      let count = 0;
      for (const r of incoming) {
        if (!existingIds.has(r.id)) {
          store.addRoutine(r);
          count++;
        }
      }
      status.value = 'success';
      return count;
    } catch (e) {
      errorMsg.value = String(e);
      status.value = 'error';
      return 0;
    }
  }

  return {
    isTauri,
    iCloudAvailable,
    status,
    errorMsg,
    checkICloud,
    exportJson,
    importJson,
    backupToICloud,
    restoreFromICloud,
  };
}
