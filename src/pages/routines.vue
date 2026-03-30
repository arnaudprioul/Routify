<template>
  <div class="routines-view animate-fade-in">
    <div class="view-header">
      <div>
        <h1 class="view-title">{{ t('routines.title') }}</h1>
        <p class="view-subtitle">{{ t('routines.subtitle', store.routines.length) }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-ai" @click="showAiModal = true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          {{ t('aiSuggest.button') }}
        </button>
        <button class="btn-primary" @click="showModal = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {{ t('routines.new') }}
        </button>
      </div>
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <div v-if="filteredRoutines.length === 0" class="empty-state">
      <p>{{ t('routines.empty.message') }}</p>
      <RouterLink to="/templates" class="empty-cta">{{ t('routines.empty.cta') }}</RouterLink>
    </div>

    <div v-else class="routines-list">
      <div
        v-for="(routine, i) in filteredRoutines"
        :key="routine.id"
        class="routine-row"
        :style="{ animationDelay: `${i * 40}ms` }"
      >
        <RoutineCard
          :routine="routine"
          @add-habit="openHabitLibrary"
          @edit="openEditModal"
          @delete="confirmDelete"
          @start="startRoutine"
        />
      </div>
    </div>

    <!-- AI Suggest modal -->
    <AiSuggestModal v-if="showAiModal" @close="showAiModal = false" />

    <!-- Habit Library modal -->
    <HabitLibrary
      v-if="habitLibraryRoutineId"
      :routine-id="habitLibraryRoutineId"
      @close="habitLibraryRoutineId = null"
    />

    <!-- Edit Routine modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="editingRoutineId" class="modal-backdrop" @click.self="editingRoutineId = null">
          <div class="modal">
            <h2 class="modal-title">{{ t('routines.modal.editTitle') }}</h2>
            <form @submit.prevent="saveEdit" class="modal-form">
              <div class="field">
                <label>{{ t('routines.modal.fields.name') }}</label>
                <input v-model="editForm.name" type="text" :placeholder="t('routines.modal.fields.namePlaceholder')" required />
              </div>
              <div class="field-row">
                <div class="field">
                  <label>{{ t('routines.modal.fields.icon') }}</label>
                  <input v-model="editForm.icon" type="text" placeholder="✦" maxlength="2" />
                </div>
                <div class="field">
                  <label>{{ t('routines.modal.fields.color') }}</label>
                  <input v-model="editForm.color" type="color" />
                </div>
                <div class="field">
                  <label>{{ t('routines.modal.fields.timeBlock') }}</label>
                  <select v-model="editForm.timeBlock">
                    <option value="morning">{{ t('timeBlock.morning') }}</option>
                    <option value="afternoon">{{ t('timeBlock.afternoon') }}</option>
                    <option value="evening">{{ t('timeBlock.evening') }}</option>
                    <option value="anytime">{{ t('timeBlock.anytime') }}</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>{{ t('routines.modal.fields.days') }}</label>
                <p class="field-hint">{{ t('routines.modal.fields.daysHint') }}</p>
                <div class="days-row">
                  <button
                    v-for="day in DAY_KEYS"
                    :key="day"
                    type="button"
                    class="day-btn"
                    :class="{ active: editForm.days.includes(day) }"
                    @click="toggleEditDay(day)"
                  >
                    {{ t(`days.${day}`) }}
                  </button>
                </div>
              </div>
              <div class="field">
                <label>{{ t('routines.modal.fields.reminder') }}</label>
                <input v-model="editForm.reminderTime" type="time" class="input-time" />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-ghost" @click="editingRoutineId = null">{{ t('routines.modal.cancel') }}</button>
                <button type="submit" class="btn-primary">{{ t('routines.modal.save') }}</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- New Routine modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
          <div class="modal">
            <h2 class="modal-title">{{ t('routines.modal.title') }}</h2>
            <form @submit.prevent="createRoutine" class="modal-form">
              <div class="field">
                <label>{{ t('routines.modal.fields.name') }}</label>
                <input v-model="form.name" type="text" :placeholder="t('routines.modal.fields.namePlaceholder')" required />
              </div>
              <div class="field-row">
                <div class="field">
                  <label>{{ t('routines.modal.fields.icon') }}</label>
                  <input v-model="form.icon" type="text" placeholder="✦" maxlength="2" />
                </div>
                <div class="field">
                  <label>{{ t('routines.modal.fields.color') }}</label>
                  <input v-model="form.color" type="color" />
                </div>
                <div class="field">
                  <label>{{ t('routines.modal.fields.timeBlock') }}</label>
                  <select v-model="form.timeBlock">
                    <option value="morning">{{ t('timeBlock.morning') }}</option>
                    <option value="afternoon">{{ t('timeBlock.afternoon') }}</option>
                    <option value="evening">{{ t('timeBlock.evening') }}</option>
                    <option value="anytime">{{ t('timeBlock.anytime') }}</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>{{ t('routines.modal.fields.days') }}</label>
                <p class="field-hint">{{ t('routines.modal.fields.daysHint') }}</p>
                <div class="days-row">
                  <button
                    v-for="day in DAY_KEYS"
                    :key="day"
                    type="button"
                    class="day-btn"
                    :class="{ active: form.days.includes(day) }"
                    @click="toggleDay(day)"
                  >
                    {{ t(`days.${day}`) }}
                  </button>
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-ghost" @click="showModal = false">{{ t('routines.modal.cancel') }}</button>
                <button type="submit" class="btn-primary">{{ t('routines.modal.create') }}</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useRoutineStore } from '@/stores/routines.store';
