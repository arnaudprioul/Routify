<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal">

          <!-- Header -->
          <div class="modal-header">
            <div>
              <h2 class="modal-title">{{ t('habitLibrary.title') }}</h2>
              <p class="modal-subtitle">{{ t('habitLibrary.subtitle') }}</p>
            </div>
            <button class="btn-close" :aria-label="t('habitLibrary.close')" @click="$emit('close')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Search -->
          <div class="search-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="t('habitLibrary.searchPlaceholder')"
              @keydown.enter="addCustomFromSearch"
              @keydown.escape="clearSearch"
            />
            <button v-if="searchQuery" class="search-clear" @click="clearSearch">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Category pills — hidden while searching -->
          <Transition name="slide-down">
            <div v-if="!isSearching" class="category-row">
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
          </Transition>

          <!-- Results -->
          <div class="habits-list">

            <!-- Custom create row — shown when there's a query -->
            <button
              v-if="isSearching"
              class="habit-row habit-row--create"
              :class="{ added: customAdded }"
              @click="addCustomFromSearch"
            >
              <span class="habit-icon">
                <svg v-if="!customAdded" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <div class="habit-info">
                <span class="habit-label">
                  <span class="create-prefix">{{ t('habitLibrary.create') }}</span>
                  "{{ searchQuery }}"
                </span>
              </div>
              <span class="hint-enter">↵</span>
            </button>

            <!-- Divider between custom + suggestions -->
            <div v-if="isSearching && displayedHabits.length" class="list-divider">
              {{ t('habitLibrary.suggestions') }}
            </div>

            <!-- Habit rows -->
            <template v-if="displayedHabits.length">
              <button
                v-for="habit in displayedHabits"
                :key="habit.id"
                class="habit-row"
                :class="{ added: addedIds.has(habit.id) }"
                @click="addHabit(habit)"
              >
                <span class="habit-icon">{{ habit.icon }}</span>
                <div class="habit-info">
                  <!-- Highlighted label in search mode -->
                  <span class="habit-label">
                    <template v-if="isSearching">
                      <span
                        v-for="(part, i) in highlightParts(habit.label)"
                        :key="i"
                        :class="{ highlight: part.match }"
                      >{{ part.text }}</span>
                    </template>
                    <template v-else>{{ habit.label }}</template>
                  </span>
                  <span v-if="isSearching" class="habit-category-badge">
                    {{ t(`habitLibrary.categories.${habit.category}`) }}
                  </span>
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
            </template>

            <!-- Empty state -->
            <div v-else-if="isSearching" class="empty-state">
              {{ t('habitLibrary.noResults') }}
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoutineStore } from '@/stores/routines.store';

const { t } = useI18n();
const props = defineProps<{ routineId: string }>();
defineEmits<{ close: [] }>();

const store = useRoutineStore();
const addedIds = ref<Set<string>>(new Set());
const activeCategory = ref('health');
const searchQuery = ref('');
const customAdded = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => nextTick(() => searchInputRef.value?.focus()));

interface IHabit {
  id: string;
  label: string;
  icon: string;
  category: string;
  durationMin?: number;
}

const CATEGORIES = ['health', 'mindfulness', 'productivity', 'fitness', 'sleep', 'beauty'];

const HABITS: IHabit[] = [
  { id: 'water-500', label: 'Drink water (500ml)', icon: '◈', category: 'health', durationMin: 1 },
  { id: 'vitamins', label: 'Take vitamins', icon: '✦', category: 'health', durationMin: 1 },
  { id: 'fruit', label: 'Eat a piece of fruit', icon: '○', category: 'health', durationMin: 2 },
  { id: 'walk-10', label: '10 min walk', icon: '▷', category: 'health', durationMin: 10 },
  { id: 'posture', label: 'Check posture', icon: '◆', category: 'health', durationMin: 1 },
  { id: 'gratitude', label: 'Write 3 gratitudes', icon: '○', category: 'mindfulness', durationMin: 3 },
  { id: 'meditation-5', label: 'Meditate 5 min', icon: '○', category: 'mindfulness', durationMin: 5 },
  { id: 'journal', label: 'Free-write journal', icon: '✦', category: 'mindfulness', durationMin: 5 },
  { id: 'intention', label: "Set today's intention", icon: '◆', category: 'mindfulness', durationMin: 2 },
  { id: 'breathwork', label: 'Breathwork (4-7-8)', icon: '○', category: 'mindfulness', durationMin: 5 },
  { id: 'top3', label: 'Write top 3 tasks', icon: '▣', category: 'productivity', durationMin: 2 },
  { id: 'inbox', label: 'Process email inbox', icon: '◉', category: 'productivity', durationMin: 10 },
  { id: 'review', label: 'Review calendar', icon: '▷', category: 'productivity', durationMin: 2 },
  { id: 'notif-off', label: 'Turn off notifications', icon: '◈', category: 'productivity', durationMin: 1 },
  { id: 'eod', label: 'End-of-day review', icon: '◆', category: 'productivity', durationMin: 5 },
  { id: 'stretch-5', label: 'Stretch 5 min', icon: '◈', category: 'fitness', durationMin: 5 },
  { id: 'pushups', label: '20 push-ups', icon: '◆', category: 'fitness', durationMin: 3 },
  { id: 'plank', label: '60s plank', icon: '▣', category: 'fitness', durationMin: 2 },
  { id: 'warmup', label: 'Dynamic warm-up', icon: '▷', category: 'fitness', durationMin: 10 },
  { id: 'steps-8k', label: 'Hit 8,000 steps', icon: '○', category: 'fitness' },
  { id: 'no-screen', label: 'No screens 30 min before bed', icon: '◑', category: 'sleep', durationMin: 30 },
  { id: 'dim-lights', label: 'Dim lights at 9pm', icon: '◑', category: 'sleep', durationMin: 1 },
  { id: 'temp', label: 'Cool down bedroom', icon: '○', category: 'sleep', durationMin: 2 },
  { id: 'read-bed', label: 'Read before sleep', icon: '▣', category: 'sleep', durationMin: 15 },
  { id: 'cleanser', label: 'Cleanser', icon: '✦', category: 'beauty', durationMin: 2 },
  { id: 'moisturizer', label: 'Moisturizer', icon: '✦', category: 'beauty', durationMin: 1 },
  { id: 'spf', label: 'SPF (AM only)', icon: '☀', category: 'beauty', durationMin: 1 },
  { id: 'eye-cream', label: 'Eye cream', icon: '✦', category: 'beauty', durationMin: 1 },
  { id: 'lip-balm', label: 'Lip balm', icon: '○', category: 'beauty', durationMin: 1 },
];

