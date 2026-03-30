<template>
  <div
    class="routine-card"
    :class="{ completed: isCompleted }"
    :style="{ '--card-color': routine.color }"
  >
    <!-- Colored left accent bar -->
    <div class="card-accent" :style="{ background: routine.color }" />

    <!-- Header -->
    <div class="card-header">
      <div class="card-icon" :style="{ background: routine.color + '22' }">
        {{ routine.icon }}
      </div>
      <div class="card-meta">
        <h3 class="card-title">{{ routine.name }}</h3>
        <span class="card-block">{{ t(`timeBlock.${routine.timeBlock}`) }}</span>
      </div>
      <div class="card-actions">
        <Transition name="badge">
          <span v-if="isCompleted" class="complete-badge">{{ t('card.complete') }}</span>
        </Transition>
        <span v-if="routine.streak > 0" class="streak-badge">
          ◆ {{ routine.streak }}
        </span>
        <button
          class="btn-start"
          :aria-label="t('card.start')"
          @click.stop="$emit('start', routine.id)"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {{ t('card.start') }}
        </button>
        <button
          class="btn-icon card-btn-edit"
          :aria-label="t('card.edit')"
          @click="$emit('edit', routine.id)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          class="btn-icon card-btn-delete"
          :aria-label="t('card.delete')"
          @click="$emit('delete', routine.id)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
        <button
          class="btn-expand"
          :aria-label="expanded ? t('card.collapse') : t('card.expand')"
          @click="expanded = !expanded"
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            :style="{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="card-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercent + '%', background: routine.color }"
        />
      </div>
      <span class="progress-text">{{ completedCount }}/{{ routine.items.length }}</span>
    </div>

    <!-- Missed banner -->
    <Transition name="missed">
      <div v-if="isMissed" class="missed-banner">
        <span class="missed-label">{{ t('card.missed') }}</span>
        <div class="missed-actions">
          <button class="btn-do-now" @click.stop="$emit('start', routine.id)">
            {{ t('card.doItNow') }}
          </button>
          <button v-if="hasShortVersion" class="btn-short" @click.stop="$emit('startShort', routine.id)">
            {{ t('card.shortVersion') }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Items -->
    <Transition name="expand">
      <div
        v-if="expanded"
        ref="listRef"
        class="card-items"
        :class="{ 'is-reordering': dragIndex !== null }"
      >
        <div
          v-for="(item, idx) in routine.items"
          :key="item.id"
          class="checklist-row"
          :class="{
            'is-editing':  editingItemId === item.id,
            'is-dragging': dragIndex === idx,
            'drop-above':  dropIndex === idx       && dragIndex !== idx,
            'drop-below':  dropIndex === routine.items.length && idx === routine.items.length - 1,
          }"
        >
          <!-- Edit mode -->
          <template v-if="editingItemId === item.id">
            <input
              ref="editInputRef"
              v-model="editLabel"
              class="item-edit-input"
              type="text"
              @keydown.enter="saveItemEdit(item.id)"
              @keydown.escape="cancelItemEdit"
            />
            <input
              v-model.number="editDuration"
              class="item-edit-duration"
              type="number"
              min="1"
              placeholder="min"
            />
            <button class="btn-item-save" @click="saveItemEdit(item.id)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <button class="btn-item-cancel" @click="cancelItemEdit">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </template>

          <!-- Normal mode -->
          <template v-else>
            <!-- Drag handle -->
            <span
              class="drag-handle"
              :aria-label="t('card.dragHandle')"
              @mousedown.prevent="startDrag(idx, $event)"
            >
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                <circle cx="3" cy="2"  r="1.4"/><circle cx="7" cy="2"  r="1.4"/>
                <circle cx="3" cy="7"  r="1.4"/><circle cx="7" cy="7"  r="1.4"/>
                <circle cx="3" cy="12" r="1.4"/><circle cx="7" cy="12" r="1.4"/>
              </svg>
            </span>

            <button
              class="checklist-item"
              :class="{ done: item.completed }"
              @click="store.toggleItem(routine.id, item.id)"
            >
              <span
                class="check-box"
                :style="item.completed ? { borderColor: routine.color, background: routine.color } : {}"
              >
                <svg
                  v-if="item.completed"
                  width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="#000" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span class="item-label">{{ item.label }}</span>
              <span v-if="item.durationMin" class="item-duration">{{ item.durationMin }}m</span>
            </button>
            <div class="item-controls">
              <button
                class="btn-icon btn-item-edit"
                :aria-label="t('card.editItem')"
                @click.stop="startItemEdit(item)"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                class="btn-icon btn-item-delete"
                :aria-label="t('card.deleteItem')"
                @click.stop="store.deleteItem(routine.id, item.id)"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </template>
        </div>

        <!-- Add habit button -->
        <button class="add-habit-btn" :aria-label="t('card.addHabit')" @click="$emit('addHabit', routine.id)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {{ t('card.addHabit') }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { IRoutine, IRoutineItem } from '@/stores/routines.store';
