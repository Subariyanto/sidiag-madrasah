import { useEffect, useState } from 'react'
import { Users, GraduationCap, BookOpen, ClipboardList } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'

export default function DashboardAdminMadrasah() {
  const { profile } = useAuth()
  const madrasahId = profile?.madrasah_id
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0, periods: 0 })
  const [classChart, setClassChart] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!madrasahId) return
    const fetchStats = async () => {
      setLoading(true)
      const [teachersRes, studentsRes, classesRes, periodsRes, studentsPerClassRes] = await Promise.all([
        supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('madrasah_id', madrasahId).eq('is_active', true),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('madrasah_id', madrasahId).eq('status', 'active'),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('madrasah_id', madrasahId).eq('is_active', true),
        supabase.from('assessment_periods').select('id', { count: 'exact', head: true }).eq('madrasah_id', madrasahId).eq('status', 'active'),
        supabase.from('students').select('class_id, classes(name)').eq('madrasah_id', madrasahId).eq('status', 'active'),
      ])

      setStats({
        teachers: teachersRes.count || 0,
        students: studentsRes.count || 0,
        classes: classesRes.count || 0,
        periods: periodsRes.count || 0,
      })

      if (studentsPerClassRes.data) {
        const grouped = {}
        studentsPerClassRes.data.forEach((row) => {
          const name = row.classes?.name || 'Belum Ada Kelas'
          grouped[name] = (grouped[name] || 0) + 1
        })
        setClassChart(Object.entries(grouped).map(([name, jumlah]) => ({ name, jumlah })))
      }
      setLoading(false)
    }
    fetchStats()
  }, [madrasahId])

  return (
    <div>
      <PageHeader title="Dashboard Admin Madrasah" description="Ringkasan data madrasah Anda." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Guru" value={loading ? '...' : stats.teachers} color="primary" />
        <StatCard icon={GraduationCap} label="Total Siswa" value={loading ? '...' : stats.students} color="secondary" />
        <StatCard icon={BookOpen} label="Total Kelas" value={loading ? '...' : stats.classes} color="accent" />
        <StatCard icon={ClipboardList} label="Periode Asesmen Aktif" value={loading ? '...' : stats.periods} color="gray" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-gray-700">Jumlah Siswa per Kelas</p>
        {classChart.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Belum ada data siswa</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={classChart}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="jumlah" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
