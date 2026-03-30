<template>
  <aside class="sidebar">
    <!-- App brand -->
    <div class="sidebar-brand">
      <div class="brand-icon">R</div>
      <div class="brand-text">
        <span class="brand-name">Routify</span>
        <span v-if="userName" class="brand-user">{{ userName }}</span>
      </div>
    </div>

    <!-- Progress ring -->
    <div class="sidebar-progress">
      <ProgressRing :value="progressPercent" />
      <div class="progress-meta">
        <span class="progress-label">{{ t('sidebar.progress.label') }}</span>
        <span class="progress-count">{{ totalCompleted }}/{{ totalItems }}</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: $route.path === item.to }"
      >
        <span class="nav-icon" v-html="item.icon" />
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </RouterLink>
    </nav>

    <!-- Bottom -->
    <div class="sidebar-footer">
      <button
        class="btn-deep-focus"
        :class="{ active: ui.deepFocus }"
        :aria-label="t('sidebar.deepFocus')"
        @click="ui.toggleDeepFocus()"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ t('sidebar.deepFocus') }}
      </button>
      <LangSwitcher variant="sidebar" />
      <div class="footer-divider" />
      <div class="streak-row">
        <span class="streak-fire">◆</span>
        <span class="streak-count">{{ topStreak }}</span>
        <span class="streak-label">{{ t('sidebar.streak.label') }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoutineStore } from '@/stores/routines.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useUiStore } from '@/stores/ui.store';
import ProgressRing from '@/components/ui/ProgressRing.vue';
import LangSwitcher from '@/components/ui/LangSwitcher.vue';

const { t } = useI18n();
const store = useRoutineStore();
const onboarding = useOnboardingStore();
const ui = useUiStore();

const userName = computed(() => onboarding.state.userName);
const totalCompleted = computed(() => store.totalCompleted);
const totalItems = computed(() => store.totalItems);
const progressPercent = computed(() =>
  totalItems.value > 0 ? Math.round((totalCompleted.value / totalItems.value) * 100) : 0,
);

const topStreak = computed(() =>
  Math.max(0, ...store.routines.map((r) => r.streak)),
);

const navItems = computed(() => [
  {
    to: '/today',
    label: t('sidebar.nav.today'),
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  },
  {
    to: '/routines',
    label: t('sidebar.nav.routines'),
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    badge: store.routines.length,
  },
  {
    to: '/templates',
    label: t('sidebar.nav.templates'),
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  },
  {
    to: '/breathe',
    label: t('sidebar.nav.breathe'),
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
  },
  {
    to: '/stats',
    label: t('sidebar.nav.stats'),
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  },
]);
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: 100%;
  background: var(--bg-deep);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: var(--sp-4);
  gap: var(--sp-6);
  overflow: hidden;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2);
  margin-top: var(--sp-2);
}

.brand-icon {
  width: 28px;
  height: 28px;
  background: var(--accent);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #000;
  flex-shrink: 0;
  letter-spacing: -0.5px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-name {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  line-height: 1;
}

.brand-user {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.sidebar-progress {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.progress-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.progress-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-md);
  font-weight: 400;
  color: var(--text-primary);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
  cursor: pointer;
  position: relative;
}

.nav-item:hover {
  background: var(--bg-overlay);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-glow);
  color: var(--accent);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.nav-label { flex: 1; }

.nav-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: var(--bg-elevated);
  border-radius: 4px;
  padding: 1px 5px;
}

.sidebar-footer {
  padding: var(--sp-3) var(--sp-2);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.btn-deep-focus {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text-muted);
  transition: background var(--duration-fast), color var(--duration-fast);
}

.btn-deep-focus:hover {
  background: var(--bg-overlay);
  color: var(--text-secondary);
}

.btn-deep-focus.active {
  background: var(--accent-glow);
  color: var(--accent);
}

.footer-divider {
  height: 1px;
  background: var(--border);
}

.streak-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--text-sm);
}

.streak-fire {
  color: var(--accent-orange);
  font-size: 12px;
  animation: streak-pulse 2s ease-in-out infinite;
}

.streak-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-md);
  color: var(--accent-orange);
  font-weight: 400;
}

.streak-label {
  color: var(--text-muted);
  font-size: var(--text-xs);
}
</style>
