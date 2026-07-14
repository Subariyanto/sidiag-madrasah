import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Hapus', onConfirm, onCancel, danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${danger ? 'bg-red-100 text-red-600' : 'bg-secondary-100 text-primary-800'}`}>
            <AlertTriangle size={18} />
          </div>
          <p className="text-sm font-bold text-gray-800">{title}</p>
        </div>
        {description && <p className="mb-4 text-sm text-gray-500">{description}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-800 hover:bg-primary-900'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