import { useRoutineStore } from '@/stores/routines.store';

const { t } = useI18n();
defineEmits<{
  addHabit: [routineId: string];
  edit: [routineId: string];
  delete: [routineId: string];
  start: [routineId: string];
  startShort: [routineId: string];
}>();
const props = defineProps<{ routine: IRoutine; defaultExpanded?: boolean }>();
const store = useRoutineStore();
const expanded = ref(props.defaultExpanded ?? false);

// ── Pointer-based drag & drop (replaces HTML5 DnD — broken in WKWebView/Tauri) ──
const listRef = ref<HTMLElement | null>(null);
const dragIndex = ref<number | null>(null);
const dropIndex = ref<number | null>(null);

/** Returns the slot index (0…n) the cursor is currently over.
 *  Slot i means "insert before item i"; slot n means "insert after last item". */
function slotFromY(clientY: number): number {
  if (!listRef.value) return 0;
  const rows = Array.from(
    listRef.value.querySelectorAll<HTMLElement>('.checklist-row:not(.is-editing)'),
  );
  for (let i = 0; i < rows.length; i++) {
    const { top, height } = rows[i].getBoundingClientRect();
    if (clientY < top + height / 2) return i;
  }
  return rows.length;
}

function startDrag(idx: number, _e: MouseEvent) {
  dragIndex.value = idx;
  dropIndex.value = idx;

  function onMove(ev: MouseEvent) {
    dropIndex.value = slotFromY(ev.clientY);
  }

  function onUp() {
    const from = dragIndex.value;
    const slot = dropIndex.value;
    dragIndex.value = null;
    dropIndex.value = null;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);

    if (from === null || slot === null || from === slot) return;
    // When moving down, removing 'from' shifts subsequent indices by -1
    const to = from < slot ? slot - 1 : slot;
    if (from !== to) store.reorderItems(props.routine.id, from, to);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

onUnmounted(() => {
  dragIndex.value = null;
  dropIndex.value = null;
});

// Item inline editing
const editingItemId = ref<string | null>(null);
const editLabel = ref('');
const editDuration = ref<number | undefined>(undefined);
const editInputRef = ref<HTMLInputElement | null>(null);

function startItemEdit(item: IRoutineItem) {
  editingItemId.value = item.id;
  editLabel.value = item.label;
  editDuration.value = item.durationMin;
  nextTick(() => editInputRef.value?.focus());
}

function saveItemEdit(itemId: string) {
  if (!editLabel.value.trim()) return;
  store.updateItem(props.routine.id, itemId, {
    label: editLabel.value.trim(),
    durationMin: editDuration.value || undefined,
  });
  editingItemId.value = null;
}

function cancelItemEdit() {
  editingItemId.value = null;
}

const completedCount = computed(() => props.routine.items.filter((i) => i.completed).length);
const isCompleted = computed(
  () => completedCount.value === props.routine.items.length && props.routine.items.length > 0,
);
const progressPercent = computed(() =>
  props.routine.items.length ? (completedCount.value / props.routine.items.length) * 100 : 0,
);

// Missed: has a reminder, current time is past it, not yet completed today
const isMissed = computed(() => {
  if (isCompleted.value || !props.routine.reminderTime) return false;
  const [h, m] = props.routine.reminderTime.split(':').map(Number);
  const now = new Date();
  const reminderMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
  return Date.now() > reminderMs + 5 * 60 * 1000; // 5 min grace period
});

// Short version: items that cumulatively fit within 15 minutes
const hasShortVersion = computed(() => {
  const totalMin = props.routine.items.reduce((s, i) => s + (i.durationMin ?? 2), 0);
  return totalMin > 15 && props.routine.items.length > 1;
});
</script>

<style scoped>
.routine-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--sp-4) var(--sp-4) var(--sp-4) calc(var(--sp-4) + 6px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  overflow: hidden;
  transition: border-color var(--duration-base) var(--ease-out),
              box-shadow var(--duration-base) var(--ease-out);
}

