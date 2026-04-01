<template>
  <div class="templates-view animate-fade-in">
    <div class="view-header">
      <div>
        <h1 class="view-title">{{ t('templates.title') }}</h1>
        <p class="view-subtitle">{{ t('templates.subtitle') }}</p>
      </div>
    </div>

    <div class="category-row">
      <button
        v-for="cat in categories"
        :key="cat.value"
        class="cat-pill"
        :class="{ active: activeCategory === cat.value }"
        @click="activeCategory = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="templates-grid">
      <div
        v-for="(tpl, i) in filteredTemplates"
        :key="tpl.id"
        class="template-card"
        :style="{ '--tpl-color': tpl.color, animationDelay: `${i * 50}ms` }"
      >
        <div class="tpl-icon-wrap" :style="{ background: tpl.color + '22' }">
          {{ tpl.icon }}
        </div>
        <div class="tpl-body">
          <div class="tpl-tag">{{ t(`templates.categories.${tpl.categoryKey}`) }}</div>
          <h3 class="tpl-name">{{ t(`templates.items.${tpl.id}.name`) }}</h3>
          <p class="tpl-desc">{{ t(`templates.items.${tpl.id}.description`) }}</p>
          <div class="tpl-meta">
            <span>{{ t('templates.meta.steps', { n: tpl.stepKeys.length }) }}</span>
            <span>{{ t('templates.meta.min', { n: tpl.totalMin }) }}</span>
          </div>
        </div>
        <button
          class="tpl-add-btn"
          :class="{ added: addedIds.has(tpl.id) }"
          @click="addTemplate(tpl)"
          :aria-label="t(`templates.items.${tpl.id}.name`)"
        >
          <svg v-if="!addedIds.has(tpl.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoutineStore } from '@/stores/routines.store';
import type { TTimeBlock, TDayOfWeek } from '@/stores/routines.store';

const { t } = useI18n();
const store = useRoutineStore();
const activeCategory = ref('all');
const addedIds = ref<Set<string>>(new Set());

interface ITemplateStep {
  key: string;
  durationMin?: number;
}

interface ITemplateDef {
  id: string;
  icon: string;
  color: string;
  categoryKey: string;
  timeBlock: TTimeBlock;
  days?: TDayOfWeek[];
  stepKeys: ITemplateStep[];
  totalMin: number;
}

const TEMPLATES: ITemplateDef[] = [
  {
    id: 'morningPower',
    icon: '☀',
    color: '#f59e0b',
    categoryKey: 'lifestyle',
    timeBlock: 'morning',
    stepKeys: [
      { key: 'water', durationMin: 1 },
      { key: 'stretch', durationMin: 5 },
      { key: 'shower', durationMin: 5 },
      { key: 'journal', durationMin: 5 },
      { key: 'goals', durationMin: 3 },
    ],
    totalMin: 19,
  },
  {
    id: 'glowUpSkincare',
    icon: '✦',
    color: '#ec4899',
    categoryKey: 'beauty',
    timeBlock: 'morning',
    stepKeys: [
      { key: 'cleanser', durationMin: 2 },
      { key: 'toner', durationMin: 1 },
      { key: 'serum', durationMin: 2 },
      { key: 'eyeCream', durationMin: 1 },
      { key: 'moisturizer', durationMin: 2 },
      { key: 'spf', durationMin: 1 },
    ],
    totalMin: 9,
  },
  {
    id: 'athleteMode',
    icon: '◈',
    color: '#14b8a6',
    categoryKey: 'fitness',
    timeBlock: 'anytime',
    days: ['mon', 'wed', 'fri'],
    stepKeys: [
      { key: 'warmup', durationMin: 10 },
      { key: 'training', durationMin: 45 },
      { key: 'cooldown', durationMin: 10 },
      { key: 'hydration', durationMin: 1 },
      { key: 'nutrition', durationMin: 5 },
    ],
    totalMin: 71,
  },
  {
    id: 'deepWork',
    icon: '◉',
    color: '#7c3aed',
    categoryKey: 'productivity',
    timeBlock: 'afternoon',
    stepKeys: [
      { key: 'clear', durationMin: 2 },
      { key: 'priority', durationMin: 2 },
      { key: 'focus1', durationMin: 25 },
      { key: 'break', durationMin: 5 },
      { key: 'focus2', durationMin: 25 },
    ],
    totalMin: 59,
  },
  {
    id: 'eveningWindDown',
    icon: '◑',
    color: '#6366f1',
    categoryKey: 'lifestyle',
    timeBlock: 'evening',
    stepKeys: [
      { key: 'noScreens', durationMin: 30 },
      { key: 'skincare', durationMin: 5 },
      { key: 'journal', durationMin: 5 },
      { key: 'read', durationMin: 15 },
      { key: 'intention', durationMin: 2 },
    ],
    totalMin: 57,
  },
  {
    id: 'cleanSpace',
    icon: '▣',
    color: '#22c55e',
    categoryKey: 'home',
    timeBlock: 'anytime',
    days: ['sat'],
    stepKeys: [
      { key: 'bed', durationMin: 5 },
      { key: 'surfaces', durationMin: 5 },
      { key: 'vacuum', durationMin: 10 },
      { key: 'bins', durationMin: 3 },
      { key: 'kitchen', durationMin: 5 },
    ],
    totalMin: 28,
  },
  {
    id: 'entrepreneurPack',
    icon: '⬡',
    color: '#ea580c',
    categoryKey: 'productivity',
    timeBlock: 'morning',
    stepKeys: [
      { key: 'metrics', durationMin: 5 },
      { key: 'tasks', durationMin: 3 },
      { key: 'inbox', durationMin: 20 },
      { key: 'outreach', durationMin: 5 },
      { key: 'eod', durationMin: 5 },
    ],
    totalMin: 38,
  },
  {
    id: 'mindfulness',
    icon: '○',
    color: '#a855f7',
    categoryKey: 'wellbeing',
    timeBlock: 'morning',
    stepKeys: [
      { key: 'breathwork', durationMin: 5 },
      { key: 'meditation', durationMin: 10 },
      { key: 'gratitude', durationMin: 3 },
      { key: 'intention', durationMin: 2 },
    ],
    totalMin: 20,
  },
];

