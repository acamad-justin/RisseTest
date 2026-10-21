/**
 * Health Service
 *
 * Example of how to structure service modules.
 * Each service module handles a specific API domain.
 */

import api from './api'

export const healthService = {
  /**
   * Check that the Laravel backend is reachable.
   * @returns {Promise<{ status: string, timestamp: string }>}
   */
  async check() {
    const response = await api.get('/health')
    return response.data
  },
}
