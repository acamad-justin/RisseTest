import { createRouter, createWebHistory } from 'vue-router'

/**
 * Route definitions — all main routes nested under AppLayout.
 *
 * Notebooks navigation:
 *   /notebooks                          — overview (logs + projects)
 *   /logs/:logId                        — individual conversation
 *   /projects/:projectId                — project workspace (defaults to most-recent log)
 *   /projects/:projectId/logs/:logId    — specific log inside a project
 */
const routes = [
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: 'Home' },
      },
      {
        path: 'notebooks',
        name: 'notebooks',
        component: () => import('@/views/NotebooksView.vue'),
        meta: { title: 'Notebooks' },
      },

      // ── Individual log conversation ──────────────────────────────────
      {
        path: 'logs/:logId',
        name: 'conversation',
        component: () => import('@/views/ConversationView.vue'),
        meta: { title: 'Conversation' },
      },

      // ── Project workspace (optional nested log) ──────────────────────
      {
        path: 'projects/:projectId',
        name: 'project',
        component: () => import('@/views/ProjectWorkspaceView.vue'),
        meta: { title: 'Project' },
      },
      {
        path: 'projects/:projectId/logs/:logId',
        name: 'project-conversation',
        component: () => import('@/views/ProjectWorkspaceView.vue'),
        meta: { title: 'Project Conversation' },
      },

      {
        path: 'modules',
        name: 'modules',
        component: () => import('@/views/ModulesView.vue'),
        meta: { title: 'Modules' },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { title: 'Profile' },
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('@/views/AboutView.vue'),
        meta: { title: 'About' },
      },

      // ── Recall Practice ─────────────────────────────────────────────
      {
        path: 'recall',
        name: 'recall',
        component: () => import('@/views/RecallSessionView.vue'),
        meta: { title: 'Recall' },
      },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page Not Found' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  },
})

router.afterEach((to) => {
  const appName = import.meta.env.VITE_APP_NAME || 'Risse'
  document.title = to.meta.title ? `${to.meta.title} — ${appName}` : appName
})

export default router