.routine-card:hover {
  border-color: var(--border-strong);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.routine-card.completed {
  border-color: var(--card-color, var(--accent));
  opacity: 0.8;
}

/* Left accent bar */
.card-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.card-meta { flex: 1; min-width: 0; }

.card-title {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-block {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.complete-badge {
  font-size: var(--text-xs);
  color: var(--success);
  background: rgba(34, 197, 94, 0.12);
  border-radius: 6px;
  padding: 2px 6px;
  font-weight: 500;
  animation: complete-burst 400ms var(--ease-out) both;
}

.streak-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--accent-orange);
  background: rgba(234, 88, 12, 0.12);
  border-radius: 6px;
  padding: 2px 6px;
  animation: streak-pop 400ms var(--ease-out) both;
}

@keyframes streak-pop {
  0%   { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

/* Shared icon button */
.btn-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: color var(--duration-fast), background var(--duration-fast);
}

/* Start button */
.btn-start {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px var(--sp-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  background: var(--card-color, var(--accent));
  color: #000;
  opacity: 0;
  transition: opacity var(--duration-fast), transform var(--duration-fast);
  flex-shrink: 0;
}

.routine-card:hover .btn-start {
  opacity: 1;
}

.btn-start:hover {
  opacity: 0.85 !important;
}

/* Card-level edit/delete — hidden until hover */
.card-btn-edit,
.card-btn-delete {
  opacity: 0;
  transition: opacity var(--duration-fast), color var(--duration-fast), background var(--duration-fast);
}

.routine-card:hover .card-btn-edit,
.routine-card:hover .card-btn-delete {
  opacity: 1;
}

.card-btn-edit:hover {
  color: var(--accent);
  background: var(--accent-glow);
}

.card-btn-delete:hover {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
}

.btn-expand {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: color var(--duration-fast) var(--ease-out),
              background var(--duration-fast) var(--ease-out);
}

.btn-expand:hover {
  color: var(--text-primary);
  background: var(--bg-overlay);
}

.card-progress {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.progress-bar {
  flex: 1;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width var(--duration-slow) var(--ease-out);
}

.progress-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--text-muted);
  min-width: 28px;
  text-align: right;
}

.card-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: var(--sp-1);
  border-top: 1px solid var(--border);
}

/* During drag: block all child pointer events so dragover/drop land on .checklist-row */
.card-items.is-reordering .checklist-row > * {
  pointer-events: none;
}

/* Item row wrapper */
.checklist-row {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  border-radius: var(--radius-sm);
  transition: background var(--duration-fast), opacity var(--duration-fast);
  position: relative;
}

.checklist-row:hover { background: var(--bg-overlay); }

/* Drag states */
.checklist-row.is-dragging {
  opacity: 0.35;
}

.checklist-row.drop-above::before {
  content: '';
  position: absolute;
  top: -1px;
  left: var(--sp-2);
  right: var(--sp-2);
  height: 2px;
  background: var(--accent);
  border-radius: 2px;
  pointer-events: none;
}

/* Drop indicator — after last item */
.checklist-row.drop-below::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: var(--sp-2);
  right: var(--sp-2);
  height: 2px;
  background: var(--accent);
  border-radius: 2px;
  pointer-events: none;
}

