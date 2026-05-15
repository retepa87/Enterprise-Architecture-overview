import { apiClient } from './client'
import type { Interface } from '../types'

export const interfacesApi = {
  list: async (params?: { search?: string; source_id?: number; target_id?: number; protocol?: string }): Promise<Interface[]> => {
    const { data } = await apiClient.get('/interfaces', { params })
    return data
  },

  get: async (id: number): Promise<Interface> => {
    const { data } = await apiClient.get(`/interfaces/${id}`)
    return data
  },

  create: async (payload: Partial<Interface>): Promise<Interface> => {
    const { data } = await apiClient.post('/interfaces', payload)
    return data
  },

  update: async (id: number, payload: Partial<Interface>): Promise<Interface> => {
    const { data } = await apiClient.put(`/interfaces/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/interfaces/${id}`)
  },

  exportCsv: () => {
    window.open('/api/interfaces/export', '_blank')
  },
}
