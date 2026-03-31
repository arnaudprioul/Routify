import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './routes/index.route';
import { i18n } from './plugins/i18n';
import './assets/css/global.css';
import { useRoutineStore } from './stores/routines.store';
import { useOnboardingStore } from './stores/onboarding.store';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(i18n);

// Hydrate stores from SQLite (no-op in browser — uses localStorage)
const routineStore = useRoutineStore();
const onboardingStore = useOnboardingStore();
Promise.all([routineStore.init(), onboardingStore.init()]).finally(() => {
  app.mount('#app');
});
