/**
 * useApi composable
 *
 * Wraps an async API call with reactive loading and error state,
 * so views don't need to manage that boilerplate themselves.
 *
 * Usage:
 *   const { data, isLoading, error, execute } = useApi(healthService.check)
 *   await execute()
 */

import { ref } from 'vue'

export function useApi(apiFn) {
  const data = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  async function execute(...args) {
    isLoading.value = true
    error.value = null

    try {
      data.value = await apiFn(...args)
    } catch (err) {
      error.value = err?.response?.data?.message ?? err.message ?? 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, error, execute }
}
