<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal">

          <!-- Header -->
          <div class="modal-header">
            <div>
              <h2 class="modal-title">{{ t('aiSuggest.title') }}</h2>
            </div>
            <button class="btn-close" :aria-label="t('aiSuggest.close')" @click="$emit('close')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Mode tabs -->
          <div class="mode-tabs">
            <button
              v-for="m in MODES"
              :key="m.key"
              class="mode-tab"
              :class="{ active: mode === m.key }"
              @click="switchMode(m.key)"
            >{{ t(m.label) }}</button>
          </div>

          <!-- Phase: setup API key -->
          <div v-if="phase === 'setup'" class="phase">
            <p class="setup-desc">{{ t('aiSuggest.apiKeySetup.desc') }}</p>
            <div class="field">
              <label class="field-label">{{ t('aiSuggest.apiKeySetup.label') }}</label>
              <input
                v-model="apiKeyInput"
                type="password"
                class="field-input"
                :placeholder="t('aiSuggest.apiKeySetup.placeholder')"
                autocomplete="off"
                @keydown.enter="saveApiKey"
              />
              <span class="field-hint">{{ t('aiSuggest.apiKeySetup.hint') }}</span>
            </div>
            <button class="btn-primary" :disabled="!apiKeyInput.trim()" @click="saveApiKey">
              {{ t('aiSuggest.apiKeySetup.save') }}
            </button>
          </div>

          <!-- Phase: input -->
          <div v-else-if="phase === 'input'" class="phase">
            <div v-if="onboarding.state.goals.length || onboarding.state.scheduleType" class="context-row">
              <span
                v-for="goal in onboarding.state.goals"
                :key="goal"
                class="context-chip"
              >{{ t(`onboarding.goals.items.${goal}`) }}</span>
              <span v-if="onboarding.state.scheduleType" class="context-chip context-chip--schedule">
                {{ t(`aiSuggest.scheduleTypes.${onboarding.state.scheduleType}`) }}
              </span>
            </div>

            <div class="field">
              <label class="field-label">{{ t('aiSuggest.context.interests') }}</label>
              <textarea
                v-model="interests"
                class="field-textarea"
                :placeholder="t('aiSuggest.context.interestsPlaceholder')"
                rows="4"
              />
            </div>

            <div class="input-actions">
              <button class="btn-ghost btn-small" @click="phase = 'setup'">
                {{ t('aiSuggest.apiKeySetup.change') }}
              </button>
              <button class="btn-primary" @click="generate">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {{ t('aiSuggest.generate') }}
              </button>
            </div>
          </div>

          <!-- Phase: loading -->
          <div v-else-if="phase === 'loading'" class="phase phase-loading">
            <div class="spinner" />
            <p class="loading-text">{{ t('aiSuggest.loading') }}</p>
          </div>

          <!-- Phase: results -->
          <div v-else-if="phase === 'results'" class="phase phase-results">
            <div class="results-list">
              <div
                v-for="(suggestion, i) in ai.suggestions.value"
                :key="i"
                class="suggestion-card"
                :class="{ dismissed: dismissedIndexes.has(i), added: addedIndexes.has(i) }"
              >
                <div class="suggestion-header">
                  <div class="suggestion-identity">
                    <span class="suggestion-icon" :style="{ color: suggestion.color }">{{ suggestion.icon }}</span>
                    <div>
                      <span class="suggestion-name">{{ suggestion.name }}</span>
                      <span class="suggestion-meta">
                        {{ t(`timeBlock.${suggestion.timeBlock}`) }}
                        · {{ suggestion.items.length }} {{ t('aiSuggest.results.steps') }}
                      </span>
                    </div>
                  </div>
                  <div class="suggestion-actions">
                    <button
                      v-if="!addedIndexes.has(i) && !dismissedIndexes.has(i)"
                      class="btn-dismiss"
                      :aria-label="t('aiSuggest.results.dismiss')"
                      @click="dismissedIndexes.add(i)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                    <button
                      v-if="!addedIndexes.has(i) && !dismissedIndexes.has(i)"
                      class="btn-add"
                      @click="addSuggestion(i)"
                    >
                      {{ t('aiSuggest.results.add') }}
                    </button>
                    <span v-else-if="addedIndexes.has(i)" class="badge-added">
                      {{ t('aiSuggest.results.added') }}
                    </span>
                  </div>
                </div>

                <ul class="suggestion-items">
                  <li v-for="item in suggestion.items" :key="item.label" class="suggestion-item">
                    <span class="item-dot" :style="{ background: suggestion.color }" />
                    <span class="item-label">{{ item.label }}</span>
                    <span v-if="item.durationMin" class="item-duration">{{ item.durationMin }}m</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="results-footer">
              <button class="btn-ghost btn-small" @click="regenerate">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                {{ t('aiSuggest.regenerate') }}
              </button>
            </div>
          </div>

          <!-- Phase: error -->
          <div v-else-if="phase === 'error'" class="phase phase-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p class="error-text">{{ currentErrorMessage }}</p>
            <div class="error-actions">
              <button class="btn-ghost btn-small" @click="phase = 'setup'">
                {{ t('aiSuggest.apiKeySetup.change') }}
              </button>
              <button class="btn-primary" @click="retryCurrentMode">
                {{ t('aiSuggest.regenerate') }}
              </button>
            </div>
          </div>

          <!-- ── IMPROVE mode ── -->
          <div v-else-if="phase === 'improve-select'" class="phase">
            <p class="setup-desc">{{ t('aiSuggest.improve.desc') }}</p>
            <div class="field">
              <label class="field-label">{{ t('aiSuggest.improve.pick') }}</label>
              <select v-model="selectedRoutineId" class="field-select">
                <option value="">{{ t('aiSuggest.improve.pickPlaceholder') }}</option>
                <option v-for="r in routineStore.routines" :key="r.id" :value="r.id">
                  {{ r.icon }} {{ r.name }}
                </option>
              </select>
            </div>
            <div class="input-actions">
              <button class="btn-ghost btn-small" @click="phase = 'setup'">
                {{ t('aiSuggest.apiKeySetup.change') }}
              </button>
              <button class="btn-primary" :disabled="!selectedRoutineId" @click="runImprove">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {{ t('aiSuggest.improve.run') }}
              </button>
            </div>
          </div>

          <div v-else-if="phase === 'improve-results'" class="phase phase-improve">
            <div class="improve-header">
              <span class="improve-routine-name">{{ selectedRoutine?.icon }} {{ selectedRoutine?.name }}</span>
            </div>
            <div class="improve-columns">
              <div class="improve-col">
                <p class="improve-col-label">{{ t('aiSuggest.improve.original') }}</p>
                <ul class="improve-list">
                  <li v-for="item in selectedRoutine?.items" :key="item.id" class="improve-item improve-item--old">
                    <span class="item-label">{{ item.label }}</span>
                    <span v-if="item.durationMin" class="item-duration">{{ item.durationMin }}m</span>
                  </li>
                </ul>
              </div>
              <div class="improve-col">
                <p class="improve-col-label">{{ t('aiSuggest.improve.suggested') }}</p>
                <ul class="improve-list">
                  <li v-for="item in aiImprove.improvedItems.value" :key="item.label" class="improve-item improve-item--new">
                    <span class="item-label">{{ item.label }}</span>
                    <span v-if="item.durationMin" class="item-duration">{{ item.durationMin }}m</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="results-footer">
              <button class="btn-ghost btn-small" @click="phase = 'improve-select'">
                {{ t('aiSuggest.improve.back') }}
              </button>
              <button class="btn-primary" @click="applyImprove">
                {{ t('aiSuggest.improve.apply') }}
              </button>
            </div>
          </div>

          <!-- ── ANALYZE mode ── -->
          <div v-else-if="phase === 'analyze-select'" class="phase">
            <p class="setup-desc">{{ t('aiSuggest.analyze.desc') }}</p>
            <div class="field">
              <label class="field-label">{{ t('aiSuggest.analyze.pick') }}</label>
              <select v-model="selectedRoutineId" class="field-select">
                <option value="">{{ t('aiSuggest.analyze.pickPlaceholder') }}</option>
                <option v-for="r in routineStore.routines" :key="r.id" :value="r.id">
                  {{ r.icon }} {{ r.name }}
                </option>
              </select>
            </div>
            <div class="input-actions">
              <button class="btn-ghost btn-small" @click="phase = 'setup'">
                {{ t('aiSuggest.apiKeySetup.change') }}
              </button>
              <button class="btn-primary" :disabled="!selectedRoutineId" @click="runAnalyze">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {{ t('aiSuggest.analyze.run') }}
              </button>
            </div>
          </div>

          <div v-else-if="phase === 'analyze-results'" class="phase phase-analyze">
            <div class="analyze-routine-name">{{ selectedRoutine?.icon }} {{ selectedRoutine?.name }}</div>
            <div class="analyze-block">
              <p class="analyze-label">{{ t('aiSuggest.analyze.analysisLabel') }}</p>
              <p class="analyze-text">{{ aiAnalyze.result.value?.analysis }}</p>
            </div>
            <div class="analyze-block analyze-block--suggestion">
              <p class="analyze-label">{{ t('aiSuggest.analyze.suggestionLabel') }}</p>
              <p class="analyze-text">{{ aiAnalyze.result.value?.suggestion }}</p>
            </div>
            <button class="btn-ghost btn-small" style="align-self: flex-start" @click="phase = 'analyze-select'">
              ← {{ t('aiSuggest.analyze.back') }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useRoutineStore } from '@/stores/routines.store';
