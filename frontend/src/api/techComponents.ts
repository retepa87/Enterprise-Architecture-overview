import { apiClient } from './client'
import type { TechnologyComponent } from '../types'

export const techComponentsApi = {
  list: async (params?: { search?: string; status?: string; component_type?: string; vendor?: string }): Promise<TechnologyComponent[]> => {
    const { data } = await apiClient.get('/tech-components', { params })
    return data
  },

  get: async (id: number): Promise<TechnologyComponent> => {
    const { data } = await apiClient.get(`/tech-components/${id}`)
    return data
  },

  create: async (payload: Partial<TechnologyComponent>): Promise<TechnologyComponent> => {
    const { data } = await apiClient.post('/tech-components', payload)
    return data
  },

  update: async (id: number, payload: Partial<TechnologyComponent>): Promise<TechnologyComponent> => {
    const { data } = await apiClient.put(`/tech-components/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tech-components/${id}`)
  },

  exportCsv: () => {
    window.open('/api/tech-components/export', '_blank')
  },
}
