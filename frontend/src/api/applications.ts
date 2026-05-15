import { apiClient } from './client'
import type { Application } from '../types'

export interface ApplicationFilters {
  search?: string
  status?: string
  owner?: string
}

export const applicationsApi = {
  list: async (filters?: ApplicationFilters): Promise<Application[]> => {
    const { data } = await apiClient.get('/applications', { params: filters })
    return data
  },

  get: async (id: number): Promise<Application> => {
    const { data } = await apiClient.get(`/applications/${id}`)
    return data
  },

  create: async (payload: Partial<Application> & { capability_ids?: number[]; domain_ids?: number[] }): Promise<Application> => {
    const { data } = await apiClient.post('/applications', payload)
    return data
  },

  update: async (id: number, payload: Partial<Application> & { capability_ids?: number[]; domain_ids?: number[] }): Promise<Application> => {
    const { data } = await apiClient.put(`/applications/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/applications/${id}`)
  },

  exportCsv: () => {
    window.open('/api/applications/export', '_blank')
  },
}
