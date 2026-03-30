import { defineStore } from 'pinia';
import { ref } from 'vue';

interface ISettings {
  geminiApiKey: string;
}

const STORAGE_KEY = 'routify_settings';

export const useSettingsStore = defineStore('settings', () => {
  const geminiApiKey = ref<string>(load());

  function load(): string {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return '';
      return (JSON.parse(raw) as Partial<ISettings>).geminiApiKey ?? '';
    } catch {
      return '';
    }
  }

  function setGeminiApiKey(key: string) {
    geminiApiKey.value = key.trim();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ geminiApiKey: geminiApiKey.value }));
  }

  return { geminiApiKey, setGeminiApiKey };
});
