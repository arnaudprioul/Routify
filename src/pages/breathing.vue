<template>
  <div class="breathing-view animate-fade-in">
    <div class="view-header">
      <div>
        <h1 class="view-title">{{ t('breathing.title') }}</h1>
        <p class="view-subtitle">{{ t('breathing.technique') }}</p>
      </div>
      <div class="cycles-badge">
        <span class="cycles-num">{{ cycleCount }}</span>
        <span class="cycles-label">{{ t('breathing.cycles', cycleCount) }}</span>
      </div>
    </div>

    <div class="breath-stage">
      <!-- Outer glow ring -->
      <div class="glow-ring" :class="currentPhase" />

      <!-- Breathing circle -->
      <div
        class="breath-circle"
        :class="[currentPhase, { active: isRunning }]"
        :style="circleStyle"
      >
        <span class="phase-label">{{ phaseLabel }}</span>
        <span class="phase-timer">{{ phaseRemaining }}</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button v-if="!isRunning" class="btn-control btn-start" @click="start()">
        {{ cycleCount === 0 && !isPaused ? t('breathing.start') : t('breathing.resume') }}
      </button>
      <button v-else class="btn-control btn-pause" @click="pause()">
        {{ t('breathing.pause') }}
      </button>
      <button v-if="cycleCount > 0 || isPaused" class="btn-control btn-reset" @click="reset()">
        {{ t('breathing.reset') }}
      </button>
    </div>

    <!-- Phase dots -->
    <div class="phase-dots">
      <span
        v-for="(p, i) in PHASES"
        :key="i"
        class="phase-dot"
        :class="{ active: currentPhaseIndex === i && isRunning }"
      >
        {{ t(`breathing.phases.${p.name}`) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const PHASES = [
  { name: 'inhale', duration: 4 },
  { name: 'hold',   duration: 7 },
  { name: 'exhale', duration: 8 },
  { name: 'rest',   duration: 2 },
];

const isRunning = ref(false);
const isPaused  = ref(false);
const cycleCount = ref(0);
const currentPhaseIndex = ref(0);
const phaseRemaining = ref(PHASES[0].duration);

let timer: ReturnType<typeof setInterval> | null = null;

const currentPhase = computed(() => PHASES[currentPhaseIndex.value].name);
const phaseLabel = computed(() => t(`breathing.phases.${currentPhase.value}`));

const circleStyle = computed(() => {
  const phase = currentPhase.value;
  const progress = 1 - phaseRemaining.value / PHASES[currentPhaseIndex.value].duration;

  if (phase === 'inhale') {
    const scale = 1 + progress * 0.38;
    return { transform: `scale(${scale})`, transition: 'transform 1s linear' };
  }
  if (phase === 'hold') {
    return { transform: 'scale(1.38)', transition: 'transform 0.3s ease' };
  }
  if (phase === 'exhale') {
    const scale = 1.38 - progress * 0.38;
    return { transform: `scale(${scale})`, transition: 'transform 1s linear' };
  }
  return { transform: 'scale(1)', transition: 'transform 0.3s ease' };
});

function tick() {
  phaseRemaining.value--;
  if (phaseRemaining.value <= 0) {
    const nextIdx = (currentPhaseIndex.value + 1) % PHASES.length;
    if (nextIdx === 0) cycleCount.value++;
    currentPhaseIndex.value = nextIdx;
    phaseRemaining.value = PHASES[nextIdx].duration;
  }
}

function start() {
  isRunning.value = true;
  isPaused.value = false;
  timer = setInterval(tick, 1000);
}

function pause() {
  isRunning.value = false;
  isPaused.value = true;
  if (timer) clearInterval(timer);
}

function reset() {
  pause();
  isPaused.value = false;
  cycleCount.value = 0;
  currentPhaseIndex.value = 0;
  phaseRemaining.value = PHASES[0].duration;
}

onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<style scoped>
.breathing-view {
  padding: var(--sp-8);
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-8);
  min-height: calc(100vh - var(--sp-8));
  justify-content: center;
}

.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
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

.cycles-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.cycles-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-xl);
  color: var(--text-primary);
  line-height: 1;
}

.cycles-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Stage */
.breath-stage {
  position: relative;
  width: 240px;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glow-ring {
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  transition: opacity var(--duration-slow) var(--ease-out),
              box-shadow var(--duration-slow) var(--ease-out);
  pointer-events: none;
}

.glow-ring.inhale  { box-shadow: 0 0 60px 20px var(--accent-glow); opacity: 0.8; }
.glow-ring.hold    { box-shadow: 0 0 80px 30px var(--accent-glow); opacity: 1; }
.glow-ring.exhale  { box-shadow: 0 0 40px 10px var(--accent-glow); opacity: 0.5; }
.glow-ring.rest    { box-shadow: 0 0 20px 5px var(--accent-glow);  opacity: 0.2; }

.breath-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 2px solid var(--border-strong);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  cursor: default;
  transition: border-color var(--duration-slow) var(--ease-out);
}

.breath-circle.active.inhale  { border-color: var(--accent); }
.breath-circle.active.hold    { border-color: var(--accent-amber); }
.breath-circle.active.exhale  { border-color: var(--accent-purple); }
.breath-circle.active.rest    { border-color: var(--border-strong); }

.phase-label {
  font-size: var(--text-md);
  color: var(--text-primary);
  font-weight: 500;
  letter-spacing: -0.2px;
}

.phase-timer {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--text-2xl);
  color: var(--accent);
  line-height: 1;
}

/* Controls */
.controls {
  display: flex;
  gap: var(--sp-3);
}

.btn-control {
  padding: var(--sp-3) var(--sp-6);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: opacity var(--duration-fast), transform var(--duration-fast),
              background var(--duration-fast);
}

.btn-start {
  background: var(--accent);
  color: #000;
  min-width: 120px;
}

.btn-start:hover { opacity: 0.9; }

.btn-pause {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
  min-width: 120px;
}

.btn-pause:hover { background: var(--bg-overlay); }

.btn-reset {
  background: var(--bg-elevated);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.btn-reset:hover { color: var(--text-primary); background: var(--bg-overlay); }

.btn-control:active { transform: scale(0.97); }

/* Phase dots */
.phase-dots {
  display: flex;
  gap: var(--sp-5);
}

.phase-dot {
  font-size: var(--text-xs);
  color: var(--text-muted);
  transition: color var(--duration-fast);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.phase-dot.active { color: var(--accent); }
</style>
