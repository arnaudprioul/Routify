import { defineStore } from 'pinia';
import { ref } from 'vue';
import { isTauri, initDatabase, getSetting, setSetting } from '@/services/database.service';

export type TOnboardingGoal =
  | 'morning_routine'
  | 'fitness'
  | 'skincare'
  | 'productivity'
  | 'sleep'
  | 'mindfulness';

export type TScheduleType = 'morning_person' | 'balanced' | 'night_owl';

export interface IOnboardingState {
  completed: boolean;
  userName: string;
  goals: TOnboardingGoal[];
  scheduleType: TScheduleType | null;
}

const STORAGE_KEY = 'routify_onboarding';

const DEFAULT_STATE: IOnboardingState = {
  completed: false,
  userName: '',
  goals: [],
  scheduleType: null,
};

export const useOnboardingStore = defineStore('onboarding', () => {
  const state = ref<IOnboardingState>(_loadFromStorage());

  function _loadFromStorage(): IOnboardingState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  /** Call once before app mount to hydrate from SQLite when available. */
  async function init(): Promise<void> {
    const dbReady = await initDatabase();
    if (!dbReady) return;

    const raw = await getSetting('onboarding');
    if (raw) {
      try {
        state.value = { ...DEFAULT_STATE, ...JSON.parse(raw) };
      } catch { /* keep existing */ }
    } else {
      // Migrate from localStorage on first SQLite run
      const lsRaw = localStorage.getItem(STORAGE_KEY);
      if (lsRaw) {
        await setSetting('onboarding', lsRaw);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  function _save() {
    if (!isTauri) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));
      return;
    }
    void setSetting('onboarding', JSON.stringify(state.value));
  }

  function completeOnboarding(data: Omit<IOnboardingState, 'completed'>) {
    state.value = { ...data, completed: true };
    _save();
  }

  function reset() {
    state.value = { ...DEFAULT_STATE };
    if (isTauri) {
      void setSetting('onboarding', JSON.stringify(DEFAULT_STATE));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return { state, init, completeOnboarding, reset };
});
