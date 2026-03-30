import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const deepFocus = ref(false);

  function toggleDeepFocus() {
    deepFocus.value = !deepFocus.value;
  }

  function exitDeepFocus() {
    deepFocus.value = false;
  }

  return { deepFocus, toggleDeepFocus, exitDeepFocus };
});
