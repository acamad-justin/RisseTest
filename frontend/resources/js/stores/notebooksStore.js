/**
 * notebooksStore.js — shared reactive state for the Notebooks feature.
 *
 * Implemented as a singleton Vue 3 reactive store composable.
 * Zero mock data — real learner logs and projects persisted to localStorage.
 */
import { ref, computed, reactive, watch } from 'vue'

function uid() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function getInitialLogs() {
  try {
    const raw = localStorage.getItem('risse_notebooks_logs')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter(l => !l.id?.startsWith('log-sumbot') && !l.id?.startsWith('log-rob-'))
      }
    }
  } catch (e) {}
  return []
}

function getInitialProjects() {
  try {
    const raw = localStorage.getItem('risse_notebooks_projects')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter(p => !p.id?.startsWith('project-sumbot'))
      }
    }
  } catch (e) {}
  return []
}

// Clean state without mock data
const logs = ref(getInitialLogs())
const projects = ref(getInitialProjects())

function persist() {
  try {
    localStorage.setItem('risse_notebooks_logs', JSON.stringify(logs.value))
    localStorage.setItem('risse_notebooks_projects', JSON.stringify(projects.value))
  } catch (e) {}
}

watch(logs, persist, { deep: true })
watch(projects, persist, { deep: true })

const storeInstance = reactive({
  // state
  logs,
  projects,
  persist,
  // computed
  sortedLogs: computed(() =>
    [...logs.value].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  ),
  logCountByProject: computed(() => {
    const counts = {}
    for (const log of logs.value) {
      if (log.projectId) counts[log.projectId] = (counts[log.projectId] || 0) + 1
    }
    return counts
  }),
  // lookups
  getLog(id) {
    return logs.value.find(l => l.id === id) ?? null
  },
  getProject(id) {
    return projects.value.find(p => p.id === id) ?? null
  },
  logsForProject(projectId) {
    return storeInstance.sortedLogs.filter(l => l.projectId === projectId)
  },
  fmtDate,
  // log actions
  createLog({ title = 'New Log', projectId = null } = {}) {
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
    persist()
    return log
  },
  renameLog(id, newTitle) {
    const log = storeInstance.getLog(id)
    if (log) {
      log.title = newTitle.trim() || log.title
      persist()
    }
  },
  deleteLog(id) {
    logs.value = logs.value.filter(l => l.id !== id)
    persist()
  },
  moveLogToProject(logId, projectId) {
    const log = storeInstance.getLog(logId)
    if (log) {
      log.projectId = projectId || null
      persist()
    }
  },
  sendMessage(logId, content) {
    const log = storeInstance.getLog(logId)
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
    persist()
  },
  // project actions
  createProject({ title, description = '' }) {
    const now = new Date().toISOString()
    const project = {
      id:          uid(),
      title:       title.trim(),
      description: description.trim(),
      createdAt:   now,
    }
    projects.value.unshift(project)
    persist()
    return project
  },
})

export function useNotebooksStore() {
  return storeInstance
}
