<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal" role="dialog" :aria-label="title">
        <div class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button class="btn-close" :aria-label="t('routines.modal.cancel')" @click="$emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <!-- Name + Icon row -->
          <div class="field-row">
            <div class="field" style="flex:1">
              <label class="field-label">{{ t('routines.modal.fields.name') }}</label>
              <input
                v-model="form.name"
                class="field-input"
                :placeholder="t('profiles.modal.fields.namePlaceholder')"
                maxlength="32"
                autofocus
              />
            </div>
            <div class="field icon-field">
              <label class="field-label">{{ t('routines.modal.fields.icon') }}</label>
              <input
                v-model="form.icon"
                class="field-input icon-input"
                maxlength="2"
                placeholder="🗂"
              />
            </div>
          </div>

          <!-- Color -->
          <div class="field">
            <label class="field-label">{{ t('routines.modal.fields.color') }}</label>
            <div class="color-swatches">
              <button
                v-for="c in COLORS"
                :key="c"
                class="color-swatch"
                :class="{ selected: form.color === c }"
                :style="{ background: c }"
                :aria-label="c"
                @click="form.color = c"
              />
            </div>
          </div>

          <!-- Routine selection -->
          <div class="field">
            <label class="field-label">{{ t('profiles.modal.fields.routines') }}</label>
            <div class="routine-list">
              <label
                v-for="r in store.routines"
                :key="r.id"
                class="routine-check"
              >
                <input
                  type="checkbox"
                  :checked="form.routineIds.includes(r.id)"
                  @change="toggleRoutine(r.id)"
                />
                <span class="routine-icon" :style="{ color: r.color }">{{ r.icon }}</span>
                <span class="routine-name">{{ r.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            v-if="editId"
            class="btn-danger"
            @click="handleDelete"
          >{{ t('profiles.modal.delete') }}</button>
          <span class="footer-spacer" />
          <button class="btn-cancel" @click="$emit('close')">
            {{ t('routines.modal.cancel') }}
          </button>
          <button
            class="btn-submit"
            :disabled="!form.name.trim() || form.routineIds.length === 0"
            @click="handleSubmit"
          >
            {{ editId ? t('routines.modal.save') : t('routines.modal.create') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoutineStore } from '@/stores/routines.store';
import { useProfilesStore, type IProfile } from '@/stores/profiles.store';

interface IProps {
  editProfile?: IProfile;
}

const props = withDefaults(defineProps<IProps>(), { editProfile: undefined });
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const store = useRoutineStore();
const profilesStore = useProfilesStore();

const editId = props.editProfile?.id ?? null;

const title = editId
  ? t('profiles.modal.editTitle')
  : t('profiles.modal.title');

const COLORS = [
  '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6',
  '#3b82f6', '#ef4444', '#22c55e', '#f97316',
];

const form = reactive({
  name: props.editProfile?.name ?? '',
  icon: props.editProfile?.icon ?? '🗂',
  color: props.editProfile?.color ?? COLORS[0],
  routineIds: props.editProfile ? [...props.editProfile.routineIds] : store.routines.map((r) => r.id),
});

function toggleRoutine(id: string) {
  const idx = form.routineIds.indexOf(id);
  if (idx >= 0) form.routineIds.splice(idx, 1);
  else form.routineIds.push(id);
}

function handleSubmit() {
  if (!form.name.trim() || form.routineIds.length === 0) return;
  const data = {
    name: form.name.trim(),
    icon: form.icon || '🗂',
    color: form.color,
    routineIds: [...form.routineIds],
  };
  if (editId) {
    profilesStore.updateProfile(editId, data);
  } else {
    const id = profilesStore.addProfile(data);
    profilesStore.setActiveProfile(id);
  }
  emit('close');
}

function handleDelete() {
  if (!editId) return;
  profilesStore.deleteProfile(editId);
  emit('close');
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
  width: min(480px, 92vw);
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
  gap: var(--sp-5);
  overflow-y: auto;
}

.field { display: flex; flex-direction: column; gap: var(--sp-2); }

.field-row {
  display: flex;
  gap: var(--sp-3);
  align-items: flex-end;
}

.icon-field { width: 72px; flex-shrink: 0; }

.field-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-input {
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--sp-2) var(--sp-3);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: border-color var(--duration-fast);
}
.field-input:focus { border-color: var(--accent); outline: none; }

.icon-input { text-align: center; font-size: 18px; }

.color-swatches {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: transform var(--duration-fast), border-color var(--duration-fast);
}
.color-swatch:hover { transform: scale(1.15); }
.color-swatch.selected {
  border-color: var(--text-primary);
  transform: scale(1.15);
}

.routine-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
}

.routine-check {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast);
}
.routine-check:hover { background: var(--bg-overlay); }
.routine-check input { accent-color: var(--accent); width: 14px; height: 14px; cursor: pointer; }
.routine-icon { font-size: 14px; }
.routine-name { font-size: var(--text-sm); color: var(--text-secondary); }

.modal-footer {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-4) var(--sp-6);
  border-top: 1px solid var(--border);
}

.footer-spacer { flex: 1; }

.btn-cancel {
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-muted);
  transition: background var(--duration-fast), color var(--duration-fast);
}
.btn-cancel:hover { background: var(--bg-overlay); color: var(--text-primary); }

.btn-submit {
  padding: var(--sp-2) var(--sp-5);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  background: var(--accent);
  color: #000;
  transition: opacity var(--duration-fast);
}
.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-submit:not(:disabled):hover { opacity: 0.85; }

.btn-danger {
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--error, #ef4444);
  transition: background var(--duration-fast);
}
.btn-danger:hover { background: rgba(239, 68, 68, 0.1); }
</style>
