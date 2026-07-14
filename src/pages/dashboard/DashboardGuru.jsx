import { useEffect, useState } from 'react'
import { GraduationCap, ClipboardList, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'

export default function DashboardGuru() {
  const { profile } = useAuth()
  const madrasahId = profile?.madrasah_id
  const [stats, setStats] = useState({ students: 0, activePeriods: 0, needsReview: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!madrasahId) return
    const fetchStats = async () => {
      setLoading(true)
      const [studentsRes, periodsRes, reviewRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('madrasah_id', madrasahId).eq('status', 'active'),
        supabase.from('assessment_periods').select('id', { count: 'exact', head: true }).eq('madrasah_id', madrasahId).eq('status', 'active'),
        supabase
          .from('assessment_results')
          .select('id, students!inner(madrasah_id)', { count: 'exact', head: true })
          .eq('needs_professional_review', true)
          .eq('students.madrasah_id', madrasahId),
      ])
      setStats({
        students: studentsRes.count || 0,
        activePeriods: periodsRes.count || 0,
        needsReview: reviewRes.count || 0,
      })
      setLoading(false)
    }
    fetchStats()
  }, [madrasahId])

  return (
    <div>
      <PageHeader title="Dashboard Guru" description="Ringkasan aktivitas asesmen siswa." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={GraduationCap} label="Total Siswa" value={loading ? '...' : stats.students} color="primary" />
        <StatCard icon={ClipboardList} label="Periode Aktif" value={loading ? '...' : stats.activePeriods} color="secondary" />
        <StatCard icon={AlertTriangle} label="Perlu Ditinjau (Guru BK)" value={loading ? '...' : stats.needsReview} color="accent" />
      </div>
      {stats.needsReview > 0 && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Terdapat {stats.needsReview} hasil asesmen dengan peringatan "Perlu Rujukan Profesional". Silakan tinjau bersama Guru BK sebelum mengambil keputusan tindak lanjut.
        </div>
      )}
    </div>
  )
}