const categories = computed(() => [
  { value: 'all', label: t('templates.categories.all') },
  { value: 'lifestyle', label: t('templates.categories.lifestyle') },
  { value: 'beauty', label: t('templates.categories.beauty') },
  { value: 'fitness', label: t('templates.categories.fitness') },
  { value: 'productivity', label: t('templates.categories.productivity') },
  { value: 'home', label: t('templates.categories.home') },
  { value: 'wellbeing', label: t('templates.categories.wellbeing') },
]);

const filteredTemplates = computed(() =>
  activeCategory.value === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((tpl) => tpl.categoryKey === activeCategory.value),
);

function addTemplate(tpl: ITemplateDef) {
  if (addedIds.value.has(tpl.id)) return;
  const generateId = () => Math.random().toString(36).slice(2, 10);
  store.addRoutine({
    name: t(`templates.items.${tpl.id}.name`),
    icon: tpl.icon,
    color: tpl.color,
    timeBlock: tpl.timeBlock,
    days: tpl.days ?? [],
    recurrence: 'daily',
    items: tpl.stepKeys.map((s) => ({
      id: generateId(),
      label: t(`templates.items.${tpl.id}.steps.${s.key}`),
      durationMin: s.durationMin,
      completed: false,
    })),
  });
  addedIds.value.add(tpl.id);
}
</script>

<style scoped>
.templates-view {
  padding: var(--sp-8);
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}

.view-header { margin-bottom: var(--sp-2); }

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

.category-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.cat-pill {
  padding: 5px var(--sp-3);
  border-radius: 20px;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  transition: all var(--duration-fast) var(--ease-out);
}

.cat-pill:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.cat-pill.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent);
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--sp-4);
}

.template-card {
  position: relative;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  animation: fade-in var(--duration-base) var(--ease-out) both;
  transition: border-color var(--duration-base) var(--ease-out),
              box-shadow var(--duration-base) var(--ease-out);
}

.template-card:hover {
  border-color: var(--tpl-color, var(--border-strong));
  box-shadow: 0 0 0 1px var(--tpl-color, transparent), 0 8px 32px rgba(0, 0, 0, 0.3);
}

.tpl-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.tpl-body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  flex: 1;
}

.tpl-tag {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tpl-name {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.tpl-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  flex: 1;
}

.tpl-meta {
  display: flex;
  gap: var(--sp-3);
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--sp-2);
}

.tpl-add-btn {
  position: absolute;
  top: var(--sp-4);
  right: var(--sp-4);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all var(--duration-fast) var(--ease-out);
}

.tpl-add-btn:hover {
  background: var(--tpl-color, var(--accent));
  border-color: var(--tpl-color, var(--accent));
  color: #000;
}

.tpl-add-btn.added {
  background: var(--success);
  border-color: var(--success);
  color: #000;
}
</style>
