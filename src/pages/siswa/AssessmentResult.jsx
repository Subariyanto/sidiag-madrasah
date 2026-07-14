import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, AlertTriangle, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import { generateResultPDF } from '../../lib/pdfReport'

const DISCLAIMER =
  'Hasil asesmen dalam aplikasi SiDIAG Madrasah merupakan informasi awal untuk membantu guru memahami kebutuhan belajar siswa. Hasil tidak boleh digunakan sebagai diagnosis medis, psikologis, atau sebagai label kemampuan permanen. Keputusan tindak lanjut harus mempertimbangkan observasi guru, komunikasi dengan orang tua, hasil belajar, dan apabila diperlukan konsultasi dengan tenaga profesional.'

export default function AssessmentResult() {
  const { studentId: studentIdParam } = useParams()
  const { user, profile, role } = useAuth()
  const [student, setStudent] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      let studentId = studentIdParam

      if (!studentId && role === 'siswa') {
        const { data } = await supabase.from('students').select('id').eq('profile_id', user.id).single()
        studentId = data?.id
      }

      if (!studentId) {
        setLoading(false)
        return
      }

      const { data: studentData } = await supabase
        .from('students')
        .select('*, class:classes(name), madrasa:madrasas(name, address, head_master_name)')
        .eq('id', studentId)
        .single()
      setStudent(studentData)

      const { data: resultsData, error } = await supabase
        .from('assessment_results')
        .select('*, assignment:assessment_assignments(instrument:instruments(title))')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (error) toast.error('Gagal memuat hasil asesmen: ' + error.message)
      else setResults(resultsData || [])
      setLoading(false)
    }
    fetchData()
  }, [studentIdParam, user, role])

  const handleDownloadPDF = async (result) => {
    setGenerating(true)
    try {
      await generateResultPDF({ student, result, disclaimer: DISCLAIMER })
      toast.success('Laporan PDF berhasil dibuat')
    } catch (err) {
      toast.error('Gagal membuat PDF: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div className="py-16 text-center text-sm text-gray-400">Memuat hasil...</div>

  if (!student) {
    return <EmptyState title="Data siswa tidak ditemukan" description="Pastikan Anda memiliki akses ke data siswa ini." />
  }

  return (
    <div>
      <PageHeader title={`Hasil Asesmen - ${student.full_name}`} description={student.class?.name || ''} />

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info size={18} className="mt-0.5 flex-shrink-0" />
        <p>{DISCLAIMER}</p>
      </div>

      {results.length === 0 ? (
        <EmptyState title="Belum ada hasil asesmen" description="Siswa belum menyelesaikan asesmen apapun." />
      ) : (
        <div className="space-y-6">
          {results.map((result) => {
            const chartData = Object.entries(result.result_summary || {}).map(([name, value]) => ({ name, value }))
            return (
              <div key={result.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{result.assignment?.instrument?.title || 'Instrumen'}</p>
                    <p className="text-xs text-gray-400">{new Date(result.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadPDF(result)}
                    disabled={generating}
                    className="flex items-center gap-2 rounded-lg bg-primary-800 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-900 disabled:opacity-60"
                  >
                    <Download size={14} /> Unduh PDF
                  </button>
                </div>

                {result.needs_professional_review && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <p>
                      Peringatan: hasil ini menunjukkan indikasi yang perlu ditinjau oleh Guru BK. Kategori ini bukan keputusan otomatis sistem
                      dan harus dikonfirmasi melalui observasi lebih lanjut.
                    </p>
                  </div>
                )}

                {chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis unit="%" domain={[0, 100]} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  * Nilai di atas menunjukkan kecenderungan/preferensi saat ini dalam persentase, bukan label kemampuan permanen.
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
