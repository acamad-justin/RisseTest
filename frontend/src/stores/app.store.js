/**
 * App Store — global application state.
 *
 * Holds state that many components need: loading flags,
 * notifications, and any app-wide settings.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  /* ---- State ---- */
  const isLoading = ref(false)
  const notifications = ref([])

  /* ---- Getters ---- */
  const hasNotifications = computed(() => notifications.value.length > 0)

  /* ---- Actions ---- */
  function setLoading(value) {
    isLoading.value = value
  }

  function addNotification({ type = 'info', message, duration = 5000 }) {
    const id = Date.now()
    notifications.value.push({ id, type, message })

    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration)
    }
  }

  function removeNotification(id) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  return {
    isLoading,
    notifications,
    hasNotifications,
    setLoading,
    addNotification,
    removeNotification,
  }
})
