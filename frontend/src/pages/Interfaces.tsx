import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, Edit2, Trash2, ArrowLeftRight, ArrowRight } from 'lucide-react'
import { interfacesApi } from '../api/interfaces'
import { applicationsApi } from '../api/applications'
import type { Interface } from '../types'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'

const PROTOCOLS = ['REST', 'SOAP', 'gRPC', 'MQ', 'Kafka', 'FTP', 'SFTP', 'GraphQL', 'WebSocket', 'Other']
const FREQUENCIES = ['real-time', 'batch', 'event-driven', 'scheduled', 'on-demand']
const CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted']

const classificationColors: Record<string, string> = {
  public: 'bg-green-100 text-green-700',
  internal: 'bg-blue-100 text-blue-700',
  confidential: 'bg-yellow-100 text-yellow-700',
  restricted: 'bg-red-100 text-red-700',
}

const defaultForm: Partial<Interface> = {
  name: '',
  source_id: undefined,
  target_id: undefined,
  protocol: '',
  frequency: '',
  data_classification: '',
  description: '',
  tags: '',
}

export default function Interfaces() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Interface | null>(null)
  const [deleteItem, setDeleteItem] = useState<Interface | null>(null)
  const [form, setForm] = useState<Partial<Interface>>({ ...defaultForm })

  const { data: interfaces = [], isLoading } = useQuery({
    queryKey: ['interfaces', search],
    queryFn: () => interfacesApi.list({ search: search || undefined }),
  })

  const { data: apps = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: interfacesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interfaces'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Interface> }) => interfacesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interfaces'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: interfacesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interfaces'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteItem(null)
    },
  })

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...defaultForm })
    setModalOpen(true)
  }

  const openEdit = (iface: Interface) => {
    setEditItem(iface)
    setForm({ ...iface })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditItem(null)
    setForm({ ...defaultForm })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <PageHeader
        title="Integration Map"
        description="Application interfaces and integration points"
        actions={
          <>
            <button className="btn-secondary" onClick={interfacesApi.exportCsv}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Interface
            </button>
          </>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search interfaces..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : interfaces.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No interfaces defined"
          description="Document the integration points between your applications"
          action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Interface</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Interface</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Target</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Protocol</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Frequency</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Classification</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {interfaces.map(iface => (
                <tr key={iface.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{iface.name}</div>
                    {iface.description && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">{iface.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{iface.source_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">
                    <ArrowRight size={14} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{iface.target_name || '—'}</td>
                  <td className="px-4 py-3">
                    {iface.protocol && (
                      <span className="badge bg-gray-100 text-gray-700">{iface.protocol}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{iface.frequency || '—'}</td>
                  <td className="px-4 py-3">
                    {iface.data_classification && (
                      <span className={`badge capitalize ${classificationColors[iface.data_classification] || 'bg-gray-100 text-gray-700'}`}>
                        {iface.data_classification}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded hover:bg-gray-200 text-gray-500"
                        onClick={() => openEdit(iface)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                        onClick={() => setDeleteItem(iface)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit Interface' : 'New Interface'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Interface Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Source Application</label>
              <select
                className="input"
                value={form.source_id ?? ''}
                onChange={e => setForm(f => ({ ...f, source_id: e.target.value ? parseInt(e.target.value) : undefined }))}
              >
                <option value="">None</option>
                {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Target Application</label>
              <select
                className="input"
                value={form.target_id ?? ''}
                onChange={e => setForm(f => ({ ...f, target_id: e.target.value ? parseInt(e.target.value) : undefined }))}
              >
                <option value="">None</option>
                {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Protocol</label>
              <select
                className="input"
                value={form.protocol ?? ''}
                onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))}
              >
                <option value="">Select protocol</option>
                {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Frequency</label>
              <select
                className="input"
                value={form.frequency ?? ''}
                onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
              >
                <option value="">Select frequency</option>
                {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Data Classification</label>
            <select
              className="input"
              value={form.data_classification ?? ''}
              onChange={e => setForm(f => ({ ...f, data_classification: e.target.value }))}
            >
              <option value="">Select classification</option>
              {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px]"
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
        title="Delete Interface"
        message={`Delete interface "${deleteItem?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
