import { createRouter, createWebHashHistory } from 'vue-router';
import TodayPage from '@/pages/today.vue';
import RoutinesPage from '@/pages/routines.vue';
import TemplatesPage from '@/pages/templates.vue';
import StatsPage from '@/pages/stats.vue';
import OnboardingPage from '@/pages/onboarding.vue';
import BreathingPage from '@/pages/breathing.vue';
import { useOnboardingStore } from '@/stores/onboarding.store';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/today' },
    { path: '/onboarding', name: 'onboarding', component: OnboardingPage, meta: { fullscreen: true } },
    { path: '/today', name: 'today', component: TodayPage },
    { path: '/routines', name: 'routines', component: RoutinesPage },
    { path: '/templates', name: 'templates', component: TemplatesPage },
    { path: '/stats', name: 'stats', component: StatsPage },
    { path: '/breathe', name: 'breathe', component: BreathingPage },
  ],
});

router.beforeEach((to) => {
  const onboarding = useOnboardingStore();
  if (!onboarding.state.completed && to.name !== 'onboarding') {
    return { name: 'onboarding' };
  }
});
