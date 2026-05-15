import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, Edit2, Trash2, AppWindow, Filter } from 'lucide-react'
import { applicationsApi } from '../api/applications'
import { capabilitiesApi } from '../api/capabilities'
import { domainsApi } from '../api/domains'
import type { Application } from '../types'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'

const defaultForm: Partial<Application> & { capability_ids: number[]; domain_ids: number[] } = {
  name: '',
  description: '',
  status: 'active',
  lifecycle: '',
  owner: '',
  tags: '',
  capability_ids: [],
  domain_ids: [],
}

export default function Applications() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Application | null>(null)
  const [deleteItem, setDeleteItem] = useState<Application | null>(null)
  const [form, setForm] = useState({ ...defaultForm })

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['applications', search, statusFilter],
    queryFn: () => applicationsApi.list({ search: search || undefined, status: statusFilter || undefined }),
  })

  const { data: capabilities = [] } = useQuery({
    queryKey: ['capabilities'],
    queryFn: () => capabilitiesApi.list(),
  })

  const { data: domains = [] } = useQuery({
    queryKey: ['domains'],
    queryFn: () => domainsApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => applicationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: applicationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteItem(null)
    },
  })

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...defaultForm })
    setModalOpen(true)
  }

  const openEdit = (app: Application) => {
    setEditItem(app)
    setForm({
      name: app.name,
      description: app.description || '',
      status: app.status,
      lifecycle: app.lifecycle || '',
      owner: app.owner || '',
      tags: app.tags || '',
      capability_ids: app.capability_ids || [],
      domain_ids: app.domain_ids || [],
    })
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

  const toggleCapability = (id: number) => {
    setForm(f => ({
      ...f,
      capability_ids: f.capability_ids.includes(id)
        ? f.capability_ids.filter(c => c !== id)
        : [...f.capability_ids, id],
    }))
  }

  const toggleDomain = (id: number) => {
    setForm(f => ({
      ...f,
      domain_ids: f.domain_ids.includes(id)
        ? f.domain_ids.filter(d => d !== id)
        : [...f.domain_ids, id],
    }))
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <PageHeader
        title="Application Portfolio"
        description="Manage your business applications and their lifecycle"
        actions={
          <>
            <button className="btn-secondary" onClick={applicationsApi.exportCsv}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Application
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search applications..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input w-36"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="planned">Planned</option>
          <option value="sunset">Sunset</option>
        </select>
        {(search || statusFilter) && (
          <button
            className="btn-secondary"
            onClick={() => { setSearch(''); setStatusFilter('') }}
          >
            <Filter size={16} /> Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : apps.length === 0 ? (
        <EmptyState
          icon={AppWindow}
          title="No applications found"
          description="Add your first business application to get started"
          action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Application</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {apps.map(app => (
            <div key={app.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
                  {app.owner && <p className="text-xs text-gray-500 mt-0.5">{app.owner}</p>}
                </div>
                <StatusBadge status={app.status} />
              </div>
              {app.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{app.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                {app.lifecycle && (
                  <span className="badge bg-gray-100 text-gray-600">{app.lifecycle}</span>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => openEdit(app)}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                  onClick={() => setDeleteItem(app)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit Application' : 'New Application'}
        size="lg"
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
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px]"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Application['status'] }))}
              >
                <option value="active">Active</option>
                <option value="planned">Planned</option>
                <option value="sunset">Sunset</option>
              </select>
            </div>
            <div>
              <label className="label">Lifecycle</label>
              <input
                className="input"
                placeholder="e.g. Production, POC"
                value={form.lifecycle}
                onChange={e => setForm(f => ({ ...f, lifecycle: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Owner</label>
            <input
              className="input"
              placeholder="Team or person responsible"
              value={form.owner}
              onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              className="input"
              placeholder="crm, customer-facing, legacy"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            />
          </div>
          {capabilities.length > 0 && (
            <div>
              <label className="label">Business Capabilities</label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg max-h-32 overflow-y-auto">
                {capabilities.map(cap => (
                  <label key={cap.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.capability_ids.includes(cap.id)}
                      onChange={() => toggleCapability(cap.id)}
                      className="rounded"
                    />
                    {cap.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          {domains.length > 0 && (
            <div>
              <label className="label">Business Domains</label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg max-h-24 overflow-y-auto">
                {domains.map(d => (
                  <label key={d.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.domain_ids.includes(d.id)}
                      onChange={() => toggleDomain(d.id)}
                      className="rounded"
                    />
                    {d.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
        title="Delete Application"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
