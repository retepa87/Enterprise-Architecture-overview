import { apiClient } from './client'
import type { BusinessCapability } from '../types'

export const capabilitiesApi = {
  list: async (params?: { search?: string; level?: number }): Promise<BusinessCapability[]> => {
    const { data } = await apiClient.get('/capabilities', { params })
    return data
  },

  tree: async (): Promise<BusinessCapability[]> => {
    const { data } = await apiClient.get('/capabilities/tree')
    return data
  },

  get: async (id: number): Promise<BusinessCapability> => {
    const { data } = await apiClient.get(`/capabilities/${id}`)
    return data
  },

  create: async (payload: Partial<BusinessCapability>): Promise<BusinessCapability> => {
    const { data } = await apiClient.post('/capabilities', payload)
    return data
  },

  update: async (id: number, payload: Partial<BusinessCapability>): Promise<BusinessCapability> => {
    const { data } = await apiClient.put(`/capabilities/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/capabilities/${id}`)
  },

  exportCsv: () => {
    window.open('/api/capabilities/export', '_blank')
  },
}
