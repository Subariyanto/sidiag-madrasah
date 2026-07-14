import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, user:profiles(full_name, role)')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) toast.error('Gagal memuat log aktivitas: ' + error.message)
      else setLogs(data || [])
      setLoading(false)
    }
    fetchLogs()
  }, [])

  return (
    <div>
      <PageHeader title="Log Aktivitas" description="Riwayat aktivitas pengguna dalam sistem (200 terbaru)." />
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : logs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada log aktivitas" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Entitas</th>
                <th className="px-4 py-3">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.user?.full_name || 'Sistem'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary-100 px-2 py-1 text-xs font-medium text-primary-800">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{log.entity || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{log.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
