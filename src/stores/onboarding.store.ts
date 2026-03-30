import { defineStore } from 'pinia';
import { ref } from 'vue';

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
  const state = ref<IOnboardingState>(loadFromStorage());

  function loadFromStorage(): IOnboardingState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));
  }

  function completeOnboarding(data: Omit<IOnboardingState, 'completed'>) {
    state.value = { ...data, completed: true };
    save();
  }

  function reset() {
    state.value = { ...DEFAULT_STATE };
    localStorage.removeItem(STORAGE_KEY);
  }

  return { state, completeOnboarding, reset };
});
