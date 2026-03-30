<template>
  <div class="onboarding">
    <!-- Step indicator -->
    <div class="step-dots">
      <span
        v-for="i in TOTAL_STEPS"
        :key="i"
        class="dot"
        :class="{ active: i === step, done: i < step }"
      />
    </div>

    <!-- Steps -->
    <Transition name="slide" mode="out-in">
      <!-- Step 1: Language -->
      <div v-if="step === 1" key="1" class="step-panel">
        <div class="step-icon">R</div>
        <h1 class="step-title lang-title">
          Choose · Choisir · 言語 · 언어 · 语言
        </h1>
        <LangSwitcher variant="onboarding" />
        <button class="btn-next" @click="next()">
          {{ t('onboarding.language.next') }}
        </button>
      </div>

      <!-- Step 2: Welcome + Name -->
      <div v-else-if="step === 2" key="2" class="step-panel">
        <div class="step-icon">R</div>
        <h1 class="step-title">{{ t('onboarding.welcome.title') }}</h1>
        <p class="step-subtitle">{{ t('onboarding.welcome.subtitle') }}</p>
        <div class="field">
          <label class="field-label">{{ t('onboarding.welcome.nameLabel') }}</label>
          <input
            v-model="userName"
            class="field-input"
            type="text"
            :placeholder="t('onboarding.welcome.namePlaceholder')"
            autofocus
            @keydown.enter="userName.trim() && next()"
          />
        </div>
        <div class="step-nav">
          <button class="btn-back" @click="prev()">{{ t('onboarding.back') }}</button>
          <button class="btn-next btn-next-inline" :disabled="!userName.trim()" @click="next()">
            {{ t('onboarding.welcome.next') }}
          </button>
        </div>
      </div>

      <!-- Step 3: Goals -->
      <div v-else-if="step === 3" key="3" class="step-panel">
        <h1 class="step-title">{{ t('onboarding.goals.title') }}</h1>
        <p class="step-subtitle">{{ t('onboarding.goals.subtitle') }}</p>
        <div class="goal-grid">
          <button
            v-for="goal in GOALS"
            :key="goal.value"
            class="goal-pill"
            :class="{ selected: selectedGoals.includes(goal.value) }"
            @click="toggleGoal(goal.value)"
          >
            <span class="goal-icon">{{ goal.icon }}</span>
            {{ t(`onboarding.goals.items.${goal.value}`) }}
          </button>
        </div>
        <div class="step-nav">
          <button class="btn-back" @click="prev()">{{ t('onboarding.back') }}</button>
          <button class="btn-next btn-next-inline" @click="next()">{{ t('onboarding.goals.next') }}</button>
        </div>
      </div>

      <!-- Step 4: Schedule -->
      <div v-else-if="step === 4" key="4" class="step-panel">
        <h1 class="step-title">{{ t('onboarding.schedule.title') }}</h1>
        <p class="step-subtitle">{{ t('onboarding.schedule.subtitle') }}</p>
        <div class="schedule-options">
          <button
            v-for="opt in SCHEDULE_OPTIONS"
            :key="opt.value"
            class="schedule-option"
            :class="{ selected: scheduleType === opt.value }"
            @click="scheduleType = opt.value"
          >
            <span class="schedule-icon">{{ opt.icon }}</span>
            <div class="schedule-text">
              <span class="schedule-label">{{ t(`onboarding.schedule.options.${opt.value}.label`) }}</span>
              <span class="schedule-desc">{{ t(`onboarding.schedule.options.${opt.value}.desc`) }}</span>
            </div>
            <span class="schedule-check">
              <svg v-if="scheduleType === opt.value" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
          </button>
        </div>
        <div class="step-nav">
          <button class="btn-back" @click="prev()">{{ t('onboarding.back') }}</button>
          <button class="btn-next btn-next-inline" :disabled="!scheduleType" @click="next()">
            {{ t('onboarding.schedule.next') }}
          </button>
        </div>
      </div>

      <!-- Step 5: Ready -->
      <div v-else-if="step === 5" key="5" class="step-panel step-ready">
        <div class="ready-burst">✦</div>
        <h1 class="step-title">{{ t('onboarding.ready.title') }}, {{ userName }}.</h1>
        <p class="step-subtitle">{{ t('onboarding.ready.subtitle') }}</p>
        <button class="btn-next btn-cta" @click="finish()">
          {{ t('onboarding.ready.cta') }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useOnboardingStore } from '@/stores/onboarding.store';
import LangSwitcher from '@/components/ui/LangSwitcher.vue';
import type { TOnboardingGoal, TScheduleType } from '@/stores/onboarding.store';

const { t } = useI18n();
const router = useRouter();
const onboardingStore = useOnboardingStore();

const TOTAL_STEPS = 5;
const step = ref(1);
const userName = ref('');
const selectedGoals = ref<TOnboardingGoal[]>([]);
const scheduleType = ref<TScheduleType | null>(null);

