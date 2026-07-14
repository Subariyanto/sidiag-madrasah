import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, Download, AlertTriangle, ArrowUpDown } from 'lucide-react'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

const KOGNITIF_LABELS = {
  'Sangat Siap': 'bg-green-100 text-green-700',
  Siap: 'bg-blue-100 text-blue-700',
  'Memerlukan Penguatan': 'bg-amber-100 text-amber-700',
  'Memerlukan Pendampingan': 'bg-red-100 text-red-600',
}

export default function ClassMapping() {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [sortMode, setSortMode] = useState('none') // none | desc | asc
  const { profile } = useAuth()
  const madrasahId = profile?.madrasah_id

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('classes').select('id, name').eq('is_active', true).eq('madrasah_id', madrasahId).order('name')
      if (error) toast.error('Gagal memuat kelas: ' + error.message)
      else {
        setClasses(data || [])
        if (data && data.length > 0) setSelectedClass(data[0].id)
      }
    }
    if (madrasahId) fetchClasses()
  }, [madrasahId])

  useEffect(() => {
    if (selectedClass) fetchMapping(selectedClass)
    else setRows([])
  }, [selectedClass])

  const fetchMapping = async (classId) => {
    setLoading(true)
    try {
      const { data: students, error: studentErr } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('full_name')
      if (studentErr) throw studentErr

      const studentIds = (students || []).map((s) => s.id)
      if (studentIds.length === 0) {
        setRows([])
        setLoading(false)
        return
      }

      const [resultsRes, followUpsRes] = await Promise.all([
        supabase
          .from('assessment_results')
          .select('student_id, result_summary, needs_professional_review, created_at, assignment:assessment_assignments(assignment_type)')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false }),
        supabase.from('follow_ups').select('student_id, status').in('student_id', studentIds).not('status', 'in', '(done,cancelled)'),
      ])
      if (resultsRes.error) throw resultsRes.error
      if (followUpsRes.error) throw followUpsRes.error

      const results = resultsRes.data || []
      const followUps = followUpsRes.data || []

      const mapped = (students || []).map((s) => {
        const studentResults = results.filter((r) => r.student_id === s.id)
        const latestCognitive = studentResults.find((r) => r.assignment?.assignment_type === 'cognitive')
        const latestNonCognitive = studentResults.find((r) => r.assignment?.assignment_type === 'instrument')
        const needsReview = studentResults.some((r) => r.needs_professional_review)
        const activeFollowUps = followUps.filter((f) => f.student_id === s.id).length

        let topDimension = null
        if (latestNonCognitive?.result_summary) {
          const entries = Object.entries(latestNonCognitive.result_summary)
          if (entries.length > 0) {
            entries.sort((a, b) => b[1] - a[1])
            topDimension = entries[0]
          }
        }

        return {
          student_id: s.id,
          full_name: s.full_name,
          skor_kognitif: latestCognitive?.result_summary?.skor_kognitif ?? null,
          kategori_kognitif: latestCognitive?.result_summary?.kategori_kognitif ?? null,
          topDimension,
          needsReview,
          activeFollowUps,
        }
      })
      setRows(mapped)
    } catch (err) {
      toast.error(err.message || 'Gagal memuat pemetaan kelas')
    } finally {
      setLoading(false)
    }
  }

  const sortedRows = useMemo(() => {
    if (sortMode === 'none') return rows
    const withScore = rows.filter((r) => r.skor_kognitif !== null)
    const withoutScore = rows.filter((r) => r.skor_kognitif === null)
    withScore.sort((a, b) => (sortMode === 'desc' ? b.skor_kognitif - a.skor_kognitif : a.skor_kognitif - b.skor_kognitif))
    return [...withScore, ...withoutScore]
  }, [rows, sortMode])

  const toggleSort = () => {
    setSortMode((m) => (m === 'none' ? 'desc' : m === 'desc' ? 'asc' : 'none'))
  }

  const handleExportCSV = () => {
    const csv = Papa.unparse(
      sortedRows.map((r) => ({
        nama: r.full_name,
        skor_kognitif: r.skor_kognitif ?? '',
        kategori_kognitif: r.kategori_kognitif ?? '',
        kecenderungan_tertinggi: r.topDimension ? `${r.topDimension[0]} (${r.topDimension[1]}%)` : '',
        perlu_tinjauan_bk: r.needsReview ? 'Ya' : 'Tidak',
        tindak_lanjut_aktif: r.activeFollowUps,
      }))
    )
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const className = classes.find((c) => c.id === selectedClass)?.name || 'kelas'
    link.download = `pemetaan-${className}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Pemetaan Kelas"
        description="Ringkasan kesiapan belajar siswa per kelas. Kategori bersifat kecenderungan saat ini, bukan label permanen."
        action={
          <button onClick={handleExportCSV} disabled={sortedRows.length === 0} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <Download size={16} /> Ekspor CSV
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Kelas:</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none">
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button onClick={toggleSort} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
          <ArrowUpDown size={14} />
          Urutkan skor kognitif: {sortMode === 'none' ? 'Default' : sortMode === 'desc' ? 'Tertinggi' : 'Terendah'}
        </button>
      </div>

      {classes.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="Belum ada kelas" description="Tambahkan kelas terlebih dahulu di menu Kelas & Rombel." />
      ) : loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : sortedRows.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="Belum ada siswa di kelas ini" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Hasil Kognitif</th>
                <th className="px-4 py-3">Kecenderungan Non-Kognitif</th>
                <th className="px-4 py-3">Tinjauan BK</th>
                <th className="px-4 py-3">Tindak Lanjut Aktif</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={r.student_id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.full_name}</td>
                  <td className="px-4 py-3">
                    {r.skor_kognitif !== null ? (
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${KOGNITIF_LABELS[r.kategori_kognitif] || 'bg-gray-100 text-gray-600'}`}>
                        {r.skor_kognitif} &middot; {r.kategori_kognitif}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Belum ada hasil</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.topDimension ? (
                      <span className="rounded-full bg-secondary-100 px-2 py-1 text-xs font-medium text-primary-800">
                        Kecenderungan tertinggi saat ini: {r.topDimension[0]} ({r.topDimension[1]}%)
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Belum ada hasil</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.needsReview ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-600">
                        <AlertTriangle size={12} /> Perlu ditinjau
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.activeFollowUps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