import { useAiSuggestions, useAiImprove, useAiAnalyze } from '@/composables/useAiSuggestions';

const { t } = useI18n();
defineEmits<{ close: [] }>();

const settings = useSettingsStore();
const onboarding = useOnboardingStore();
const routineStore = useRoutineStore();
const ai = useAiSuggestions();
const aiImprove = useAiImprove();
const aiAnalyze = useAiAnalyze();

type TMode = 'generate' | 'improve' | 'analyze';
type TPhase =
  | 'setup' | 'input' | 'loading' | 'results' | 'error'
  | 'improve-select' | 'improve-results'
  | 'analyze-select' | 'analyze-results';

const MODES: { key: TMode; label: string }[] = [
  { key: 'generate', label: 'aiSuggest.modes.generate' },
  { key: 'improve',  label: 'aiSuggest.modes.improve' },
  { key: 'analyze',  label: 'aiSuggest.modes.analyze' },
];

const mode = ref<TMode>('generate');
const phase = ref<TPhase>(settings.geminiApiKey ? 'input' : 'setup');
const apiKeyInput = ref(settings.geminiApiKey);
const interests = ref('');
const dismissedIndexes = reactive(new Set<number>());
const addedIndexes = reactive(new Set<number>());
const selectedRoutineId = ref('');