/* Drag handle */
.drag-handle {
  width: 20px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: grab;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--duration-fast);
}

.drag-handle:active { cursor: grabbing; }

.checklist-row:hover .drag-handle { opacity: 1; }

/* Item controls (edit + delete) — hidden until row hover */
.item-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--duration-fast);
  padding-right: var(--sp-1);
}

.checklist-row:hover .item-controls { opacity: 1; }

.btn-item-edit:hover { color: var(--accent); background: var(--accent-glow); }
.btn-item-delete:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }

/* The actual toggle button inside the row */
.checklist-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2);
  text-align: left;
  min-width: 0;
  background: transparent;
}

.check-box {
  width: 22px;
  height: 22px;
  border: 1.5px solid var(--border-strong);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color var(--duration-fast) var(--ease-out),
              background var(--duration-fast) var(--ease-out);
}

.checklist-item.done .check-box {
  animation: check-box-scale 280ms var(--ease-out) both;
}

.checklist-item.done .check-box svg {
  animation: check-pop 250ms var(--ease-out) both;
}

@keyframes check-box-scale {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.22); }
  100% { transform: scale(1); }
}

.item-label {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: color var(--duration-fast) var(--ease-out);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checklist-item.done .item-label {
  color: var(--text-muted);
  text-decoration: line-through;
}

.item-duration {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--text-muted);
  flex-shrink: 0;
}

/* Inline edit mode */
.checklist-row.is-editing {
  background: var(--bg-overlay);
  padding: var(--sp-1) var(--sp-2);
  gap: var(--sp-2);
}

.item-edit-input {
  flex: 1;
  background: var(--bg-deep);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 3px var(--sp-2);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  min-width: 0;
}

.item-edit-input:focus { outline: none; }

.item-edit-duration {
  width: 52px;
  background: var(--bg-deep);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 3px var(--sp-2);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  flex-shrink: 0;
}

.item-edit-duration:focus { outline: none; border-color: var(--accent); }

.btn-item-save {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #000;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition: opacity var(--duration-fast);
}

.btn-item-save:hover { opacity: 0.85; }

.btn-item-cancel {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition: color var(--duration-fast), background var(--duration-fast);
}

.btn-item-cancel:hover { color: var(--text-primary); background: var(--bg-overlay); }

/* Missed banner */
.missed-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--radius-sm);
}

.missed-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--accent-amber);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.missed-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.btn-do-now {
  padding: 3px var(--sp-3);
  background: var(--accent-amber);
  color: #000;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  transition: opacity var(--duration-fast);
}

.btn-do-now:hover { opacity: 0.85; }

.btn-short {
  padding: 3px var(--sp-3);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: var(--accent-amber);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  transition: background var(--duration-fast);
}

.btn-short:hover { background: rgba(245, 158, 11, 0.1); }

.missed-enter-active { animation: fade-in var(--duration-base) var(--ease-out) both; }
.missed-leave-active { transition: opacity var(--duration-fast); }
.missed-leave-to     { opacity: 0; }

/* Add habit */
.add-habit-btn {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2);
  color: var(--text-muted);
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast), background var(--duration-fast);
  margin-top: 2px;
}

.add-habit-btn:hover {
  color: var(--accent);
  background: var(--bg-overlay);
}

/* Badge enter animation */
.badge-enter-active { animation: complete-burst 400ms var(--ease-out) both; }
.badge-leave-active { transition: opacity var(--duration-fast); }
.badge-leave-to     { opacity: 0; }

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: opacity var(--duration-base) var(--ease-out),
              transform var(--duration-base) var(--ease-out);
}
.expand-enter-from { opacity: 0; transform: translateY(-4px); }
.expand-leave-to   { opacity: 0; transform: translateY(-4px); }
</style>
