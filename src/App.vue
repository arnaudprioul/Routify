<template>
  <div class="app-shell" :class="{ fullscreen: isFullscreen }">
    <AppSidebar v-if="!isFullscreen" />
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
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '@/components/layout/AppSidebar.vue';

const route = useRoute();
const isFullscreen = computed(() => !!route.meta.fullscreen);
</script>

<style scoped>
.app-shell {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--bg-deep);
  overflow: hidden;
}

.app-shell.fullscreen .app-main {
  background: var(--bg-deep);
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-base);
  position: relative;
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
