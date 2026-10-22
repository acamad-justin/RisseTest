<script setup>
/**
 * AppLayout.vue
 * Full-viewport shell: fixed sidebar on the left, scrollable main area on the right.
 * Adapts its left-offset when the sidebar collapses.
 */
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import CosmicBackground from '@/components/layout/CosmicBackground.vue'

const route = useRoute()
const sidebarCollapsed = ref(false)

function onCollapseChange(collapsed) {
  sidebarCollapsed.value = collapsed
}

// Compute the left padding for the main content area.
// Sidebar margin (10px) + sidebar width + another 10px gap.
const mainOffset = computed(() => {
  const w = sidebarCollapsed.value ? 64 : 160
  return `${10 + w + 10}px`
})

// Notebook-section routes present a fully white workspace surface instead of
// the cosmic background. The cosmic background is hidden across the entire
// Notebook experience — the overview plus every conversation / project view —
// so no cosmic gradients or orange glow bleed in around the chat interface.
const isNotebookSection = computed(() =>
  ['notebooks', 'conversation', 'project', 'project-conversation'].includes(route.name)
)
</script>

<template>
  <div class="app-layout">
    <CosmicBackground v-if="!isNotebookSection" />
    <!-- The sidebar keeps its orange Risse branding across every route,
         including the Notebook section (per the spec: preserve its orange
         background and do not remove its orange branding). -->
    <Sidebar @collapse-change="onCollapseChange" />

    <main
      class="app-layout__main"
      id="main-content"
      tabindex="-1"
      :style="{ paddingLeft: mainOffset }"
    >
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  position: relative;
  /* Fill the #app viewport shell exactly — never grow beyond it. */
  flex: 1;
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  overflow: hidden;
  /* Background is handled by CosmicBackground — keep this transparent */
  background: transparent;
}

.app-layout__main {
  /* Remaining width/height beside the sidebar. */
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* pages manage their own internal scroll regions */
  box-sizing: border-box;
  /* No shell padding — each view manages its own spacing */
  transition: padding-left 260ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Each routed view fills the main area and manages its own scrolling. */
.app-layout__main > * {
  flex: 1;
  min-height: 0;
}

/* ── Mobile: sidebar becomes a bottom bar, main fills the screen ── */
@media (max-width: 479px) {
  .app-layout__main {
    padding-bottom: calc(64px + 16px); /* room for bottom nav bar */
    padding-top: 16px;
    padding-right: 16px;
    padding-left: 16px !important;
  }
}
</style>
