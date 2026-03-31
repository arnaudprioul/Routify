<template>
  <div class="app-shell" :class="{ fullscreen: isFullscreen, 'deep-focus': ui.deepFocus }">
    <AppSidebar v-if="!isFullscreen && !ui.deepFocus" />
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import { useNotifications } from '@/composables/useNotifications';
import { useUiStore } from '@/stores/ui.store';
import { useTray } from '@/composables/useTray';

const route = useRoute();
const router = useRouter();
const ui = useUiStore();
const isFullscreen = computed(() => !!route.meta.fullscreen);

useNotifications();
useTray();

// Expose navigation for Tauri tray menu → window.__routify_navigate('/focus/:id')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__routify_navigate = (path: string) => router.push(path);

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && ui.deepFocus) {
    ui.exitDeepFocus();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.app-shell {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--bg-deep);
  overflow: hidden;
  transition: background var(--duration-slow) var(--ease-out);
}

.app-shell.fullscreen .app-main,
.app-shell.deep-focus .app-main {
  background: #050508;
}

.app-shell.deep-focus {
  background: #050508;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-base);
  position: relative;
  transition: background var(--duration-slow) var(--ease-out);
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity var(--duration-base) var(--ease-out),
              transform var(--duration-base) var(--ease-out);
}
.page-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
