import { computed } from 'vue';
import { useRoutineStore } from '@/stores/routines.store';

export type TIdentityKey =
  | 'morning_person'
  | 'night_owl'
  | 'athlete'
  | 'focused'
  | 'self_care'
  | 'balanced'
  | 'consistent';

const STREAK_THRESHOLD = 21;
const BALANCED_THRESHOLD = 7;
const BALANCED_COUNT = 3;

/** Icons shown next to each identity label in the sidebar. */
export const IDENTITY_ICONS: Record<TIdentityKey, string> = {
  morning_person: '🌅',
  night_owl: '🌙',
  athlete: '⚡',
  focused: '◉',
  self_care: '✦',
  balanced: '◆',
  consistent: '●',
};

/**
 * Derives up to 2 identity labels from the user's routine streaks.
 * An identity is "earned" once the relevant streak hits 21 consecutive days.
 */
export function useIdentity() {
  const store = useRoutineStore();

  const identities = computed((): TIdentityKey[] => {
    const routines = store.routines;
    const earned = new Set<TIdentityKey>();

    for (const r of routines) {
      if (r.streak >= STREAK_THRESHOLD) {
        if (r.timeBlock === 'morning') earned.add('morning_person');
        if (r.timeBlock === 'evening') earned.add('night_owl');

        const name = r.name.toLowerCase();
        if (/workout|fitness|gym|sport|train|athlete|run|yoga/i.test(name)) {
          earned.add('athlete');
        }
        if (/focus|work|productiv|deep|entrepreneur/i.test(name)) {
          earned.add('focused');
        }
        if (/skin|beauty|glow|care|serum|nourish/i.test(name)) {
          earned.add('self_care');
        }

        // Fallback: any 21-day streak
        earned.add('consistent');
      }
    }

    // Balanced: 3+ distinct routines each with streak >= 7
    const streaking = routines.filter((r) => r.streak >= BALANCED_THRESHOLD);
    if (streaking.length >= BALANCED_COUNT) earned.add('balanced');

    // Drop generic 'consistent' when a more specific identity was earned
    if (earned.size > 1) earned.delete('consistent');

    // Return up to 2, prioritise specificity
    const priority: TIdentityKey[] = [
      'athlete', 'focused', 'self_care', 'morning_person',
      'night_owl', 'balanced', 'consistent',
    ];
    return priority.filter((k) => earned.has(k)).slice(0, 2);
  });

  return { identities };
}
