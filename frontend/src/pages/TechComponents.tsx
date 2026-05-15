import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, Edit2, Trash2, Cpu } from 'lucide-react'
import { techComponentsApi } from '../api/techComponents'
import type { TechnologyComponent } from '../types'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'

const RINGS = ['adopt', 'trial', 'assess', 'hold'] as const
const TYPES = ['database', 'middleware', 'platform', 'service']

const ringColors: Record<string, string> = {
  adopt: 'bg-green-50 border-green-200',
  trial: 'bg-blue-50 border-blue-200',
  assess: 'bg-yellow-50 border-yellow-200',
  hold: 'bg-red-50 border-red-200',
}

const ringLabels: Record<string, string> = {
  adopt: 'Adopt — Proven, recommended',
  trial: 'Trial — Worth pursuing',
  assess: 'Assess — Worth exploring',
  hold: 'Hold — Proceed with caution',
}

const defaultForm: Partial<TechnologyComponent> = {
  name: '',
  component_type: 'platform',
  vendor: '',
  version: '',
  status: 'adopt',
  description: '',
  tags: '',
}

export default function TechComponents() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<TechnologyComponent | null>(null)
  const [deleteItem, setDeleteItem] = useState<TechnologyComponent | null>(null)
  const [form, setForm] = useState({ ...defaultForm })

  const { data: components = [], isLoading } = useQuery({
    queryKey: ['tech-components', search, typeFilter],
    queryFn: () => techComponentsApi.list({
      search: search || undefined,
      component_type: typeFilter || undefined,
    }),
  })

  const createMutation = useMutation({
    mutationFn: techComponentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-components'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TechnologyComponent> }) =>
      techComponentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-components'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: techComponentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-components'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteItem(null)
    },
  })

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...defaultForm })
    setModalOpen(true)
  }

  const openEdit = (comp: TechnologyComponent) => {
    setEditItem(comp)
    setForm({ ...comp })
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

  // Group by ring
  const grouped: Record<string, TechnologyComponent[]> = {}
  RINGS.forEach(ring => { grouped[ring] = [] })
  components.forEach(c => {
    if (grouped[c.status]) {
      grouped[c.status].push(c)
    } else {
      grouped['hold'].push(c)
    }
  })

  return (
    <div>
      <PageHeader
        title="Technology Radar"
        description="Categorize your technology stack by adoption ring"
        actions={
          <>
            <button className="btn-secondary" onClick={techComponentsApi.exportCsv}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Component
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="input w-40"
        >
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : components.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No technology components"
          description="Add tech stack items and categorize them by adoption ring"
          action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Component</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {RINGS.map(ring => (
            <div key={ring} className={`rounded-xl border-2 p-4 ${ringColors[ring]}`}>
              <div className="mb-3">
                <StatusBadge status={ring} type="tech" />
                <p className="text-xs text-gray-500 mt-1">{ringLabels[ring]}</p>
              </div>
              {grouped[ring].length === 0 ? (
                <p className="text-xs text-gray-400 italic">No items</p>
              ) : (
                <div className="space-y-2">
                  {grouped[ring].map(comp => (
                    <div key={comp.id} className="bg-white rounded-lg p-3 border border-gray-200 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm text-gray-900 truncate">{comp.name}</div>
                          {comp.vendor && (
                            <div className="text-xs text-gray-500">{comp.vendor}</div>
                          )}
                          {comp.version && (
                            <div className="text-xs text-gray-400">v{comp.version}</div>
                          )}
                        </div>
                        <span className="badge bg-gray-100 text-gray-600 capitalize text-xs flex-shrink-0">
                          {comp.component_type}
                        </span>
                      </div>
                      {comp.description && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{comp.description}</p>
                      )}
                      <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 rounded hover:bg-gray-100 text-gray-500"
                          onClick={() => openEdit(comp)}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                          onClick={() => setDeleteItem(comp)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit Tech Component' : 'New Technology Component'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.component_type}
                onChange={e => setForm(f => ({ ...f, component_type: e.target.value }))}
              >
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ring / Status</label>
              <select
                className="input"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as TechnologyComponent['status'] }))}
              >
                {RINGS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Vendor</label>
              <input
                className="input"
                value={form.vendor}
                onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Version</label>
              <input
                className="input"
                value={form.version}
                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px]"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Tags</label>
            <input
              className="input"
              placeholder="cloud, open-source"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
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
        title="Delete Tech Component"
        message={`Delete "${deleteItem?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
