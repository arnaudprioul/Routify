<template>
  <div
    class="focus-view"
    :style="{ '--routine-color': routine?.color || 'var(--accent)' }"
  >
    <!-- ── COMPLETION SCREEN ── -->
    <div v-if="isComplete" class="focus-complete animate-fade-in">
      <div class="complete-glow" :style="{ background: routine?.color + '22' }">
        <span class="complete-icon">{{ routine?.icon }}</span>
      </div>
      <h1 class="complete-title">{{ t('focus.complete.title') }}</h1>
      <p class="complete-subtitle">{{ routine?.name }}</p>
      <button class="btn-cta" @click="router.push('/today')">
        {{ t('focus.complete.cta') }}
      </button>
    </div>

    <!-- ── ACTIVE SESSION ── -->
    <template v-else-if="routine && currentItem">
      <!-- Top bar -->
      <header class="focus-topbar">
        <button class="btn-exit" :aria-label="t('focus.exit')" @click="router.push('/today')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div class="focus-routine-info">
          <span class="focus-routine-icon">{{ routine.icon }}</span>
          <span class="focus-routine-name">{{ routine.name }}</span>
        </div>
        <div class="focus-step-counter">
          <span class="counter-current">{{ currentIndex + 1 }}</span>
          <span class="counter-sep">/</span>
          <span class="counter-total">{{ sessionItems.length }}</span>
        </div>
      </header>

      <!-- Step progress track -->
      <div class="focus-progress-track">
        <div
          class="focus-progress-fill"
          :style="{ width: sessionProgress + '%', background: routine.color }"
        />
      </div>

      <!-- Main content -->
      <main class="focus-main">
        <Transition name="step" mode="out-in">
          <div :key="currentIndex" class="focus-step">

            <!-- Timer ring -->
            <div class="timer-wrap">
              <svg class="timer-svg" viewBox="0 0 180 180" aria-hidden="true">
                <circle class="timer-track" cx="90" cy="90" :r="RADIUS" />
                <circle
                  class="timer-ring"
                  cx="90" cy="90" :r="RADIUS"
                  :style="{
                    strokeDasharray: CIRCUMFERENCE,
                    strokeDashoffset: timerOffset,
                    stroke: routine.color,
                  }"
                />
              </svg>
              <div class="timer-inner">
                <span class="timer-time">{{ timer.formattedTime.value }}</span>
                <span class="timer-mode">
                  {{ currentItem.durationMin ? t('focus.timer.countdown') : t('focus.timer.stopwatch') }}
                </span>
              </div>
            </div>

            <!-- Step info -->
            <h2 class="focus-step-label">{{ currentItem.label }}</h2>
            <p v-if="currentItem.durationMin" class="focus-step-duration">
              {{ currentItem.durationMin }}&thinsp;{{ t('focus.min') }}
            </p>

          </div>
        </Transition>
      </main>

      <!-- Controls -->
      <footer class="focus-controls">
        <button class="btn-control btn-skip" :disabled="isAutoAdvancing" @click="skip">
          {{ t('focus.skip') }}
        </button>

        <button
          class="btn-control btn-pause"
          :disabled="isAutoAdvancing"
          :aria-label="timer.isPaused.value ? t('focus.resume') : t('focus.pause')"
          @click="timer.toggle()"
        >
          <!-- Play -->
          <svg v-if="timer.isPaused.value" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <!-- Pause -->
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
          </svg>
        </button>

        <button class="btn-control btn-done-step" :disabled="isAutoAdvancing" @click="markDone">
          {{ t('focus.done') }}
        </button>
      </footer>
    </template>

    <!-- ── NOT FOUND ── -->
    <div v-else class="focus-not-found animate-fade-in">
      <p>{{ t('focus.notFound') }}</p>
      <button class="btn-cta" @click="router.push('/today')">{{ t('focus.backToToday') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useRoutineStore } from '@/stores/routines.store';
import { useTimer } from '@/composables/useTimer';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useRoutineStore();
const timer = useTimer();

// ── Constants ──────────────────────────────────────────────────────────────
const RADIUS = 72;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 452.4

// ── State ──────────────────────────────────────────────────────────────────
const routineId = route.params.routineId as string;
const maxMin = route.query.maxMin ? Number(route.query.maxMin) : null;

const routine = computed(() => store.routines.find((r) => r.id === routineId) ?? null);

// Short version: take only items that cumulatively fit within maxMin
const sessionItems = computed(() => {
  const items = routine.value?.items ?? [];
  if (!maxMin) return items;
  let accumulated = 0;
  return items.filter((item) => {
    const d = item.durationMin ?? 2;
    if (accumulated + d <= maxMin) { accumulated += d; return true; }
    return false;
  });
});

const currentIndex = ref(0);
const isComplete = ref(false);
const isAutoAdvancing = ref(false);

const currentItem = computed(() => sessionItems.value[currentIndex.value] ?? null);

// ── Timer ──────────────────────────────────────────────────────────────────
function initTimer() {
  const item = currentItem.value;
  if (!item) return;
  if (item.durationMin) {
    timer.startFor(item.durationMin);
  } else {
    timer.startStopwatch();
  }
}

// Auto-advance when countdown finishes
watch(
  () => timer.isFinished.value,
  (finished) => {
    if (finished && !isComplete.value) {
      playDoneSound();
      isAutoAdvancing.value = true;
      setTimeout(() => {
        isAutoAdvancing.value = false;
        markDone();
      }, 900);
    }
  },
);

// ── Session progress ───────────────────────────────────────────────────────
const sessionProgress = computed(() => {
  const total = sessionItems.value.length;
  return total > 0 ? (currentIndex.value / total) * 100 : 0;
});

// ── Timer ring offset ──────────────────────────────────────────────────────
// Countdown: starts full (offset=0) → drains clockwise
// Stopwatch: starts empty (offset=CIRCUMFERENCE) → fills over max 5 min
const timerOffset = computed(() => {
  if (currentItem.value?.durationMin && timer.totalSeconds.value > 0) {
    const elapsedRatio = 1 - timer.remaining.value / timer.totalSeconds.value;
    return CIRCUMFERENCE * elapsedRatio;
  }
  const progress = Math.min(timer.elapsed.value / 300, 1);
  return CIRCUMFERENCE * (1 - progress);
});

// ── Actions ────────────────────────────────────────────────────────────────
function advanceStep() {
  timer.stop();
  const items = sessionItems.value;
  if (currentIndex.value < items.length - 1) {
    currentIndex.value++;
    initTimer();
  } else {
    isComplete.value = true;
    playCompletionSound();
  }
}

function markDone() {
  if (isComplete.value) return;
  const item = currentItem.value;
  if (item && !item.completed) {
    store.toggleItem(routineId, item.id);
  }
  advanceStep();
}

function skip() {
  advanceStep();
}

// ── Audio ──────────────────────────────────────────────────────────────────
function playDoneSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (_) {/* silent fallback */}
}

function playCompletionSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.12, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
      osc.start(t0);
      osc.stop(t0 + 0.6);
    });
  } catch (_) {/* silent fallback */}
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => {
  const items = sessionItems.value;
  if (items.length === 0) return;

  const allDone = items.every((i) => i.completed);
  if (allDone) {
    isComplete.value = true;
    return;
  }

  const firstIncomplete = items.findIndex((i) => !i.completed);
  currentIndex.value = firstIncomplete >= 0 ? firstIncomplete : 0;
  initTimer();
});
</script>

<style scoped>
.focus-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  background: var(--bg-deep);
  color: var(--text-primary);
  padding: 0;
  position: relative;
}

/* ── Top bar ── */
.focus-topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-4) var(--sp-6);
  flex-shrink: 0;
}

.btn-exit {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: color var(--duration-fast), background var(--duration-fast);
}

.btn-exit:hover {
  color: var(--text-primary);
  background: var(--bg-overlay);
}

.focus-routine-info {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.focus-routine-icon {
  font-size: 16px;
}

.focus-step-counter {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-sm);
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.counter-current {
  color: var(--text-primary);
  font-size: var(--text-md);
}

.counter-sep,
.counter-total {
  color: var(--text-muted);
}

/* ── Progress track ── */
.focus-progress-track {
  width: 100%;
  height: 2px;
  background: var(--border);
  flex-shrink: 0;
}

.focus-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width var(--duration-slow) var(--ease-out);
}

/* ── Main ── */
.focus-main {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-8);
  overflow: hidden;
}

.focus-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-6);
  max-width: 340px;
  width: 100%;
}

/* ── Timer SVG ── */
.timer-wrap {
  position: relative;
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}

.timer-svg {
  width: 180px;
  height: 180px;
}

.timer-track {
  fill: none;
  stroke: var(--border);
  stroke-width: 6;
}

.timer-ring {
  fill: none;
  stroke-width: 6;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: center;
  transition: stroke-dashoffset 1s linear;
}

.timer-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.timer-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-2xl);
  font-weight: 400;
  color: var(--text-primary);
  letter-spacing: -1px;
  line-height: 1;
}

.timer-mode {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Step label ── */
.focus-step-label {
  font-size: var(--text-xl);
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  letter-spacing: -0.5px;
  line-height: 1.3;
}

.focus-step-duration {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* ── Controls ── */
.focus-controls {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-4);
  padding: var(--sp-6) var(--sp-8) var(--sp-10);
  flex-shrink: 0;
}

.btn-control {
  transition: opacity var(--duration-fast), transform var(--duration-fast);
}

.btn-control:disabled {
  opacity: 0.4;
  cursor: default;
  pointer-events: none;
}

.btn-skip,
.btn-done-step {
  padding: var(--sp-2) var(--sp-5);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  min-width: 80px;
}

.btn-skip {
  color: var(--text-muted);
  border: 1px solid var(--border);
  transition: color var(--duration-fast), border-color var(--duration-fast), background var(--duration-fast);
}

.btn-skip:hover {
  color: var(--text-secondary);
  border-color: var(--border-strong);
  background: var(--bg-overlay);
}

.btn-done-step {
  background: var(--routine-color);
  color: #000;
  border: none;
}

.btn-done-step:hover { opacity: 0.88; }

.btn-pause {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--duration-fast), transform var(--duration-fast);
}

.btn-pause:hover {
  background: var(--bg-overlay);
  transform: scale(1.05);
}

/* ── Completion ── */
.focus-complete {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--sp-5);
  padding: var(--sp-8);
}

.complete-glow {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  animation: complete-burst 500ms var(--ease-out) both;
}

.complete-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.8px;
  text-align: center;
}

.complete-subtitle {
  font-size: var(--text-base);
  color: var(--text-muted);
  text-align: center;
}

.btn-cta {
  margin-top: var(--sp-2);
  padding: var(--sp-3) var(--sp-8);
  background: var(--routine-color);
  color: #000;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: opacity var(--duration-fast);
}

.btn-cta:hover { opacity: 0.88; }

/* ── Not found ── */
.focus-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--sp-4);
  color: var(--text-muted);
  font-size: var(--text-sm);
}

/* ── Step transition ── */
.step-enter-active {
  animation: step-in var(--duration-base) var(--ease-out) both;
}
.step-leave-active {
  animation: step-out var(--duration-fast) var(--ease-in) both;
}

@keyframes step-in {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes step-out {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-16px); }
}
</style>
