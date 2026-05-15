import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, Edit2, Trash2, Globe } from 'lucide-react'
import { domainsApi } from '../api/domains'
import type { BusinessDomain } from '../types'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'

const defaultForm: Partial<BusinessDomain> = {
  name: '',
  description: '',
  owner: '',
  tags: '',
}

const domainColors = [
  'border-l-blue-400',
  'border-l-purple-400',
  'border-l-green-400',
  'border-l-orange-400',
  'border-l-pink-400',
  'border-l-teal-400',
  'border-l-yellow-400',
  'border-l-red-400',
]

export default function Domains() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<BusinessDomain | null>(null)
  const [deleteItem, setDeleteItem] = useState<BusinessDomain | null>(null)
  const [form, setForm] = useState<Partial<BusinessDomain>>({ ...defaultForm })

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['domains', search],
    queryFn: () => domainsApi.list({ search: search || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: domainsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BusinessDomain> }) => domainsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: domainsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteItem(null)
    },
  })

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...defaultForm })
    setModalOpen(true)
  }

  const openEdit = (domain: BusinessDomain) => {
    setEditItem(domain)
    setForm({ ...domain })
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
        title="Business Domains"
        description="Organizational groupings and ownership areas"
        actions={
          <>
            <button className="btn-secondary" onClick={domainsApi.exportCsv}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Domain
            </button>
          </>
        }
      />

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search domains..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : domains.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No business domains"
          description="Create domains to group applications and assign ownership"
          action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Domain</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {domains.map((domain, idx) => (
            <div
              key={domain.id}
              className={`card p-4 border-l-4 ${domainColors[idx % domainColors.length]} hover:shadow-md transition-shadow group`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{domain.name}</h3>
              </div>
              {domain.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{domain.description}</p>
              )}
              {domain.owner && (
                <div className="text-xs text-gray-500">
                  Owner: <span className="font-medium">{domain.owner}</span>
                </div>
              )}
              {domain.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {domain.tags.split(',').map((tag, i) => (
                    <span key={i} className="badge bg-gray-100 text-gray-600">{tag.trim()}</span>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  onClick={() => openEdit(domain)}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                  onClick={() => setDeleteItem(domain)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Edit Domain' : 'New Business Domain'}>
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
              className="input min-h-[100px]"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Owner</label>
            <input
              className="input"
              value={form.owner}
              onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Tags</label>
            <input
              className="input"
              placeholder="finance, core, customer"
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
        title="Delete Domain"
        message={`Delete domain "${deleteItem?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
