import { apiClient } from './client'
import type { CRCCard } from '../types'

export const crcCardsApi = {
  list: async (params?: { search?: string; component_type?: string }): Promise<CRCCard[]> => {
    const { data } = await apiClient.get('/crc-cards', { params })
    return data
  },

  get: async (id: number): Promise<CRCCard> => {
    const { data } = await apiClient.get(`/crc-cards/${id}`)
    return data
  },

  create: async (payload: Partial<CRCCard> & { linked_application_ids?: number[]; linked_tech_component_ids?: number[] }): Promise<CRCCard> => {
    const { data } = await apiClient.post('/crc-cards', payload)
    return data
  },

  update: async (id: number, payload: Partial<CRCCard> & { linked_application_ids?: number[]; linked_tech_component_ids?: number[] }): Promise<CRCCard> => {
    const { data } = await apiClient.put(`/crc-cards/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/crc-cards/${id}`)
  },

  exportCsv: () => {
    window.open('/api/crc-cards/export', '_blank')
  },
}
