import { useEffect, useState } from 'react'
import { School, Users, GraduationCap, KeyRound } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { store } from '../../lib/store'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'

const COLORS = ['#1e3a8a', '#60a5fa', '#f97316', '#93c5fd', '#fb923c']

export default function DashboardSuperAdmin() {
  const [stats, setStats] = useState({ madrasas: 0, teachers: 0, students: 0, codes: 0 })
  const [statusChart, setStatusChart] = useState([])
  const [madrasahChart, setMadrasahChart] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = () => {
      setLoading(true)
      const madrasas = store.getAll('madrasas')
      const teachers = store.query('teachers', { is_active: true })
      const students = store.query('students', { status: 'active' })
      const codes = store.getAll('activation_codes')

      setStats({
        madrasas: madrasas.length,
        teachers: teachers.length,
        students: students.length,
        codes: codes.filter((c) => !c.used).length,
      })

      // Status pie
      const statusGrouped = {}
      madrasas.forEach((m) => {
        const s = m.status || 'active'
        statusGrouped[s] = (statusGrouped[s] || 0) + 1
      })
      setStatusChart(Object.entries(statusGrouped).map(([name, value]) => ({ name, value })))

      // Students per madrasah
      const perMadrasah = {}
      students.forEach((s) => {
        const m = madrasas.find((mr) => mr.id === s.madrasah_id)
        const name = m?.name || 'Tanpa Madrasah'
        perMadrasah[name] = (perMadrasah[name] || 0) + 1
      })
      setMadrasahChart(
        Object.entries(perMadrasah)
          .map(([name, jumlah]) => ({ name, jumlah }))
          .slice(0, 8)
      )
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div>
      <PageHeader title="Dashboard Admin" description="Ringkasan data seluruh madrasah dalam sistem." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={School} label="Total Madrasah" value={loading ? '...' : stats.madrasas} color="primary" />
        <StatCard icon={Users} label="Total Guru" value={loading ? '...' : stats.teachers} color="secondary" />
        <StatCard icon={GraduationCap} label="Total Siswa" value={loading ? '...' : stats.students} color="accent" />
        <StatCard icon={KeyRound} label="Kode Tersedia" value={loading ? '...' : stats.codes} color="gray" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-gray-700">Status Madrasah</p>
          {statusChart.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusChart.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-gray-700">Jumlah Siswa per Madrasah (Top 8)</p>
          {madrasahChart.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={madrasahChart}>
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