import type { TTimeBlock, TDayOfWeek, IRoutine } from '@/stores/routines.store';
import RoutineCard from '@/components/routines/RoutineCard.vue';
import HabitLibrary from '@/components/ui/HabitLibrary.vue';
import AiSuggestModal from '@/components/ui/AiSuggestModal.vue';

const { t } = useI18n();
const router = useRouter();
const store = useRoutineStore();
const showModal = ref(false);
const showAiModal = ref(false);
const editingRoutineId = ref<string | null>(null);

const editForm = reactive({
  name: '',
  icon: '✦',
  color: '#14b8a6',
  timeBlock: 'morning' as TTimeBlock,
  days: [] as TDayOfWeek[],
  reminderTime: '' as string | undefined,
});
const activeTab = ref<'all' | TTimeBlock>('all');
const habitLibraryRoutineId = ref<string | null>(null);

const DAY_KEYS: TDayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const form = reactive({
  name: '',
  icon: '✦',
  color: '#14b8a6',
  timeBlock: 'morning' as TTimeBlock,
  days: [] as TDayOfWeek[],
});

const tabs = computed(() => [
  { label: t('routines.tabs.all'),       value: 'all' as const,       count: store.routines.length },
  { label: t('routines.tabs.morning'),   value: 'morning' as const,   count: store.routines.filter((r) => r.timeBlock === 'morning').length },
  { label: t('routines.tabs.afternoon'), value: 'afternoon' as const, count: store.routines.filter((r) => r.timeBlock === 'afternoon').length },
  { label: t('routines.tabs.evening'),   value: 'evening' as const,   count: store.routines.filter((r) => r.timeBlock === 'evening').length },
  { label: t('routines.tabs.anytime'),   value: 'anytime' as const,   count: store.routines.filter((r) => r.timeBlock === 'anytime').length },
]);

const filteredRoutines = computed(() =>
  activeTab.value === 'all'
    ? store.routines
    : store.routines.filter((r) => r.timeBlock === activeTab.value),
);

function toggleDay(day: TDayOfWeek) {
  const idx = form.days.indexOf(day);
  if (idx === -1) form.days.push(day);
  else form.days.splice(idx, 1);
}

function createRoutine() {
  if (!form.name.trim()) return;
  store.addRoutine({
    name: form.name,
    icon: form.icon || '✦',
    color: form.color,
    timeBlock: form.timeBlock,
    days: [...form.days],
    items: [],
  });
  form.name = '';
  form.icon = '✦';
  form.color = '#14b8a6';
  form.timeBlock = 'morning';
  form.days = [];
  showModal.value = false;
}

