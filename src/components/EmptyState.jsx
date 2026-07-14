import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'Belum ada data', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/50 px-6 py-12 text-center">
      <Icon size={40} className="mb-3 text-gray-300" />
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
