<template>
  <svg class="progress-ring" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
    <!-- Track -->
    <circle
      class="ring-track"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke-width="strokeWidth"
    />
    <!-- Progress -->
    <circle
      class="ring-progress"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke-width="strokeWidth"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="offset"
      stroke-linecap="round"
      :transform="`rotate(-90 ${center} ${center})`"
    />
    <!-- Label -->
    <text
      :x="center"
      :y="center + 4"
      text-anchor="middle"
      class="ring-label"
    >{{ value }}%</text>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  value: number;
  size?: number;
  strokeWidth?: number;
}>(), {
  size: 44,
  strokeWidth: 3,
});

const center = computed(() => props.size / 2);
const radius = computed(() => center.value - props.strokeWidth * 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const offset = computed(() =>
  circumference.value - (props.value / 100) * circumference.value
);
</script>

<style scoped>
.progress-ring {
  flex-shrink: 0;
  overflow: visible;
}

.ring-track {
  stroke: var(--border-strong);
}

.ring-progress {
  stroke: var(--accent);
  transition: stroke-dashoffset var(--duration-slow) var(--ease-out);
}

.ring-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  fill: var(--text-secondary);
}
</style>
