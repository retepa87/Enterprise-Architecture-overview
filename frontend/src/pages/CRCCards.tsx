import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, Edit2, Trash2, CreditCard, Printer } from 'lucide-react'
import { crcCardsApi } from '../api/crcCards'
import { applicationsApi } from '../api/applications'
import { techComponentsApi } from '../api/techComponents'
import type { CRCCard } from '../types'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'

const COMPONENT_TYPES = ['application', 'capability', 'service']

const typeColors: Record<string, string> = {
  application: 'bg-blue-600',
  capability: 'bg-purple-600',
  service: 'bg-green-600',
}

const defaultForm = {
  component_name: '',
  component_type: 'application',
  responsibilities: '',
  collaborators: '',
  notes: '',
  tags: '',
  linked_application_ids: [] as number[],
  linked_tech_component_ids: [] as number[],
}

function CRCCardDisplay({ card, apps, techs, onEdit, onDelete }: {
  card: CRCCard
  apps: { id: number; name: string }[]
  techs: { id: number; name: string }[]
  onEdit: (c: CRCCard) => void
  onDelete: (c: CRCCard) => void
}) {
  const responsibilityList = card.responsibilities
    ? card.responsibilities.split('\n').filter(Boolean)
    : []
  const collaboratorList = card.collaborators
    ? card.collaborators.split('\n').filter(Boolean)
    : []

  const linkedApps = apps.filter(a => card.linked_application_ids?.includes(a.id))
  const linkedTechs = techs.filter(t => card.linked_tech_component_ids?.includes(t.id))

  return (
    <div className="card hover:shadow-md transition-shadow print:shadow-none print:border print:border-gray-400">
      {/* CRC Card Header */}
      <div className={`${typeColors[card.component_type] || 'bg-gray-600'} text-white px-4 py-3 rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">{card.component_name}</h3>
            <span className="text-xs opacity-80 capitalize">{card.component_type}</span>
          </div>
          <div className="flex gap-1 no-print">
            <button
              className="p-1.5 rounded hover:bg-white/20 transition-colors"
              onClick={() => onEdit(card)}
              title="Edit"
            >
              <Edit2 size={13} />
            </button>
            <button
              className="p-1.5 rounded hover:bg-white/20 transition-colors"
              onClick={() => onDelete(card)}
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 flex-1">
        {/* Responsibilities */}
        <div className="p-4">
          <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2">Responsibilities</h4>
          {responsibilityList.length === 0 ? (
            <p className="text-xs text-gray-400 italic">None defined</p>
          ) : (
            <ul className="space-y-1">
              {responsibilityList.map((r, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                  <span className="text-gray-400 mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Collaborators */}
        <div className="p-4">
          <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2">Collaborators</h4>
          {collaboratorList.length === 0 ? (
            <p className="text-xs text-gray-400 italic">None defined</p>
          ) : (
            <ul className="space-y-1">
              {collaboratorList.map((c, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                  <span className="text-gray-400 mt-0.5">◦</span>
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Notes / links footer */}
      {(card.notes || linkedApps.length > 0 || linkedTechs.length > 0) && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          {card.notes && (
            <p className="text-xs text-gray-500 italic mb-2">{card.notes}</p>
          )}
          {(linkedApps.length > 0 || linkedTechs.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {linkedApps.map(a => (
                <span key={a.id} className="badge bg-blue-50 text-blue-700">{a.name}</span>
              ))}
              {linkedTechs.map(t => (
                <span key={t.id} className="badge bg-green-50 text-green-700">{t.name}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CRCCards() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<CRCCard | null>(null)
  const [deleteItem, setDeleteItem] = useState<CRCCard | null>(null)
  const [form, setForm] = useState({ ...defaultForm })

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['crc-cards', search, typeFilter],
    queryFn: () => crcCardsApi.list({
      search: search || undefined,
      component_type: typeFilter || undefined,
    }),
  })

  const { data: apps = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list(),
  })

  const { data: techs = [] } = useQuery({
    queryKey: ['tech-components'],
    queryFn: () => techComponentsApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: crcCardsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crc-cards'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => crcCardsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crc-cards'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: crcCardsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crc-cards'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteItem(null)
    },
  })

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...defaultForm })
    setModalOpen(true)
  }

  const openEdit = (card: CRCCard) => {
    setEditItem(card)
    setForm({
      component_name: card.component_name,
      component_type: card.component_type,
      responsibilities: card.responsibilities || '',
      collaborators: card.collaborators || '',
      notes: card.notes || '',
      tags: card.tags || '',
      linked_application_ids: card.linked_application_ids || [],
      linked_tech_component_ids: card.linked_tech_component_ids || [],
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

  const toggleApp = (id: number) => {
    setForm(f => ({
      ...f,
      linked_application_ids: f.linked_application_ids.includes(id)
        ? f.linked_application_ids.filter(x => x !== id)
        : [...f.linked_application_ids, id],
    }))
  }

  const toggleTech = (id: number) => {
    setForm(f => ({
      ...f,
      linked_tech_component_ids: f.linked_tech_component_ids.includes(id)
        ? f.linked_tech_component_ids.filter(x => x !== id)
        : [...f.linked_tech_component_ids, id],
    }))
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <PageHeader
        title="CRC Card Board"
        description="Component-Responsibility-Collaborator cards for your architecture"
        actions={
          <>
            <button className="btn-secondary no-print" onClick={() => window.print()}>
              <Printer size={16} /> Print
            </button>
            <button className="btn-secondary no-print" onClick={crcCardsApi.exportCsv}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn-primary no-print" onClick={openCreate}>
              <Plus size={16} /> New CRC Card
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 no-print">
        <input
          type="text"
          placeholder="Search cards..."
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
          {COMPONENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No CRC cards yet"
          description="Create CRC cards to document component responsibilities and collaborations"
          action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> New CRC Card</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map(card => (
            <CRCCardDisplay
              key={card.id}
              card={card}
              apps={apps}
              techs={techs}
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
        title={editItem ? 'Edit CRC Card' : 'New CRC Card'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Component Name *</label>
              <input
                className="input"
                value={form.component_name}
                onChange={e => setForm(f => ({ ...f, component_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Component Type</label>
              <select
                className="input"
                value={form.component_type}
                onChange={e => setForm(f => ({ ...f, component_type: e.target.value }))}
              >
                {COMPONENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Responsibilities</label>
            <p className="text-xs text-gray-400 mb-1">One responsibility per line</p>
            <textarea
              className="input min-h-[100px] font-mono text-sm"
              placeholder="Manages user authentication&#10;Handles session tokens&#10;Validates API requests"
              value={form.responsibilities}
              onChange={e => setForm(f => ({ ...f, responsibilities: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Collaborators</label>
            <p className="text-xs text-gray-400 mb-1">One collaborator per line</p>
            <textarea
              className="input min-h-[80px] font-mono text-sm"
              placeholder="User Service&#10;Token Store&#10;API Gateway"
              value={form.collaborators}
              onChange={e => setForm(f => ({ ...f, collaborators: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[60px]"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Tags</label>
            <input
              className="input"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            />
          </div>
          {apps.length > 0 && (
            <div>
              <label className="label">Link to Applications</label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg max-h-28 overflow-y-auto">
                {apps.map(a => (
                  <label key={a.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.linked_application_ids.includes(a.id)}
                      onChange={() => toggleApp(a.id)}
                      className="rounded"
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          {techs.length > 0 && (
            <div>
              <label className="label">Link to Tech Components</label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg max-h-28 overflow-y-auto">
                {techs.map(t => (
                  <label key={t.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.linked_tech_component_ids.includes(t.id)}
                      onChange={() => toggleTech(t.id)}
                      className="rounded"
                    />
                    {t.name}
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

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
        title="Delete CRC Card"
        message={`Delete CRC card "${deleteItem?.component_name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
