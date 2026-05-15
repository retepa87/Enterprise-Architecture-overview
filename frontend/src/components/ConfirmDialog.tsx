import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3 mb-6">
        <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </button>
        <button className="btn-danger" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