const selectedRoutine = computed(() =>
  routineStore.routines.find((r) => r.id === selectedRoutineId.value) ?? null,
);

const currentErrorMessage = computed(() => {
  if (mode.value === 'improve') return aiImprove.errorMessage.value;
  if (mode.value === 'analyze') return aiAnalyze.errorMessage.value;
  return ai.errorMessage.value;
});

function switchMode(m: TMode) {
  mode.value = m;
  if (!settings.geminiApiKey) { phase.value = 'setup'; return; }
  if (m === 'generate') phase.value = 'input';
  else if (m === 'improve') phase.value = 'improve-select';
  else if (m === 'analyze') phase.value = 'analyze-select';
}

// ── Generate mode ──────────────────────────────────────────────────────────
watch(() => ai.status.value, (s) => {
  if (mode.value !== 'generate') return;
  if (s === 'loading') phase.value = 'loading';
  else if (s === 'success') {
    dismissedIndexes.clear();
    addedIndexes.clear();
    phase.value = 'results';
  } else if (s === 'error') phase.value = 'error';
});

function saveApiKey() {
  if (!apiKeyInput.value.trim()) return;
  settings.setGeminiApiKey(apiKeyInput.value);
  if (mode.value === 'generate') phase.value = 'input';
  else if (mode.value === 'improve') phase.value = 'improve-select';
  else phase.value = 'analyze-select';
}

