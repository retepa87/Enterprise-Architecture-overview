import { apiClient } from './client'
import type { DashboardStats, SearchResponse } from '../types'

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/dashboard')
    return data
  },

  search: async (q: string): Promise<SearchResponse> => {
    const { data } = await apiClient.get('/search', { params: { q } })
    return data
  },
}
