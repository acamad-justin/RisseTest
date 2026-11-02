/**
 * notebooksStore.js — shared reactive state for the Notebooks feature.
 *
 * Implemented as a singleton Vue 3 reactive store composable.
 * Learner logs and projects persisted per authenticated user in localStorage.
 */
import { ref, computed, reactive, watch } from 'vue'

function uid() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function getActiveEmail() {
  try {
    const activeId = localStorage.getItem('risse_active_user_id')
    if (activeId) {
      const rawAccounts = localStorage.getItem('risse_registered_accounts')
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts)
        const user = accounts.find(a => a.id === activeId)
        if (user && user.email) return user.email.toLowerCase().trim()
      }
    }
  } catch (e) {}
  return ''
}

function getSafeEmailKey(email) {
  if (!email || typeof email !== 'string') return ''
  return email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')
}

function getLogsKey(email) {
  const safe = getSafeEmailKey(email)
  return safe ? `risse_email_${safe}_notebooks_logs` : 'risse_notebooks_logs'
}

function getProjectsKey(email) {
  const safe = getSafeEmailKey(email)
  return safe ? `risse_email_${safe}_notebooks_projects` : 'risse_notebooks_projects'
}

function getInitialLogs(email = getActiveEmail()) {
  if (!email) return []
  try {
    const userKey = getLogsKey(email)
    let raw = localStorage.getItem(userKey)
    // Backward compatibility: legacy keys only for adriel@risse.edu
    if (!raw && email === 'adriel@risse.edu') {
      raw = localStorage.getItem('risse_user_usr_adriel_notebooks_logs') || localStorage.getItem('risse_notebooks_logs')
    }
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter(l => !l.id?.startsWith('log-sumbot') && !l.id?.startsWith('log-rob-'))
      }
    }
  } catch (e) {}
  return []
}

function getInitialProjects(email = getActiveEmail()) {
  if (!email) return []
  try {
    const userKey = getProjectsKey(email)
    let raw = localStorage.getItem(userKey)
    if (!raw && email === 'adriel@risse.edu') {
      raw = localStorage.getItem('risse_user_usr_adriel_notebooks_projects') || localStorage.getItem('risse_notebooks_projects')
    }
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter(p => !p.id?.startsWith('project-sumbot'))
      }
    }
  } catch (e) {}
  return []
}

const currentEmail = ref(getActiveEmail())
const logs = ref(getInitialLogs(currentEmail.value))
const projects = ref(getInitialProjects(currentEmail.value))

function persist() {
  const email = currentEmail.value || getActiveEmail()
  if (!email) return // Do not persist unauthenticated logs into someone's account
  try {
    localStorage.setItem(getLogsKey(email), JSON.stringify(logs.value))
    localStorage.setItem(getProjectsKey(email), JSON.stringify(projects.value))
    if (email === 'adriel@risse.edu') {
      localStorage.setItem('risse_notebooks_logs', JSON.stringify(logs.value))
      localStorage.setItem('risse_notebooks_projects', JSON.stringify(projects.value))
    }
  } catch (e) {}
}

watch(logs, persist, { deep: true })
watch(projects, persist, { deep: true })

/**
 * Switch the notebooks store data to the specified email or active authenticated user
 */
function switchUser(target) {
  let targetEmail = ''
  if (typeof target === 'string') {
    if (target.includes('@')) {
      targetEmail = target.toLowerCase().trim()
    } else if (target) {
      // Lookup email by userId
      try {
        const rawAccounts = localStorage.getItem('risse_registered_accounts')
        if (rawAccounts) {
          const accounts = JSON.parse(rawAccounts)
          const user = accounts.find(a => a.id === target)
          if (user && user.email) targetEmail = user.email.toLowerCase().trim()
        }
      } catch (_) {}
    }
  } else if (target && target.email) {
    targetEmail = target.email.toLowerCase().trim()
  } else {
    targetEmail = getActiveEmail()
  }

  if (currentEmail.value === targetEmail) return

  // Persist old email's data under the old email key before switching
  if (currentEmail.value) {
    try {
      localStorage.setItem(getLogsKey(currentEmail.value), JSON.stringify(logs.value))
      localStorage.setItem(getProjectsKey(currentEmail.value), JSON.stringify(projects.value))
    } catch (_) {}
  }

  currentEmail.value = targetEmail
  logs.value = getInitialLogs(targetEmail)
  projects.value = getInitialProjects(targetEmail)
}

const storeInstance = reactive({
  // state
  logs,
  projects,
  currentEmail,
  persist,
  switchUser,
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
      favorite:    false,
      sections:    [],
      createdAt:   now,
    }
    projects.value.unshift(project)
    persist()
    return project
  },
  renameProject(id, newTitle) {
    const project = storeInstance.getProject(id)
    if (project) {
      project.title = newTitle.trim() || project.title
      persist()
    }
  },
  deleteProject(id) {
    projects.value = projects.value.filter(p => p.id !== id)
    // Detach logs that belonged to this project
    for (const log of logs.value) {
      if (log.projectId === id) log.projectId = null
    }
    persist()
  },
  toggleFavorite(id) {
    const project = storeInstance.getProject(id)
    if (project) {
      project.favorite = !project.favorite
      persist()
    }
  },
  addSection(projectId, { title, subtitle = '' }) {
    const project = storeInstance.getProject(projectId)
    if (!project) return null
    if (!Array.isArray(project.sections)) project.sections = []
    const section = { id: uid(), title: title.trim(), subtitle: subtitle.trim() }
    project.sections.push(section)
    persist()
    return section
  },
  updateSection(projectId, sectionId, { title, subtitle }) {
    const project = storeInstance.getProject(projectId)
    if (!project) return
    const section = project.sections?.find(s => s.id === sectionId)
    if (section) {
      if (title !== undefined) section.title = title.trim()
      if (subtitle !== undefined) section.subtitle = subtitle.trim()
      persist()
    }
  },
  deleteSection(projectId, sectionId) {
    const project = storeInstance.getProject(projectId)
    if (project && Array.isArray(project.sections)) {
      project.sections = project.sections.filter(s => s.id !== sectionId)
      persist()
    }
  },
})

export function useNotebooksStore() {
  return storeInstance
}