async function generate() {
  await ai.generate(settings.geminiApiKey, {
    goals: onboarding.state.goals,
    scheduleType: onboarding.state.scheduleType,
    interests: interests.value,
    existingNames: routineStore.routines.map((r) => r.name),
  });
}

async function regenerate() {
  ai.reset();
  phase.value = 'input';
}

function addSuggestion(index: number) {
  const s = ai.suggestions.value[index];
  if (!s) return;
  routineStore.addRoutine({
    name: s.name,
    icon: s.icon,
    color: s.color,
    timeBlock: s.timeBlock,
    days: s.days,
    reminderTime: undefined,
    items: s.items.map((item) => ({
      id: Math.random().toString(36).slice(2, 10),
      label: item.label,
      durationMin: item.durationMin,
      completed: false,
    })),
  });
  addedIndexes.add(index);
}

// ── Improve mode ───────────────────────────────────────────────────────────
watch(() => aiImprove.status.value, (s) => {
  if (mode.value !== 'improve') return;
  if (s === 'loading') phase.value = 'loading';
  else if (s === 'success') phase.value = 'improve-results';
  else if (s === 'error') phase.value = 'error';
});

async function runImprove() {
  const r = selectedRoutine.value;
  if (!r) return;
  await aiImprove.improve(settings.geminiApiKey, { name: r.name, items: r.items });
}

function applyImprove() {
  const r = selectedRoutine.value;
  if (!r) return;
  routineStore.updateRoutine(r.id, {
    items: aiImprove.improvedItems.value.map((item) => ({
      id: Math.random().toString(36).slice(2, 10),
      label: item.label,
      durationMin: item.durationMin ?? undefined,
      completed: false,
    })),
  });
  aiImprove.reset();
  phase.value = 'improve-select';
}

// ── Analyze mode ───────────────────────────────────────────────────────────
watch(() => aiAnalyze.status.value, (s) => {
  if (mode.value !== 'analyze') return;
  if (s === 'loading') phase.value = 'loading';
  else if (s === 'success') phase.value = 'analyze-results';
  else if (s === 'error') phase.value = 'error';
});

async function runAnalyze() {
  const r = selectedRoutine.value;
  if (!r) return;
  const totalMin = r.items.reduce((s, i) => s + (i.durationMin ?? 0), 0);
  const ageDays = Math.max(
    1,
    Math.floor((Date.now() - new Date(r.createdAt + 'T12:00:00').getTime()) / 86400000),
  );
  await aiAnalyze.analyze(settings.geminiApiKey, {
    name: r.name,
    itemCount: r.items.length,
    totalMin,
    completedCount: r.completedDates.length,
    totalDays: ageDays,
    streak: r.streak,
  });
}

function retryCurrentMode() {
  if (mode.value === 'generate') generate();
  else if (mode.value === 'improve') runImprove();
  else runAnalyze();
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
  width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
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

/* Mode tabs */
.mode-tabs {
  display: flex;
  gap: 2px;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 3px;
  flex-shrink: 0;
}

.mode-tab {
  flex: 1;
  padding: var(--sp-1) var(--sp-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-muted);
  transition: background var(--duration-fast), color var(--duration-fast);
}

.mode-tab:hover { color: var(--text-secondary); }
.mode-tab.active { background: var(--bg-elevated); color: var(--text-primary); }

/* Phases */
.phase {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  overflow-y: auto;
}

/* Setup */
.setup-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.field-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.field-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.field-input, .field-textarea {
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--sp-2) var(--sp-3);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  transition: border-color var(--duration-fast);
  width: 100%;
}

