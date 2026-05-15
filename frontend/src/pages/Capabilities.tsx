import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, Edit2, Trash2, Network, ChevronRight, ChevronDown } from 'lucide-react'
import { capabilitiesApi } from '../api/capabilities'
import type { BusinessCapability } from '../types'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'

const defaultForm: Partial<BusinessCapability> = {
  name: '',
  description: '',
  level: 1,
  parent_id: undefined,
  owner: '',
  tags: '',
}

const levelColors = ['bg-blue-100 text-blue-800', 'bg-purple-100 text-purple-800', 'bg-green-100 text-green-800']

function CapabilityNode({
  cap,
  depth = 0,
  onEdit,
  onDelete,
}: {
  cap: BusinessCapability
  depth?: number
  onEdit: (c: BusinessCapability) => void
  onDelete: (c: BusinessCapability) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = cap.children && cap.children.length > 0

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 group ${
          depth === 0 ? 'border border-gray-200 mb-1' : 'mb-0.5'
        }`}
        style={{ paddingLeft: `${depth * 24 + 10}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-5 h-5 flex items-center justify-center flex-shrink-0"
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-sm">{cap.name}</span>
            <span className={`badge text-xs ${levelColors[Math.min(cap.level - 1, 2)]}`}>L{cap.level}</span>
          </div>
          {cap.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{cap.description}</p>}
        </div>
        {cap.owner && <span className="text-xs text-gray-400 hidden group-hover:block">{cap.owner}</span>}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 rounded hover:bg-gray-200 text-gray-500"
            onClick={() => onEdit(cap)}
          >
            <Edit2 size={13} />
          </button>
          <button
            className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
            onClick={() => onDelete(cap)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {cap.children!.map(child => (
            <CapabilityNode
              key={child.id}
              cap={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Capabilities() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<BusinessCapability | null>(null)
  const [deleteItem, setDeleteItem] = useState<BusinessCapability | null>(null)
  const [form, setForm] = useState({ ...defaultForm })

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['capabilities-tree'],
    queryFn: capabilitiesApi.tree,
  })

  const { data: allCaps = [] } = useQuery({
    queryKey: ['capabilities'],
    queryFn: () => capabilitiesApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: capabilitiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capabilities'] })
      queryClient.invalidateQueries({ queryKey: ['capabilities-tree'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BusinessCapability> }) =>
      capabilitiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capabilities'] })
      queryClient.invalidateQueries({ queryKey: ['capabilities-tree'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: capabilitiesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capabilities'] })
      queryClient.invalidateQueries({ queryKey: ['capabilities-tree'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteItem(null)
    },
  })

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...defaultForm })
    setModalOpen(true)
  }

  const openEdit = (cap: BusinessCapability) => {
    setEditItem(cap)
    setForm({
      name: cap.name,
      description: cap.description || '',
      level: cap.level,
      parent_id: cap.parent_id,
      owner: cap.owner || '',
      tags: cap.tags || '',
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

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <PageHeader
        title="Business Capability Map"
        description="Hierarchical view of your organization's capabilities"
        actions={
          <>
            <button className="btn-secondary" onClick={capabilitiesApi.exportCsv}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Capability
            </button>
          </>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : tree.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No capabilities defined"
          description="Build your capability map by adding level 1, 2, and 3 capabilities"
          action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Capability</button>}
        />
      ) : (
        <div className="card p-4">
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
            <span className={`badge ${levelColors[0]}`}>L1 — Strategic</span>
            <span className={`badge ${levelColors[1]}`}>L2 — Operational</span>
            <span className={`badge ${levelColors[2]}`}>L3 — Detailed</span>
          </div>
          {tree.map(cap => (
            <CapabilityNode
              key={cap.id}
              cap={cap}
              onEdit={openEdit}
              onDelete={setDeleteItem}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit Capability' : 'New Business Capability'}
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
              <label className="label">Level</label>
              <select
                className="input"
                value={form.level}
                onChange={e => setForm(f => ({ ...f, level: parseInt(e.target.value) }))}
              >
                <option value={1}>Level 1 (Strategic)</option>
                <option value={2}>Level 2 (Operational)</option>
                <option value={3}>Level 3 (Detailed)</option>
              </select>
            </div>
            <div>
              <label className="label">Parent Capability</label>
              <select
                className="input"
                value={form.parent_id ?? ''}
                onChange={e => setForm(f => ({ ...f, parent_id: e.target.value ? parseInt(e.target.value) : undefined }))}
              >
                <option value="">None (root level)</option>
                {allCaps
                  .filter(c => !editItem || c.id !== editItem.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name} (L{c.level})</option>
                  ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Owner</label>
            <input
              className="input"
              value={form.owner}
              onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
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
        title="Delete Capability"
        message={`Delete "${deleteItem?.name}"? Any child capabilities will become orphaned.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
