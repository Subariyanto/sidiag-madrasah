import { useEffect, useState } from 'react'
import { History, Search } from 'lucide-react'
import { store } from '../../lib/store'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

export default function ActivityLogPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const data = store.getAll('activity_logs').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setItems(data)
    setLoading(false)
  }, [])

  const filtered = items.filter((i) =>
    i.description?.toLowerCase().includes(search.toLowerCase()) ||
    i.action?.toLowerCase().includes(search.toLowerCase()) ||
    i.entity?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Log Aktivitas" description="Riwayat aktivitas pengguna di sistem." />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari log..." className="w-full text-sm outline-none" />
      </div>
      {loading ? <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div> : filtered.length === 0 ? <EmptyState icon={History} title="Belum ada log aktivitas" /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Aksi</th><th className="px-4 py-3">Entitas</th><th className="px-4 py-3">Deskripsi</th></tr></thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(item.created_at).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-secondary-100 px-2 py-1 text-xs font-medium text-primary-800">{item.action}</span></td>
                  <td className="px-4 py-3 text-gray-500">{item.entity || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
