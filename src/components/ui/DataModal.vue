<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal" role="dialog" :aria-label="t('data.title')">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('data.title') }}</h2>
          <button class="btn-close" :aria-label="t('routines.modal.cancel')" @click="$emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <!-- Export / Import -->
          <section class="section">
            <h3 class="section-title">{{ t('data.local.title') }}</h3>
            <p class="section-desc">{{ t('data.local.desc') }}</p>
            <div class="action-row">
              <button class="btn-action" @click="sync.exportJson()">
                <span class="btn-icon">↓</span>
                {{ t('data.local.export') }}
              </button>
              <label class="btn-action btn-import" :class="{ disabled: importBusy }">
                <span class="btn-icon">↑</span>
                {{ t('data.local.import') }}
                <input
                  ref="fileInput"
                  type="file"
                  accept=".json"
                  class="hidden-input"
                  @change="handleImport"
                />
              </label>
            </div>
            <p v-if="importResult !== null" class="result-msg success">
              {{ t('data.local.imported', { n: importResult }) }}
            </p>
          </section>

          <!-- iCloud (Tauri only) -->
          <section v-if="sync.isTauri" class="section">
            <h3 class="section-title">{{ t('data.icloud.title') }}</h3>
            <p class="section-desc">{{ t('data.icloud.desc') }}</p>
            <div class="action-row">
              <button
                class="btn-action"
                :class="{ busy: sync.status.value === 'busy' }"
                :disabled="sync.status.value === 'busy'"
                @click="handleBackup"
              >
                <span class="btn-icon">☁</span>
                {{ t('data.icloud.backup') }}
              </button>
              <button
                class="btn-action"
                :disabled="!sync.iCloudAvailable.value || sync.status.value === 'busy'"
                @click="handleRestore"
              >
                <span class="btn-icon">↻</span>
                {{ t('data.icloud.restore') }}
              </button>
            </div>
            <p v-if="sync.status.value === 'success'" class="result-msg success">
              {{ iCloudMsg }}
            </p>
            <p v-if="sync.status.value === 'error'" class="result-msg error">
              {{ sync.errorMsg.value }}
            </p>
          </section>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close')">
            {{ t('routines.modal.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataSync } from '@/composables/useDataSync';

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const sync = useDataSync();

const importBusy = ref(false);
const importResult = ref<number | null>(null);
const iCloudMsg = ref('');

onMounted(() => sync.checkICloud());

async function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  importBusy.value = true;
  try {
    const count = await sync.importJson(file, 'merge');
    importResult.value = count;
  } catch { /* ignore */ }
  importBusy.value = false;
}

async function handleBackup() {
  await sync.backupToICloud();
  iCloudMsg.value = t('data.icloud.backupDone');
}

async function handleRestore() {
  const count = await sync.restoreFromICloud();
  iCloudMsg.value = t('data.icloud.restored', { n: count });
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: min(460px, 92vw);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  animation: modal-in var(--duration-base) var(--ease-out) both;
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-5) var(--sp-6) var(--sp-4);
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
}

.btn-close {
  color: var(--text-muted);
  font-size: 12px;
  padding: 4px;
  transition: color var(--duration-fast);
}
.btn-close:hover { color: var(--text-primary); }

.modal-body {
  padding: var(--sp-5) var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
  overflow-y: auto;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.section-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.section-desc {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.5;
}

.action-row {
  display: flex;
  gap: var(--sp-2);
}

.btn-action {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  background: var(--bg-overlay);
  cursor: pointer;
  transition: background var(--duration-fast), color var(--duration-fast);
}

.btn-action:hover:not(:disabled) {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.btn-action:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-action.busy { opacity: 0.6; cursor: wait; }

.btn-import { cursor: pointer; }
.btn-import.disabled { opacity: 0.4; pointer-events: none; }

.btn-icon { font-size: 14px; }

.hidden-input {
  display: none;
}

.result-msg {
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  padding: var(--sp-2) var(--sp-3);
}
.result-msg.success {
  color: var(--success, #22c55e);
  background: rgba(34, 197, 94, 0.08);
}
.result-msg.error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--sp-4) var(--sp-6);
  border-top: 1px solid var(--border);
}

.btn-cancel {
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-muted);
  transition: background var(--duration-fast), color var(--duration-fast);
}
.btn-cancel:hover { background: var(--bg-overlay); color: var(--text-primary); }
</style>
