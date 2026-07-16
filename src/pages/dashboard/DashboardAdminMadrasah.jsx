import { useEffect, useState } from 'react'
import { Users, GraduationCap, BookOpen, ClipboardList } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { store } from '../../lib/store'
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
    if (!madrasahId) { setLoading(false); return }
    setLoading(true)
    const teachers = store.query('teachers', { is_active: true, madrasah_id: madrasahId })
    const students = store.query('students', { status: 'active', madrasah_id: madrasahId })
    const classes = store.query('classes', { is_active: true, madrasah_id: madrasahId })
    const periods = store.query('assessment_periods', { is_active: true, madrasah_id: madrasahId })

    setStats({
      teachers: teachers.length,
      students: students.length,
      classes: classes.length,
      periods: periods.length,
    })

    const grouped = {}
    students.forEach((s) => {
      const cls = classes.find((c) => c.id === s.class_id)
      const name = cls?.name || 'Belum Ada Kelas'
      grouped[name] = (grouped[name] || 0) + 1
    })
    setClassChart(Object.entries(grouped).map(([name, jumlah]) => ({ name, jumlah })))
    setLoading(false)
  }, [madrasahId])

  return (
    <div>
      <PageHeader title="Dashboard Madrasah" description="Ringkasan data madrasah Anda." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Guru" value={loading ? '...' : stats.teachers} color="primary" />
        <StatCard icon={GraduationCap} label="Total Siswa" value={loading ? '...' : stats.students} color="secondary" />
        <StatCard icon={BookOpen} label="Total Kelas" value={loading ? '...' : stats.classes} color="accent" />
        <StatCard icon={ClipboardList} label="Periode Asesmen" value={loading ? '...' : stats.periods} color="gray" />
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
