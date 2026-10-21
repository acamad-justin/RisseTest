/**
 * notebooksStore.js — shared reactive state for the Notebooks feature.
 *
 * Navigation is handled by Vue Router (URL params), NOT by this store.
 * The store only owns data and the actions that mutate it.
 * Views derive their active Log / Project by reading route params and
 * calling getLog(id) / getProject(id).
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { initialLogs, initialProjects } from '@/mocks/notebooksData.js'

function uid() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export const useNotebooksStore = defineStore('notebooks', () => {
  // ── State ────────────────────────────────────────────────────────────────
  const logs     = ref(initialLogs.map(l => ({ ...l, messages: [...(l.messages || [])] })))
  const projects = ref(initialProjects.map(p => ({ ...p })))

  // ── Computed ─────────────────────────────────────────────────────────────

  /** All logs newest-first */
  const sortedLogs = computed(() =>
    [...logs.value].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  )

  /** Log count per projectId */
  const logCountByProject = computed(() => {
    const counts = {}
    for (const log of logs.value) {
      if (log.projectId) counts[log.projectId] = (counts[log.projectId] || 0) + 1
    }
    return counts
  })

  // ── Lookups ──────────────────────────────────────────────────────────────

  function getLog(id) {
    return logs.value.find(l => l.id === id) ?? null
  }

  function getProject(id) {
    return projects.value.find(p => p.id === id) ?? null
  }

  function logsForProject(projectId) {
    return sortedLogs.value.filter(l => l.projectId === projectId)
  }

  // ── Log mutations ────────────────────────────────────────────────────────

  function createLog({ title = 'New Log', projectId = null } = {}) {
    const now = new Date().toISOString()
    const log = {
      id:        uid(),
      title:     title.trim() || 'New Log',
      preview:   '',
      createdAt: now,
      updatedAt: now,
      projectId: projectId || null,
      messages:  [],
    }
    logs.value.unshift(log)
    return log
  }

  function renameLog(id, newTitle) {
    const log = getLog(id)
    if (log) log.title = newTitle.trim() || log.title
  }

  function deleteLog(id) {
    logs.value = logs.value.filter(l => l.id !== id)
  }

  function moveLogToProject(logId, projectId) {
    const log = getLog(logId)
    if (log) log.projectId = projectId || null
  }

  function sendMessage(logId, content) {
    const log = getLog(logId)
    if (!log) return
    const now = new Date().toISOString()
    log.messages.push({
      id:        uid(),
      role:      'user',
      content:   content.trim(),
      createdAt: now,
    })
    log.updatedAt = now
    log.preview   = content.trim().slice(0, 120)
  }

  // ── Project mutations ────────────────────────────────────────────────────

  function createProject({ title, description = '' }) {
    const now = new Date().toISOString()
    const project = {
      id:          uid(),
      title:       title.trim(),
      description: description.trim(),
      createdAt:   now,
    }
    projects.value.unshift(project)
    return project
  }

  return {
    // state
    logs,
    projects,
    // computed
    sortedLogs,
    logCountByProject,
    // lookups
    getLog,
    getProject,
    logsForProject,
    fmtDate,
    // log actions
    createLog,
    renameLog,
    deleteLog,
    moveLogToProject,
    sendMessage,
    // project actions
    createProject,
  }
})