.field-input:focus, .field-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.field-textarea {
  resize: vertical;
  min-height: 90px;
  line-height: 1.5;
}

/* Input phase */
.context-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
}

.context-chip {
  padding: 3px var(--sp-3);
  border-radius: 20px;
  font-size: var(--text-xs);
  background: var(--accent-glow);
  border: 1px solid var(--accent);
  color: var(--accent);
}

.context-chip--schedule {
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.4);
  color: #a78bfa;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Loading */
.phase-loading {
  align-items: center;
  justify-content: center;
  padding: var(--sp-10) 0;
  gap: var(--sp-4);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--border-strong);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* Results */
.phase-results {
  overflow: hidden;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  overflow-y: auto;
  flex: 1;
}

.suggestion-card {
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  transition: opacity var(--duration-base) var(--ease-out);
}

.suggestion-card.dismissed { opacity: 0.25; pointer-events: none; }
.suggestion-card.added { opacity: 0.5; }

.suggestion-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
}

.suggestion-identity {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.suggestion-icon {
  font-size: 22px;
  flex-shrink: 0;
  line-height: 1;
}

.suggestion-name {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.suggestion-meta {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 2px;
  text-transform: capitalize;
}

.suggestion-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-shrink: 0;
}

.btn-dismiss {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast), background var(--duration-fast);
}

.btn-dismiss:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }

.btn-add {
  padding: 4px var(--sp-3);
  background: var(--accent);
  color: #000;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  transition: opacity var(--duration-fast);
}

.btn-add:hover { opacity: 0.85; }

.badge-added {
  font-size: var(--text-xs);
  color: var(--accent);
  font-weight: 500;
}

.suggestion-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.item-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  opacity: 0.7;
}

.item-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  flex: 1;
}

.item-duration {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.results-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding-top: var(--sp-2);
  border-top: 1px solid var(--border);
}

/* Error */
.phase-error {
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--sp-8) 0;
  color: var(--danger);
}

.error-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
  max-width: 340px;
}

.error-actions {
  display: flex;
  gap: var(--sp-2);
}

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-4);
  background: var(--accent);
  color: #000;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: opacity var(--duration-fast), transform var(--duration-fast);
}

.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:active:not(:disabled) { transform: scale(0.97); }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

.btn-ghost {
  padding: var(--sp-2) var(--sp-3);
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  transition: color var(--duration-fast), background var(--duration-fast);
}

.btn-ghost:hover { color: var(--text-secondary); background: var(--bg-overlay); }

.btn-small {
  font-size: var(--text-xs);
  padding: 4px var(--sp-3);
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}

/* Improve mode */
.field-select {
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--sp-2) var(--sp-3);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  transition: border-color var(--duration-fast);
  width: 100%;
  appearance: none;
  cursor: pointer;
}

.field-select:focus { outline: none; border-color: var(--accent); }

.phase-improve, .phase-analyze {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.improve-header {
  padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--border);
}

.improve-routine-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.improve-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
  flex: 1;
  overflow: hidden;
}

.improve-col {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  overflow-y: auto;
}

.improve-col-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-muted);
}

.improve-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.improve-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.improve-item--old {
  background: var(--bg-overlay);
  border: 1px solid var(--border);
}

.improve-item--new {
  background: rgba(20, 184, 166, 0.06);
  border: 1px solid rgba(20, 184, 166, 0.2);
}

.improve-item .item-label { flex: 1; color: var(--text-secondary); }
.improve-item .item-duration { color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }

/* Analyze mode */
.analyze-routine-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--border);
}

.analyze-block {
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.analyze-block--suggestion {
  border-color: rgba(20, 184, 166, 0.3);
  background: rgba(20, 184, 166, 0.04);
}

.analyze-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-muted);
}

.analyze-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Modal transition */
.modal-enter-active, .modal-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
