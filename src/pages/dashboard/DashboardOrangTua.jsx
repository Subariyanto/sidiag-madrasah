import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

export default function DashboardOrangTua() {
  const { user } = useAuth()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('students')
        .select('id, full_name, class:classes(name)')
        .eq('parent_profile_id', user.id)
        .eq('status', 'active')
      setChildren(data || [])
      setLoading(false)
    }
    if (user?.id) fetchChildren()
  }, [user])

  return (
    <div>
      <PageHeader title="Dashboard Orang Tua" description="Pantau perkembangan anak Anda." />
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : children.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Belum ada data anak" description="Hubungi admin madrasah jika akun Anda belum terhubung dengan data anak." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {children.map((c) => (
            <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-800">{c.full_name}</p>
              <p className="text-xs text-gray-500">{c.class?.name || 'Belum ada kelas'}</p>
              <Link
                to={`/asesmen/hasil/${c.id}`}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary-800 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-900"
              >
                <FileText size={14} /> Lihat Hasil Asesmen
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
