<template>
  <div class="stats-view animate-fade-in">
    <div class="view-header">
      <div>
        <h1 class="view-title">{{ t('stats.title') }}</h1>
        <p class="view-subtitle">{{ t('stats.subtitle') }}</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card highlight">
        <span class="stat-icon">◆</span>
        <span class="stat-value">{{ topStreak }}</span>
        <span class="stat-label">{{ t('stats.cards.bestStreak') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ store.routines.length }}</span>
        <span class="stat-label">{{ t('stats.cards.activeRoutines') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ totalCompletions }}</span>
        <span class="stat-label">{{ t('stats.cards.totalCompletions') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ store.totalItems }}</span>
        <span class="stat-label">{{ t('stats.cards.totalSteps') }}</span>
      </div>
    </div>

    <!-- Insights -->
    <section v-if="statsStore.insights.length > 0" class="section">
      <h2 class="section-title">{{ t('stats.sections.insights') }}</h2>
      <div class="insights-list">
        <div
          v-for="(insight, i) in statsStore.insights"
          :key="i"
          class="insight-card"
          :class="`insight-${insight.type}`"
        >
          <span class="insight-icon">{{ insight.routineIcon ?? insightTypeIcon[insight.type] }}</span>
          <p class="insight-text">{{ t(insight.key, insight.params) }}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">{{ t('stats.sections.streakBoard') }}</h2>
      <div class="streak-list">
        <div
          v-for="routine in sortedByStreak"
          :key="routine.id"
          class="streak-item"
          :style="{ '--r-color': routine.color }"
        >
          <div class="streak-icon" :style="{ background: routine.color + '22' }">
            {{ routine.icon }}
          </div>
          <div class="streak-info">
            <span class="streak-name">{{ routine.name }}</span>
            <span class="streak-freq">{{ t(`timeBlock.${routine.timeBlock}`) }}</span>
          </div>
          <div class="streak-bar-wrap">
            <div class="streak-bar">
              <div
                class="streak-bar-fill"
                :style="{
                  width: maxStreak > 0 ? (routine.streak / maxStreak * 100) + '%' : '0%',
                  background: routine.color
                }"
              />
            </div>
          </div>
          <div class="streak-num">
            <span class="streak-val">{{ routine.streak }}</span>
            <span class="streak-unit">{{ routine.streak !== 1 ? t('stats.streak.days') : t('stats.streak.day') }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">{{ t('stats.sections.history') }}</h2>
      <div class="heatmap">
        <div
          v-for="(day, i) in heatmapDays"
          :key="i"
          class="heatmap-cell"
          :class="{ active: day.active }"
          :title="day.date"
        />
      </div>
      <p class="heatmap-label">{{ t('stats.sections.last63') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoutineStore } from '@/stores/routines.store';
import { useStatsStore } from '@/stores/stats.store';
import type { IInsight } from '@/stores/stats.store';

const { t } = useI18n();
const store = useRoutineStore();
const statsStore = useStatsStore();

const insightTypeIcon: Record<IInsight['type'], string> = {
  success: '✦',
  warning: '◈',
  tip: '◉',
  info: '◎',
};

const topStreak = computed(() => Math.max(0, ...store.routines.map((r) => r.streak)));
const maxStreak = computed(() => topStreak.value || 1);

const totalCompletions = computed(() =>
  store.routines.reduce((acc, r) => acc + r.completedDates.length, 0)
);

const sortedByStreak = computed(() =>
  [...store.routines].sort((a, b) => b.streak - a.streak)
);

const heatmapDays = computed(() => {
  const allDates = new Set(store.routines.flatMap((r) => r.completedDates));
  const days = [];
  for (let i = 62; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, active: allDates.has(key) });
  }
  return days;
});
</script>

<style scoped>
.stats-view {
  padding: var(--sp-8);
  max-width: 780px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
}

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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-3);
}

.stat-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.stat-card.highlight {
  border-color: var(--accent-orange);
  background: rgba(234, 88, 12, 0.08);
}

.stat-icon { font-size: 12px; color: var(--accent-orange); }

.stat-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xl);
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  animation: fade-in var(--duration-base) var(--ease-out) both;
}

.insight-success {
  background: rgba(34, 197, 94, 0.06);
  border-color: rgba(34, 197, 94, 0.2);
}

.insight-warning {
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.2);
}

.insight-tip {
  background: rgba(139, 92, 246, 0.06);
  border-color: rgba(139, 92, 246, 0.2);
}

.insight-info {
  background: rgba(20, 184, 166, 0.06);
  border-color: rgba(20, 184, 166, 0.2);
}

.insight-icon {
  font-size: 14px;
  line-height: 1.5;
  flex-shrink: 0;
}

.insight-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.section-title {
  font-size: var(--text-md);
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: -0.2px;
}

.streak-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.streak-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.streak-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.streak-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
}

.streak-name {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.streak-freq {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: capitalize;
}

.streak-bar-wrap { flex: 1; }

.streak-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.streak-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width var(--duration-slow) var(--ease-out);
}

.streak-num {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  min-width: 40px;
}

.streak-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-md);
  color: var(--text-primary);
  line-height: 1;
}

.streak-unit {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.heatmap {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 3px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  transition: background var(--duration-fast), border-color var(--duration-fast);
}

.heatmap-cell.active {
  background: var(--accent);
  border-color: var(--accent);
}

.heatmap-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
}
</style>
