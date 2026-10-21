/**
 * profileStore.js — Pinia store for the Profile page.
 * All state is local/reactive. Replace initializers with API calls later.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { profileData as initial } from '@/mocks/profileData.js'

export const useProfileStore = defineStore('profile', () => {
  // Deep-clone initial data so hot-reloads don't mutate the source module
  const student      = ref({ ...initial.student })
  const stats        = ref({ ...initial.stats })
  const skills       = ref([...initial.skills])
  const achievements = ref(initial.achievements.map(a => ({ ...a })))
  const featured     = ref(initial.featuredProjects.map(p => ({ ...p, tags: [...p.tags] })))
  const isDemo       = initial.isDemo

  // ── Derived initials for avatar placeholder ────────────────────────────
  const initials = computed(() => {
    const parts = student.value.name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  })

  // ── Student edit ──────────────────────────────────────────────────────
  function saveStudent(patch) {
    Object.assign(student.value, patch)
  }

  // ── Featured projects ─────────────────────────────────────────────────
  function removeFeatured(id) {
    featured.value = featured.value.filter(p => p.id !== id)
  }

  function updateFeatured(id, patch) {
    const p = featured.value.find(p => p.id === id)
    if (p) Object.assign(p, patch)
  }

  return {
    student, stats, skills, achievements, featured, isDemo,
    initials,
    saveStudent, removeFeatured, updateFeatured,
  }
})
