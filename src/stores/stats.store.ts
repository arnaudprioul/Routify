import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useRoutineStore } from '@/stores/routines.store';

export interface IInsight {
  type: 'success' | 'warning' | 'tip' | 'info';
  key: string;
  params: Record<string, string | number>;
  routineId?: string;
  routineIcon?: string;
}

export const useStatsStore = defineStore('stats', () => {
  const routineStore = useRoutineStore();

  const insights = computed<IInsight[]>(() => {
    const result: IInsight[] = [];
    const todayMs = Date.now();

    for (const r of routineStore.routines) {
      const createdMs = new Date(r.createdAt + 'T12:00:00').getTime();
      const ageDays = Math.floor((todayMs - createdMs) / 86400000);
      const sorted = [...r.completedDates].sort().reverse();
      const lastDateMs =
        sorted.length > 0 ? new Date(sorted[0] + 'T12:00:00').getTime() : null;
      const daysSince =
        lastDateMs !== null ? Math.floor((todayMs - lastDateMs) / 86400000) : null;
      const totalDurationMin = r.items.reduce((s, i) => s + (i.durationMin ?? 0), 0);

      // Never completed (and routine is at least 3 days old)
      if (sorted.length === 0 && ageDays >= 3) {
        result.push({
          type: 'tip',
          key: totalDurationMin > 30 ? 'stats.insights.neverCompletedLong' : 'stats.insights.neverCompleted',
          params: { name: r.name, min: totalDurationMin },
          routineId: r.id,
          routineIcon: r.icon,
        });
        continue;
      }

      // Inactive for 3+ days (has history but hasn't been done recently)
      if (daysSince !== null && daysSince >= 3) {
        result.push({
          type: 'warning',
          key: 'stats.insights.inactive',
          params: { name: r.name, days: daysSince },
          routineId: r.id,
          routineIcon: r.icon,
        });
      }

      // Streak milestones (only show the highest applicable)
      if (r.streak >= 21) {
        result.push({
          type: 'success',
          key: 'stats.insights.habit21',
          params: { name: r.name, streak: r.streak },
          routineId: r.id,
          routineIcon: r.icon,
        });
      } else if (r.streak >= 7) {
        result.push({
          type: 'success',
          key: 'stats.insights.habit7',
          params: { name: r.name, streak: r.streak },
          routineId: r.id,
          routineIcon: r.icon,
        });
      } else if (r.streak >= 3) {
        result.push({
          type: 'info',
          key: 'stats.insights.forming',
          params: { name: r.name, streak: r.streak, remaining: 7 - r.streak },
          routineId: r.id,
          routineIcon: r.icon,
        });
      }
    }

    // Cross-routine: morning consistency vs other blocks
    const morning = routineStore.routines.filter((r) => r.timeBlock === 'morning');
    const other = routineStore.routines.filter((r) => r.timeBlock !== 'morning');
    const avgMorning =
      morning.length > 0 ? morning.reduce((s, r) => s + r.streak, 0) / morning.length : 0;
    const avgOther =
      other.length > 0 ? other.reduce((s, r) => s + r.streak, 0) / other.length : 0;

    if (morning.length > 0 && other.length > 0 && avgMorning > avgOther * 1.5 && avgMorning >= 2) {
      result.push({
        type: 'info',
        key: 'stats.insights.morningConsistency',
        params: {},
      });
    }

    return result.slice(0, 6);
  });

  return { insights };
});