function confirmDelete(id: string) {
  if (confirm(t('routines.deleteConfirm'))) {
    store.deleteRoutine(id);
  }
}

function openEditModal(routineId: string) {
  const routine = store.routines.find((r: IRoutine) => r.id === routineId);
  if (!routine) return;
  editForm.name = routine.name;
  editForm.icon = routine.icon;
  editForm.color = routine.color;
  editForm.timeBlock = routine.timeBlock;
  editForm.days = [...routine.days];
  editForm.reminderTime = routine.reminderTime ?? '';
  editingRoutineId.value = routineId;
}

function toggleEditDay(day: TDayOfWeek) {
  const idx = editForm.days.indexOf(day);
  if (idx === -1) editForm.days.push(day);
  else editForm.days.splice(idx, 1);
}

function saveEdit() {
  if (!editingRoutineId.value || !editForm.name.trim()) return;
  store.updateRoutine(editingRoutineId.value, {
    name: editForm.name,
    icon: editForm.icon || '✦',
    color: editForm.color,
    timeBlock: editForm.timeBlock,
    days: [...editForm.days],
    reminderTime: editForm.reminderTime || undefined,
  });
  editingRoutineId.value = null;
}

function openHabitLibrary(routineId: string) {
  habitLibraryRoutineId.value = routineId;
}

function startRoutine(routineId: string) {
  router.push(`/focus/${routineId}`);
}
</script>

<style scoped>
.routines-view {
  padding: var(--sp-8);
  max-width: 780px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}

.view-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.btn-ai {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-4);
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background var(--duration-fast), opacity var(--duration-fast);
}

.btn-ai:hover { background: var(--accent-glow); }

.view-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  letter-spacing: -0.8px;
  color: var(--text-primary);
}

.view-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-top: var(--sp-1);
}

.filter-tabs {
  display: flex;
  gap: var(--sp-1);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 4px;
}

.tab {
  flex: 1;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}

.tab:hover { color: var(--text-secondary); }

.tab.active {
  background: var(--bg-deep);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.tab-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  opacity: 0.6;
}

.routines-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.routine-row {
  animation: fade-in var(--duration-base) var(--ease-out) both;
}

.empty-state {
  padding: var(--sp-12) var(--sp-8);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--text-sm);
  background: var(--bg-elevated);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  align-items: center;
}

.empty-cta {
  color: var(--accent);
  text-decoration: none;
  font-size: var(--text-sm);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-4);
  background: var(--accent);
  color: #000;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: opacity var(--duration-fast), transform var(--duration-fast);
}

.btn-primary:hover { opacity: 0.9; }
.btn-primary:active { transform: scale(0.97); }

.btn-ghost {
  padding: var(--sp-2) var(--sp-4);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: background var(--duration-fast);
}

.btn-ghost:hover { background: var(--bg-overlay); }

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xl);
  padding: var(--sp-6);
  width: 440px;
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.4px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.field label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.field-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: -4px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 52px 1fr;
  gap: var(--sp-3);
}

.days-row {
  display: flex;
  gap: var(--sp-1);
}

.day-btn {
  flex: 1;
  padding: var(--sp-2) var(--sp-1);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: var(--bg-deep);
  border: 1px solid var(--border);
  transition: all var(--duration-fast);
}

.day-btn:hover { border-color: var(--border-strong); color: var(--text-primary); }

.day-btn.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent);
}

input[type="text"], select {
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--sp-2) var(--sp-3);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  transition: border-color var(--duration-fast);
}

input[type="text"]:focus, select:focus {
  border-color: var(--accent);
  outline: none;
}

input[type="color"] {
  width: 52px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-deep);
  padding: 2px;
  cursor: pointer;
}

select { appearance: none; cursor: pointer; }

.input-time {
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--sp-2) var(--sp-3);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-sm);
  transition: border-color var(--duration-fast);
  color-scheme: dark;
}

.input-time:focus {
  border-color: var(--accent);
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-2);
  padding-top: var(--sp-2);
}

.modal-enter-active, .modal-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
