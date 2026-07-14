import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'

const LIKERT_LABELS = ['Sangat Tidak Sesuai', 'Tidak Sesuai', 'Sesuai', 'Sangat Sesuai']

export default function TakeAssessment() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [items, setItems] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true)
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assessment_assignments')
        .select('*, instrument:instruments(id, title, scale_min, scale_max)')
        .eq('id', assignmentId)
        .single()

      if (assignmentError || !assignmentData) {
        toast.error('Asesmen tidak ditemukan')
        navigate('/dashboard')
        return
      }
      setAssignment(assignmentData)

      const { data: itemsData } = await supabase
        .from('instrument_items')
        .select('*')
        .eq('instrument_id', assignmentData.instrument_id)
        .eq('is_active', true)
        .order('order_index')
      setItems(itemsData || [])

      const { data: existingResponses } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assignment_id', assignmentId)
      const answerMap = {}
      ;(existingResponses || []).forEach((r) => {
        if (r.instrument_item_id) answerMap[r.instrument_item_id] = r.answer_value
      })
      setAnswers(answerMap)

      if (assignmentData.status === 'assigned') {
        await supabase.from('assessment_assignments').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', assignmentId)
      }
      setLoading(false)
    }
    fetchAssignment()
  }, [assignmentId, navigate])

  const currentItem = items[currentIndex]
  const progress = items.length > 0 ? Math.round(((currentIndex + 1) / items.length) * 100) : 0

  const handleAnswer = async (value) => {
    if (!currentItem) return
    setAnswers((prev) => ({ ...prev, [currentItem.id]: value }))
    try {
      await supabase.from('assessment_responses').upsert(
        {
          assignment_id: assignmentId,
          instrument_item_id: currentItem.id,
          answer_value: value,
          answered_at: new Date().toISOString(),
        },
        { onConflict: 'assignment_id,instrument_item_id' }
      )
    } catch (err) {
      toast.error('Gagal menyimpan jawaban: ' + err.message)
    }
  }

  const goNext = () => {
    if (currentIndex < items.length - 1) setCurrentIndex((i) => i + 1)
  }
  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  const handleSubmit = async () => {
    const unanswered = items.filter((it) => answers[it.id] === undefined)
    if (unanswered.length > 0) {
      toast.error(`Masih ada ${unanswered.length} pernyataan yang belum dijawab`)
      return
    }
    setSubmitting(true)
    try {
      // Hitung agregasi skor per dimensi (persentase), murni untuk KECENDERUNGAN, bukan label permanen
      const dimensionTotals = {}
      const dimensionCounts = {}
      items.forEach((it) => {
        const dim = it.dimension || 'umum'
        const val = answers[it.id] || 0
        dimensionTotals[dim] = (dimensionTotals[dim] || 0) + val
        dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1
      })
      const maxScale = assignment?.instrument?.scale_max || 4
      const resultSummary = {}
      Object.keys(dimensionTotals).forEach((dim) => {
        const maxPossible = dimensionCounts[dim] * maxScale
        resultSummary[dim] = maxPossible > 0 ? Math.round((dimensionTotals[dim] / maxPossible) * 100) : 0
      })

      const { error: resultError } = await supabase.from('assessment_results').insert({
        assignment_id: assignmentId,
        student_id: assignment.student_id,
        result_summary: resultSummary,
        category: 'kecenderungan_teridentifikasi',
        needs_professional_review: false,
      })
      if (resultError) throw resultError

      await supabase.from('assessment_assignments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', assignmentId)

      toast.success('Asesmen berhasil diselesaikan')
      navigate('/asesmen/hasil')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan hasil asesmen')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-400">Memuat asesmen...</div>
  }

  if (items.length === 0) {
    return <div className="py-16 text-center text-sm text-gray-400">Instrumen ini belum memiliki item pernyataan.</div>
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4">
        <p className="text-sm font-semibold text-primary-900">{assignment?.instrument?.title}</p>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-accent-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Pernyataan {currentIndex + 1} dari {items.length}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="mb-5 text-center text-base font-medium text-gray-800">{currentItem?.statement}</p>
        <div className="space-y-2">
          {LIKERT_LABELS.map((label, idx) => {
            const value = idx + 1
            const isSelected = answers[currentItem?.id] === value
            return (
              <button
                key={value}
                onClick={() => handleAnswer(value)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition ${
                  isSelected ? 'border-primary-700 bg-primary-50 font-semibold text-primary-800' : 'border-gray-200 text-gray-600 hover:border-secondary-300'
                }`}
              >
                {label}
                {isSelected && <CheckCircle2 size={16} />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>
        {currentIndex === items.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-60"
          >
            {submitting ? 'Menyimpan...' : 'Selesai & Kirim'}
          </button>
        ) : (
          <button onClick={goNext} className="flex items-center gap-1 rounded-lg bg-primary-800 px-3 py-2 text-sm font-medium text-white hover:bg-primary-900">
            Selanjutnya <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
