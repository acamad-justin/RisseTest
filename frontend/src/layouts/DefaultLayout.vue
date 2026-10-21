<script setup>
import AppHeader from '@/components/navigation/AppHeader.vue'
import AppFooter from '@/components/navigation/AppFooter.vue'
</script>

<template>
  <div class="default-layout">
    <AppHeader />

    <main class="default-layout__main" id="main-content" tabindex="-1">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.default-layout__main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
</style>