const isSearching = computed(() => searchQuery.value.trim().length > 0);

const displayedHabits = computed(() => {
  if (!isSearching.value) {
    return HABITS.filter((h) => h.category === activeCategory.value);
  }
  const q = searchQuery.value.trim().toLowerCase();
  return HABITS.filter((h) => h.label.toLowerCase().includes(q));
});

function highlightParts(label: string): { text: string; match: boolean }[] {
  const q = searchQuery.value.trim();
  if (!q) return [{ text: label, match: false }];
  const idx = label.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return [{ text: label, match: false }];
  return [
    { text: label.slice(0, idx), match: false },
    { text: label.slice(idx, idx + q.length), match: true },
    { text: label.slice(idx + q.length), match: false },
  ].filter((p) => p.text.length > 0);
}

function addHabit(habit: IHabit) {
  if (addedIds.value.has(habit.id)) return;
  store.addItemToRoutine(props.routineId, { label: habit.label, durationMin: habit.durationMin });
  addedIds.value.add(habit.id);
}

function addCustomFromSearch() {
  const label = searchQuery.value.trim();
  if (!label || customAdded.value) return;
  store.addItemToRoutine(props.routineId, { label });
  customAdded.value = true;
}

function clearSearch() {
  searchQuery.value = '';
  customAdded.value = false;
  searchInputRef.value?.focus();
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
  flex-shrink: 0;
  transition: color var(--duration-fast), background var(--duration-fast);
}

.btn-close:hover { color: var(--text-primary); background: var(--bg-overlay); }

/* Search */
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--sp-3);
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  background: var(--bg-deep);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  padding: var(--sp-2) var(--sp-8) var(--sp-2) calc(var(--sp-3) + 14px + var(--sp-2));
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  transition: border-color var(--duration-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
}

.search-input::placeholder { color: var(--text-muted); }

.search-clear {
  position: absolute;
  right: var(--sp-2);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast);
}

.search-clear:hover { color: var(--text-primary); }

/* Category pills */
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

/* List */
.habits-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.list-divider {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--sp-1) var(--sp-3);
  margin-top: var(--sp-1);
}

/* Create custom row */
.habit-row--create {
  border: 1px dashed var(--accent);
  border-radius: var(--radius-sm);
  color: var(--accent);
  background: var(--accent-glow);
}

.habit-row--create .habit-icon {
  color: var(--accent);
}

.habit-row--create:hover { background: rgba(20, 184, 166, 0.15); }
.habit-row--create.added { opacity: 0.5; }

.create-prefix {
  color: var(--text-muted);
  margin-right: 4px;
}

.hint-enter {
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 5px;
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
}

/* Habit rows */
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.habit-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  min-width: 0;
  flex-wrap: wrap;
}

.habit-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.highlight {
  color: var(--accent);
  font-weight: 600;
}

.habit-category-badge {
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 5px;
  text-transform: capitalize;
  flex-shrink: 0;
}

.habit-duration {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--text-muted);
  flex-shrink: 0;
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

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--sp-8) 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* Slide-down for category row */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity var(--duration-base) var(--ease-out),
              transform var(--duration-base) var(--ease-out),
              max-height var(--duration-base) var(--ease-out);
  max-height: 80px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}

/* Modal transitions */
.modal-enter-active, .modal-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
