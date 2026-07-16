import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react'
import { store } from '../../lib/store'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

export default function DashboardSiswa() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.student_id) { setLoading(false); return }
    setLoading(true)
    const allAssignments = store.query('assessment_assignments', { student_id: profile.student_id })
    // Enrich
    const enriched = allAssignments.map((a) => {
      const instrument = store.getById('instruments', a.instrument_id)
      const period = store.getById('assessment_periods', a.period_id)
      return { ...a, instrument, period }
    })
    enriched.sort((a, b) => new Date(b.assigned_at || 0) - new Date(a.assigned_at || 0))
    setAssignments(enriched)
    setLoading(false)
  }, [profile])

  const statusBadge = (status) => {
    const map = {
      assigned: { label: 'Belum Dikerjakan', color: 'bg-gray-100 text-gray-600', icon: Clock },
      in_progress: { label: 'Sedang Dikerjakan', color: 'bg-amber-100 text-amber-700', icon: Clock },
      completed: { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      expired: { label: 'Kedaluwarsa', color: 'bg-red-100 text-red-600', icon: Clock },
    }
    const item = map[status] || map.assigned
    const Icon = item.icon
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${item.color}`}>
        <Icon size={12} /> {item.label}
      </span>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard Siswa" description="Daftar asesmen yang ditugaskan kepada Anda." />
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada asesmen" description="Belum ada asesmen yang ditugaskan kepada Anda saat ini." />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">{a.instrument?.title || 'Asesmen Kognitif'}</p>
                <p className="text-xs text-gray-500">{a.period?.name}</p>
                <div className="mt-1">{statusBadge(a.status)}</div>
              </div>
              {a.status !== 'completed' ? (
                <Link to={`/asesmen/${a.id}`} className="rounded-lg bg-primary-800 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-900">
                  Kerjakan
                </Link>
              ) : (
                <Link to="/asesmen/hasil" className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                  Lihat Hasil
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
