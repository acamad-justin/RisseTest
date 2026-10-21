<script setup>
/**
 * ProfileView.vue — Risse Profile page.
 *
 * Layout strategy — fit everything in one viewport height:
 *
 *  ┌───────────────────────────────────────────────────┐  ← 100vh
 *  │  "Profile"   [demo badge]                         │  ← header row (fixed height)
 *  │  ┌──────────────────────┐  ┌───────────────────┐  │
 *  │  │  LEFT (scrollable)   │  │  RIGHT (scrollable)│  │
 *  │  │  StudentInfoCard     │  │  Stats row         │  │
 *  │  │  Skills              │  │  Featured Projects │  │
 *  │  │  Achievements        │  │    card × n        │  │
 *  │  └──────────────────────┘  └───────────────────┘  │
 *  └───────────────────────────────────────────────────┘
 *
 * Both columns are independently scrollable so the page itself never
 * grows beyond 100vh and the user never has to scroll the outer page.
 *
 * The cosmic background is covered by the white background of this page.
 */
import { ref } from 'vue'

import StudentInfoCard     from '@/components/profile/StudentInfoCard.vue'
import ProfileStats        from '@/components/profile/ProfileStats.vue'
import SkillTags           from '@/components/profile/SkillTags.vue'
import AchievementsSection from '@/components/profile/AchievementsSection.vue'
import FeaturedProjects    from '@/components/profile/FeaturedProjects.vue'
import EditProfileModal    from '@/components/profile/EditProfileModal.vue'

import { useProfileStore } from '@/stores/profileStore.js'

const store = useProfileStore()

const editOpen = ref(false)

function onSave(patch) {
  store.saveStudent(patch)
  editOpen.value = false
}

function onRemoveFeatured(id) {
  if (window.confirm('Remove this project from Featured?')) store.removeFeatured(id)
}

function onEditFeatured(id) {
  alert(`Edit "${store.featured.find(p => p.id === id)?.title}" — not yet implemented (demo mode)`)
}

function onOpenProject(id) {
  alert(`Open project workspace — not yet implemented (demo mode, id: ${id})`)
}
</script>

<template>
  <div class="pp">

    <!-- ── Top header row ────────────────────────────────────────── -->
    <div class="pp__toprow">
      <h1 class="pp__heading">Profile</h1>
      <span v-if="store.isDemo" class="pp__demo-badge">Demo data</span>
    </div>

    <!-- ── Two-column body ──────────────────────────────────────── -->
    <div class="pp__body">

      <!-- LEFT: info card + skills + achievements -->
      <div class="pp__left">
        <StudentInfoCard
          :student="store.student"
          :initials="store.initials"
          @edit="editOpen = true"
        />
        <SkillTags :skills="store.skills" />
        <AchievementsSection :achievements="store.achievements" />
      </div>

      <!-- RIGHT: stats + featured projects -->
      <div class="pp__right">
        <ProfileStats :stats="store.stats" :is-demo="store.isDemo" />
        <FeaturedProjects
          :projects="store.featured"
          @remove="onRemoveFeatured"
          @edit="onEditFeatured"
          @open="onOpenProject"
        />
      </div>

    </div>

    <!-- Edit modal -->
    <EditProfileModal
      v-if="editOpen"
      :student="store.student"
      @save="onSave"
      @close="editOpen = false"
    />

  </div>
</template>

<style scoped>
/* ─── Root: exact viewport height, never scrolls itself ──────────────── */
.pp {
  flex: 1;
  height: 100%;
  min-height: 0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  padding: 28px 28px 16px 32px;
}

/* ─── Top row: heading + demo badge ─────────────────────────────────── */
.pp__toprow {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-shrink: 0;
  margin-bottom: 16px;
}

.pp__heading {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.025em;
  line-height: 1;
}

.pp__demo-badge {
  font-size: 9.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(0,0,0,0.10);
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
}

/* ─── Body: two columns that each scroll independently ──────────────── */
.pp__body {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  flex: 1;          /* fill remaining height below heading */
  min-height: 0;    /* required: lets grid children shrink below content size */
  overflow: hidden;
}

/* ─── LEFT column ────────────────────────────────────────────────────── */
.pp__left {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #e0e0ee transparent;
  padding-right: 4px;
  min-width: 0;
}

.pp__left::-webkit-scrollbar       { width: 4px; }
.pp__left::-webkit-scrollbar-track { background: transparent; }
.pp__left::-webkit-scrollbar-thumb { background: #e0e0ee; border-radius: 4px; }

/* ─── RIGHT column ───────────────────────────────────────────────────── */
.pp__right {
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #e0e0ee transparent;
  padding-right: 2px;
  min-width: 0;
}

.pp__right::-webkit-scrollbar       { width: 4px; }
.pp__right::-webkit-scrollbar-track { background: transparent; }
.pp__right::-webkit-scrollbar-thumb { background: #e0e0ee; border-radius: 4px; }

/* ─── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .pp__body { grid-template-columns: 1fr 260px; gap: 20px; }
}

@media (max-width: 640px) {
  .pp {
    padding: 20px 16px 24px;
  }

  /* Single column: the body itself becomes the one scroll region so the
     heading stays put and nothing is clipped or pushed off-screen. */
  .pp__body {
    grid-template-columns: 1fr;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: #e0e0ee transparent;
  }

  .pp__left,
  .pp__right {
    overflow: visible;
    height: auto;
  }

  .pp__right { gap: 14px; }
}
</style>
