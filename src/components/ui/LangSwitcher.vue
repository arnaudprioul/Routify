<template>
  <div class="lang-switcher" :class="variant">
    <button
      v-for="lang in LANGUAGES"
      :key="lang.code"
      class="lang-btn"
      :class="{ active: currentLocale === lang.code }"
      @click="switchLocale(lang.code)"
      :aria-label="lang.label"
      :title="lang.label"
    >
      <span class="lang-flag">{{ lang.flag }}</span>
      <span class="lang-label">{{ lang.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { LANGUAGES, setLocale } from '@/plugins/i18n';
import type { TLocale } from '@/plugins/i18n';

withDefaults(defineProps<{ variant?: 'sidebar' | 'onboarding' }>(), {
  variant: 'sidebar',
});

const { locale } = useI18n();
const currentLocale = computed(() => locale.value as TLocale);

function switchLocale(code: TLocale) {
  setLocale(code);
}
</script>

<style scoped>
/* ── Sidebar variant (compact vertical column) ── */
.lang-switcher.sidebar {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lang-switcher.sidebar .lang-btn {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 5px var(--sp-2);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--text-xs);
  transition: background var(--duration-fast), color var(--duration-fast);
  text-align: left;
  width: 100%;
}

.lang-switcher.sidebar .lang-btn:hover {
  background: var(--bg-overlay);
  color: var(--text-primary);
}

.lang-switcher.sidebar .lang-btn.active {
  color: var(--accent);
  background: var(--accent-glow);
}

.lang-switcher.sidebar .lang-flag { font-size: 13px; line-height: 1; }
.lang-switcher.sidebar .lang-label { flex: 1; }

/* ── Onboarding variant (large card grid) ── */
.lang-switcher.onboarding {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-2);
  width: 100%;
}

.lang-switcher.onboarding .lang-btn {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: border-color var(--duration-fast), color var(--duration-fast),
              background var(--duration-fast);
}

.lang-switcher.onboarding .lang-btn:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.lang-switcher.onboarding .lang-btn.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent);
}

.lang-switcher.onboarding .lang-flag { font-size: 20px; line-height: 1; }
.lang-switcher.onboarding .lang-label { font-weight: 500; }
</style>
