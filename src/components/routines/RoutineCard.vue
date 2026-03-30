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
          class="btn-expand"
          @click="expanded = !expanded"
          :aria-label="expanded ? t('card.collapse') : t('card.expand')"
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

    <!-- Items -->
    <Transition name="expand">
      <div v-if="expanded" class="card-items">
        <button
          v-for="item in routine.items"
          :key="item.id"
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

        <!-- Add habit button -->
        <button class="add-habit-btn" @click="$emit('addHabit', routine.id)" :aria-label="t('card.addHabit')">
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
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { IRoutine } from '@/stores/routines.store';
import { useRoutineStore } from '@/stores/routines.store';

const { t } = useI18n();
defineEmits<{ addHabit: [routineId: string] }>();
const props = defineProps<{ routine: IRoutine; defaultExpanded?: boolean }>();
const store = useRoutineStore();
const expanded = ref(props.defaultExpanded ?? false);

const completedCount = computed(() => props.routine.items.filter((i) => i.completed).length);
const isCompleted = computed(
  () => completedCount.value === props.routine.items.length && props.routine.items.length > 0,
);
const progressPercent = computed(() =>
  props.routine.items.length ? (completedCount.value / props.routine.items.length) * 100 : 0,
);
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
  gap: var(--sp-2);
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

.checklist-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2);
  border-radius: var(--radius-sm);
  text-align: left;
  transition: background var(--duration-fast) var(--ease-out);
}

.checklist-item:hover { background: var(--bg-overlay); }

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

.checklist-item.done .check-box svg {
  animation: check-pop 250ms var(--ease-out) both;
}

.item-label {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: color var(--duration-fast) var(--ease-out);
}

.checklist-item.done .item-label {
  color: var(--text-muted);
  text-decoration: line-through;
}

.item-duration {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

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
