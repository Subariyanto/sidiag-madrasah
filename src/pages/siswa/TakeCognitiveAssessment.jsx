import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'

// Ambang kategori kesiapan kognitif sesuai spesifikasi asli.
// Kategori ini HANYA untuk domain kognitif, TIDAK memicu "Perlu Rujukan
// Profesional" secara otomatis (itu domain non-kognitif/Guru BK saja).
function getKategoriKognitif(skor) {
  if (skor >= 86) return 'Sangat Siap'
  if (skor >= 71) return 'Siap'
  if (skor >= 56) return 'Memerlukan Penguatan'
  return 'Memerlukan Pendampingan'
}

export default function TakeCognitiveAssessment() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true)
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assessment_assignments')
        .select('*, student:students(id, madrasah_id)')
        .eq('id', assignmentId)
        .eq('assignment_type', 'cognitive')
        .single()

      if (assignmentError || !assignmentData) {
        toast.error('Asesmen kognitif tidak ditemukan')
        navigate('/dashboard')
        return
      }
      setAssignment(assignmentData)

      const madrasahId = assignmentData.student?.madrasah_id
      const { data: questionsData } = await supabase
        .from('cognitive_questions')
        .select('*')
        .eq('question_type', 'multiple_choice')
        .eq('is_active', true)
        .or(`madrasah_id.eq.${madrasahId},madrasah_id.is.null`)
        .order('created_at')
      setQuestions(questionsData || [])

      const { data: existingResponses } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assignment_id', assignmentId)
      const answerMap = {}
      ;(existingResponses || []).forEach((r) => {
        if (r.cognitive_question_id) answerMap[r.cognitive_question_id] = r.answer_text
      })
      setAnswers(answerMap)

      if (assignmentData.status === 'assigned') {
        await supabase.from('assessment_assignments').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', assignmentId)
      }
      setLoading(false)
    }
    fetchAssignment()
  }, [assignmentId, navigate])

  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0

  const handleAnswer = async (optionKey) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionKey }))
    const isCorrect = optionKey === currentQuestion.correct_answer
    try {
      await supabase.from('assessment_responses').upsert(
        {
          assignment_id: assignmentId,
          cognitive_question_id: currentQuestion.id,
          answer_text: optionKey,
          is_correct: isCorrect,
          answered_at: new Date().toISOString(),
        },
        { onConflict: 'assignment_id,cognitive_question_id' }
      )
    } catch (err) {
      toast.error('Gagal menyimpan jawaban: ' + err.message)
    }
  }

  const goNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1)
  }
  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => answers[q.id] === undefined)
    if (unanswered.length > 0) {
      toast.error(`Masih ada ${unanswered.length} soal yang belum dijawab`)
      return
    }
    setSubmitting(true)
    try {
      const correctCount = questions.filter((q) => answers[q.id] === q.correct_answer).length
      const skorKognitif = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
      const kategoriKognitif = getKategoriKognitif(skorKognitif)

      const { error: resultError } = await supabase.from('assessment_results').insert({
        assignment_id: assignmentId,
        student_id: assignment.student_id,
        result_summary: { skor_kognitif: skorKognitif, kategori_kognitif: kategoriKognitif },
        category: 'kecenderungan_kognitif_teridentifikasi',
        needs_professional_review: false,
      })
      if (resultError) throw resultError

      await supabase.from('assessment_assignments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', assignmentId)

      toast.success('Asesmen kognitif berhasil diselesaikan')
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

  if (questions.length === 0) {
    return <div className="py-16 text-center text-sm text-gray-400">Belum ada soal kognitif pilihan ganda yang tersedia.</div>
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4">
        <p className="text-sm font-semibold text-primary-900">Asesmen Kognitif{currentQuestion?.subject ? ` - ${currentQuestion.subject}` : ''}</p>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-accent-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Soal {currentIndex + 1} dari {questions.length}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="mb-5 text-base font-medium text-gray-800">{currentQuestion?.question_text}</p>
        <div className="space-y-2">
          {(currentQuestion?.options || []).map((opt) => {
            const isSelected = answers[currentQuestion?.id] === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => handleAnswer(opt.key)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                  isSelected ? 'border-primary-700 bg-primary-50 font-semibold text-primary-800' : 'border-gray-200 text-gray-600 hover:border-secondary-300'
                }`}
              >
                <span>
                  <span className="mr-2 font-semibold">{opt.key}.</span>
                  {opt.text}
                </span>
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
        {currentIndex === questions.length - 1 ? (
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
