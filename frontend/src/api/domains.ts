import { apiClient } from './client'
import type { BusinessDomain } from '../types'

export const domainsApi = {
  list: async (params?: { search?: string }): Promise<BusinessDomain[]> => {
    const { data } = await apiClient.get('/domains', { params })
    return data
  },

  get: async (id: number): Promise<BusinessDomain> => {
    const { data } = await apiClient.get(`/domains/${id}`)
    return data
  },

  create: async (payload: Partial<BusinessDomain>): Promise<BusinessDomain> => {
    const { data } = await apiClient.post('/domains', payload)
    return data
  },

  update: async (id: number, payload: Partial<BusinessDomain>): Promise<BusinessDomain> => {
    const { data } = await apiClient.put(`/domains/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/domains/${id}`)
  },

  exportCsv: () => {
    window.open('/api/domains/export', '_blank')
  },
}
