<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">{{ t('habitLibrary.title') }}</h2>
              <p class="modal-subtitle">{{ t('habitLibrary.subtitle') }}</p>
            </div>
            <button class="btn-close" @click="$emit('close')" :aria-label="t('habitLibrary.close')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="category-row">
            <button
              v-for="cat in CATEGORIES"
              :key="cat"
              class="cat-pill"
              :class="{ active: activeCategory === cat }"
              @click="activeCategory = cat"
            >
              {{ t(`habitLibrary.categories.${cat}`) }}
            </button>
          </div>

          <div class="habits-list">
            <button
              v-for="habit in filteredHabits"
              :key="habit.id"
              class="habit-row"
              :class="{ added: addedIds.has(habit.id) }"
              @click="addHabit(habit)"
            >
              <span class="habit-icon">{{ habit.icon }}</span>
              <div class="habit-info">
                <span class="habit-label">{{ habit.label }}</span>
                <span v-if="habit.durationMin" class="habit-duration">{{ habit.durationMin }}m</span>
              </div>
              <span class="habit-add">
                <svg v-if="!addedIds.has(habit.id)" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoutineStore } from '@/stores/routines.store';

const { t } = useI18n();
const props = defineProps<{ routineId: string }>();
defineEmits<{ close: [] }>();

const store = useRoutineStore();
const addedIds = ref<Set<string>>(new Set());
const activeCategory = ref('health');

interface IHabit {
  id: string;
  label: string;
  icon: string;
  category: string;
  durationMin?: number;
}

const CATEGORIES = ['health', 'mindfulness', 'productivity', 'fitness', 'sleep', 'beauty'];

const HABITS: IHabit[] = [
  // health
  { id: 'water-500', label: 'Drink water (500ml)', icon: '◈', category: 'health', durationMin: 1 },
  { id: 'vitamins', label: 'Take vitamins', icon: '✦', category: 'health', durationMin: 1 },
  { id: 'fruit', label: 'Eat a piece of fruit', icon: '○', category: 'health', durationMin: 2 },
  { id: 'walk-10', label: '10 min walk', icon: '▷', category: 'health', durationMin: 10 },
  { id: 'posture', label: 'Check posture', icon: '◆', category: 'health', durationMin: 1 },
  // mindfulness
  { id: 'gratitude', label: 'Write 3 gratitudes', icon: '○', category: 'mindfulness', durationMin: 3 },
  { id: 'meditation-5', label: 'Meditate 5 min', icon: '○', category: 'mindfulness', durationMin: 5 },
  { id: 'journal', label: 'Free-write journal', icon: '✦', category: 'mindfulness', durationMin: 5 },
  { id: 'intention', label: "Set today's intention", icon: '◆', category: 'mindfulness', durationMin: 2 },
  { id: 'breathwork', label: 'Breathwork (4-7-8)', icon: '○', category: 'mindfulness', durationMin: 5 },
  // productivity
  { id: 'top3', label: 'Write top 3 tasks', icon: '▣', category: 'productivity', durationMin: 2 },
  { id: 'inbox', label: 'Process email inbox', icon: '◉', category: 'productivity', durationMin: 10 },
  { id: 'review', label: 'Review calendar', icon: '▷', category: 'productivity', durationMin: 2 },
  { id: 'notif-off', label: 'Turn off notifications', icon: '◈', category: 'productivity', durationMin: 1 },
  { id: 'eod', label: 'End-of-day review', icon: '◆', category: 'productivity', durationMin: 5 },
  // fitness
  { id: 'stretch-5', label: 'Stretch 5 min', icon: '◈', category: 'fitness', durationMin: 5 },
  { id: 'pushups', label: '20 push-ups', icon: '◆', category: 'fitness', durationMin: 3 },
  { id: 'plank', label: '60s plank', icon: '▣', category: 'fitness', durationMin: 2 },
  { id: 'warmup', label: 'Dynamic warm-up', icon: '▷', category: 'fitness', durationMin: 10 },
  { id: 'steps-8k', label: 'Hit 8,000 steps', icon: '○', category: 'fitness' },
  // sleep
  { id: 'no-screen', label: 'No screens 30 min before bed', icon: '◑', category: 'sleep', durationMin: 30 },
  { id: 'dim-lights', label: 'Dim lights at 9pm', icon: '◑', category: 'sleep', durationMin: 1 },
  { id: 'temp', label: 'Cool down bedroom', icon: '○', category: 'sleep', durationMin: 2 },
  { id: 'read-bed', label: 'Read before sleep', icon: '▣', category: 'sleep', durationMin: 15 },
  // beauty
  { id: 'cleanser', label: 'Cleanser', icon: '✦', category: 'beauty', durationMin: 2 },
  { id: 'moisturizer', label: 'Moisturizer', icon: '✦', category: 'beauty', durationMin: 1 },
  { id: 'spf', label: 'SPF (AM only)', icon: '☀', category: 'beauty', durationMin: 1 },
  { id: 'eye-cream', label: 'Eye cream', icon: '✦', category: 'beauty', durationMin: 1 },
  { id: 'lip-balm', label: 'Lip balm', icon: '○', category: 'beauty', durationMin: 1 },
];

const filteredHabits = computed(() =>
  HABITS.filter((h) => h.category === activeCategory.value),
);

function addHabit(habit: IHabit) {
  if (addedIds.value.has(habit.id)) return;
  store.addItemToRoutine(props.routineId, {
    label: habit.label,
    durationMin: habit.durationMin,
  });
  addedIds.value.add(habit.id);
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xl);
  padding: var(--sp-6);
  width: 420px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.4px;
}

.modal-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-top: var(--sp-1);
}

.btn-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast), background var(--duration-fast);
  flex-shrink: 0;
}

.btn-close:hover {
  color: var(--text-primary);
  background: var(--bg-overlay);
}

.category-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
}

.cat-pill {
  padding: 4px var(--sp-3);
  border-radius: 20px;
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: var(--bg-deep);
  border: 1px solid var(--border);
  transition: all var(--duration-fast) var(--ease-out);
  text-transform: capitalize;
}

.cat-pill:hover { border-color: var(--border-strong); color: var(--text-primary); }

.cat-pill.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent);
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
}

.habit-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius-sm);
  text-align: left;
  transition: background var(--duration-fast);
}

.habit-row:hover { background: var(--bg-overlay); }

.habit-row.added { opacity: 0.5; }

.habit-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.habit-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.habit-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.habit-duration {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.habit-add {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all var(--duration-fast);
}

.habit-row:not(.added):hover .habit-add {
  background: var(--accent);
  border-color: var(--accent);
  color: #000;
}

.habit-row.added .habit-add {
  background: var(--success);
  border-color: var(--success);
  color: #000;
}

/* Modal transitions */
.modal-enter-active, .modal-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
