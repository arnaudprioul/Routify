<template>
  <div class="today-view animate-fade-in">
    <!-- Header -->
    <div class="view-header">
      <div>
        <p class="view-greeting">{{ greeting }}<span v-if="userName">, {{ userName }}</span>.</p>
        <h1 class="view-title">{{ t('today.title') }}</h1>
        <p class="view-date">{{ dayName }} — {{ dateString }}</p>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="progress-section">
      <div class="progress-meta">
        <span class="progress-label">{{ t('today.progress.label') }}</span>
        <span class="progress-count">
          <span class="progress-done">{{ store.totalCompleted }}</span>
          <span class="progress-sep">/</span>
          <span>{{ store.totalItems }}</span>
        </span>
      </div>
      <div class="big-progress-bar">
        <div
          class="big-progress-fill"
          :style="{ width: progressPercent + '%' }"
        />
      </div>
      <Transition name="done-msg">
        <p v-if="store.totalItems > 0 && store.totalCompleted === store.totalItems" class="all-done-msg">
          {{ t('today.progress.done') }}
        </p>
      </Transition>
    </div>

    <!-- Time block sections -->
    <div v-if="hasRoutines" class="blocks">
      <section
        v-for="block in BLOCKS"
        v-show="routinesByBlock[block.key].length > 0"
        :key="block.key"
        class="block-section"
        :style="{ '--block-color': `var(--block-${block.key})`, '--block-bg': `var(--block-${block.key}-bg)` }"
      >
        <div class="block-header">
          <div class="block-pill">
            <span class="block-dot" />
            <span class="block-name">{{ t(`today.blocks.${block.key}`) }}</span>
          </div>
          <span class="block-count">{{ routinesByBlock[block.key].length }}</span>
        </div>
        <div class="block-cards">
          <RoutineCard
            v-for="routine in routinesByBlock[block.key]"
            :key="routine.id"
            :routine="routine"
            :default-expanded="block.key === currentBlock"
            @add-habit="openHabitLibrary"
          />
        </div>
      </section>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <p>{{ t('today.empty.message') }}</p>
      <RouterLink to="/templates" class="empty-cta">{{ t('today.empty.cta') }}</RouterLink>
    </div>

    <!-- Habit Library modal -->
    <HabitLibrary
      v-if="habitLibraryRoutineId"
      :routine-id="habitLibraryRoutineId"
      @close="habitLibraryRoutineId = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoutineStore } from '@/stores/routines.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import RoutineCard from '@/components/routines/RoutineCard.vue';
import HabitLibrary from '@/components/ui/HabitLibrary.vue';
import type { TTimeBlock } from '@/stores/routines.store';

const { t } = useI18n();
const store = useRoutineStore();
const onboarding = useOnboardingStore();

const userName = computed(() => onboarding.state.userName);
const habitLibraryRoutineId = ref<string | null>(null);

const BLOCKS: { key: TTimeBlock }[] = [
  { key: 'morning' },
  { key: 'afternoon' },
  { key: 'evening' },
  { key: 'anytime' },
];

const progressPercent = computed(() =>
  store.totalItems > 0 ? Math.round((store.totalCompleted / store.totalItems) * 100) : 0,
);

const routinesByBlock = computed(() => store.routinesByBlock);
const hasRoutines = computed(() =>
  BLOCKS.some((b) => routinesByBlock.value[b.key].length > 0),
);

const now = new Date();
const dayName = now.toLocaleDateString(undefined, { weekday: 'long' });
const dateString = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

const hour = now.getHours();
const greetingKey = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
const greeting = computed(() => t(`today.greeting.${greetingKey}`));

const currentBlock = computed((): TTimeBlock => {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
});

function openHabitLibrary(routineId: string) {
  habitLibraryRoutineId.value = routineId;
}
</script>

<style scoped>
.today-view {
  padding: var(--sp-8);
  max-width: 780px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
}

.view-greeting {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--sp-1);
}

.view-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.8px;
  line-height: 1.1;
}

.view-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--sp-1);
  text-transform: capitalize;
}

/* Progress */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.progress-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.progress-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-sm);
  color: var(--text-muted);
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.progress-done {
  font-size: var(--text-md);
  color: var(--text-primary);
}

.progress-sep { color: var(--border-strong); }

.big-progress-bar {
  height: 6px;
  background: var(--bg-elevated);
  border-radius: 4px;
  overflow: hidden;
}

.big-progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 4px;
  transition: width 600ms var(--ease-out);
  position: relative;
}

.big-progress-fill::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 20px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3));
  border-radius: 4px;
}

.all-done-msg {
  font-size: var(--text-xs);
  color: var(--success);
  text-align: right;
}

/* Blocks */
.blocks {
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}

.block-section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.block-pill {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  background: var(--block-bg);
  border-radius: 20px;
  padding: 4px var(--sp-3);
}

.block-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--block-color);
  flex-shrink: 0;
}

.block-name {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--block-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.block-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.block-cards {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

/* Empty */
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

.empty-cta:hover { opacity: 0.8; }

/* All-done transition */
.done-msg-enter-active { animation: fade-in var(--duration-base) var(--ease-out) both; }
.done-msg-leave-active { transition: opacity var(--duration-fast); }
.done-msg-leave-to     { opacity: 0; }
</style>
