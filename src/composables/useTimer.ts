import { ref, computed, onUnmounted } from 'vue';

export function useTimer() {
  const totalSeconds = ref(0);
  const remaining = ref(0);
  const elapsed = ref(0);
  const isCountdown = ref(false);
  const isPaused = ref(true);
  const isFinished = ref(false);

  let _interval: ReturnType<typeof setInterval> | null = null;

  function _clear() {
    if (_interval !== null) {
      clearInterval(_interval);
      _interval = null;
    }
  }

  function _tick() {
    if (isCountdown.value) {
      if (remaining.value > 0) remaining.value--;
      if (remaining.value === 0) {
        _clear();
        isPaused.value = true;
        isFinished.value = true;
      }
    } else {
      elapsed.value++;
    }
  }

  function startFor(durationMin: number) {
    _clear();
    isCountdown.value = true;
    isFinished.value = false;
    isPaused.value = false;
    totalSeconds.value = durationMin * 60;
    remaining.value = totalSeconds.value;
    elapsed.value = 0;
    _interval = setInterval(_tick, 1000);
  }

  function startStopwatch() {
    _clear();
    isCountdown.value = false;
    isFinished.value = false;
    isPaused.value = false;
    totalSeconds.value = 0;
    remaining.value = 0;
    elapsed.value = 0;
    _interval = setInterval(_tick, 1000);
  }

  function pause() {
    _clear();
    isPaused.value = true;
  }

  function resume() {
    if (isFinished.value || !isPaused.value) return;
    isPaused.value = false;
    _interval = setInterval(_tick, 1000);
  }

  function toggle() {
    isPaused.value ? resume() : pause();
  }

  function stop() {
    _clear();
    isPaused.value = true;
    isFinished.value = false;
  }

  const formattedTime = computed(() => {
    const secs = isCountdown.value ? remaining.value : elapsed.value;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  });

  onUnmounted(_clear);

  return {
    totalSeconds,
    remaining,
    elapsed,
    isCountdown,
    isPaused,
    isFinished,
    formattedTime,
    startFor,
    startStopwatch,
    pause,
    resume,
    toggle,
    stop,
  };
}