const GOALS: { value: TOnboardingGoal; icon: string }[] = [
  { value: 'morning_routine', icon: '☀' },
  { value: 'fitness',         icon: '◈' },
  { value: 'skincare',        icon: '✦' },
  { value: 'productivity',    icon: '◉' },
  { value: 'sleep',           icon: '◑' },
  { value: 'mindfulness',     icon: '○' },
];

const SCHEDULE_OPTIONS: { value: TScheduleType; icon: string }[] = [
  { value: 'morning_person', icon: '☀' },
  { value: 'balanced',       icon: '◈' },
  { value: 'night_owl',      icon: '◑' },
];

function toggleGoal(goal: TOnboardingGoal) {
  const idx = selectedGoals.value.indexOf(goal);
  if (idx === -1) selectedGoals.value.push(goal);
  else selectedGoals.value.splice(idx, 1);
}

function next() { if (step.value < TOTAL_STEPS) step.value++; }
function prev() { if (step.value > 1) step.value--; }

function finish() {
  onboardingStore.completeOnboarding({
    userName: userName.value.trim() || 'You',
    goals: selectedGoals.value,
    scheduleType: scheduleType.value,
  });
  router.push('/today');
}
</script>

<style scoped>
.onboarding {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--sp-8);
  background: var(--bg-deep);
  gap: var(--sp-8);
}

.step-dots {
  display: flex;
  gap: var(--sp-2);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--border-strong);
  transition: width var(--duration-base) var(--ease-out),
              background var(--duration-base) var(--ease-out);
}

.dot.active {
  width: 20px;
  background: var(--accent);
}

.dot.done {
  background: var(--accent);
  opacity: 0.4;
}

.step-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-5);
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.step-icon {
  width: 56px;
  height: 56px;
  background: var(--accent);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #000;
}

.step-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.8px;
  line-height: 1.15;
}

.lang-title {
  font-size: var(--text-base);
  color: var(--text-muted);
  letter-spacing: 0;
  font-weight: 400;
}

.step-subtitle {
  font-size: var(--text-base);
  color: var(--text-muted);
  margin-top: calc(-1 * var(--sp-3));
}

.field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  text-align: left;
}

.field-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-input {
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  padding: var(--sp-3) var(--sp-4);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-md);
  width: 100%;
  transition: border-color var(--duration-fast);
}

.field-input:focus {
  outline: none;
  border-color: var(--accent);
}

.btn-next {
  width: 100%;
  padding: var(--sp-3) var(--sp-6);
  background: var(--accent);
  color: #000;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 600;
  transition: opacity var(--duration-fast), transform var(--duration-fast);
  letter-spacing: -0.2px;
}

.btn-next:hover:not(:disabled) { opacity: 0.9; }
.btn-next:active:not(:disabled) { transform: scale(0.98); }
.btn-next:disabled { opacity: 0.3; cursor: not-allowed; }

/* When in step-nav, take natural width */
.btn-next-inline { width: auto; flex: 1; }

.btn-cta {
  padding: var(--sp-4) var(--sp-8);
  font-size: var(--text-md);
  border-radius: var(--radius-lg);
  width: auto;
  min-width: 200px;
}

.step-nav {
  display: flex;
  gap: var(--sp-3);
  width: 100%;
}

.btn-back {
  padding: var(--sp-3) var(--sp-4);
  color: var(--text-muted);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: color var(--duration-fast), background var(--duration-fast);
}

.btn-back:hover {
  color: var(--text-primary);
  background: var(--bg-overlay);
}

.goal-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-2);
  width: 100%;
}

.goal-pill {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: border-color var(--duration-fast), color var(--duration-fast),
              background var(--duration-fast);
}

.goal-pill:hover { border-color: var(--border-strong); color: var(--text-primary); }

.goal-pill.selected {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent);
}

.goal-icon { font-size: 16px; }

.schedule-options {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  width: 100%;
}

.schedule-option {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: left;
  transition: border-color var(--duration-fast), background var(--duration-fast);
}

.schedule-option:hover { border-color: var(--border-strong); }

.schedule-option.selected {
  background: var(--accent-glow);
  border-color: var(--accent);
}

.schedule-icon { font-size: 20px; flex-shrink: 0; }

.schedule-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.schedule-label {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.schedule-desc {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.schedule-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  flex-shrink: 0;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}

.schedule-option.selected .schedule-check {
  opacity: 1;
  transform: scale(1);
}

.step-ready { justify-content: center; gap: var(--sp-6); }

.ready-burst {
  font-size: 48px;
  animation: complete-burst 600ms var(--ease-out) both;
  color: var(--accent);
}

/* Slide transitions */
.slide-enter-active,
.slide-leave-active {
  transition: opacity var(--duration-base) var(--ease-out),
              transform var(--duration-base) var(--ease-out);
}
.slide-enter-from { opacity: 0; transform: translateX(24px); }
.slide-leave-to   { opacity: 0; transform: translateX(-16px); }
</style>
