import { useEffect, useState } from 'react'
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const DIFFICULTY_LABELS = { mudah: 'Mudah', sedang: 'Sedang', sulit: 'Sulit' }

const emptyForm = {
  subject: '',
  question_text: '',
  question_type: 'multiple_choice',
  options: [
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' },
  ],
  correct_answer: 'A',
  difficulty: 'sedang',
}

export default function QuestionBank() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { user, profile } = useAuth()
  const madrasahId = profile?.madrasah_id

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cognitive_questions')
      .select('*')
      .or(`madrasah_id.eq.${madrasahId},madrasah_id.is.null`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) toast.error('Gagal memuat bank soal: ' + error.message)
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (madrasahId) fetchData()
  }, [madrasahId])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      subject: item.subject || '',
      question_text: item.question_text || '',
      question_type: item.question_type || 'multiple_choice',
      options: item.options || emptyForm.options,
      correct_answer: item.correct_answer || 'A',
      difficulty: item.difficulty || 'sedang',
    })
    setShowForm(true)
  }

  const updateOption = (idx, text) => {
    setForm((f) => {
      const options = [...f.options]
      options[idx] = { ...options[idx], text }
      return { ...f, options }
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.question_text) {
      toast.error('Teks soal wajib diisi')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, user_id: user?.id }
      delete payload.user_id
      if (editing) {
        const { error } = await supabase.from('cognitive_questions').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Soal diperbarui')
      } else {
        const { error } = await supabase.from('cognitive_questions').insert({ ...payload, madrasah_id: madrasahId, created_by: user?.id })
        if (error) throw error
        toast.success('Soal baru ditambahkan')
      }
      setShowForm(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      const { error } = await supabase.from('cognitive_questions').update({ is_active: false }).eq('id', confirmDelete.id)
      if (error) throw error
      toast.success('Soal dinonaktifkan')
      setConfirmDelete(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data')
    }
  }

  return (
    <div>
      <PageHeader
        title="Bank Soal Kognitif"
        description="Kelola soal kognitif untuk asesmen diagnostik kemampuan."
        action={
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">
            <Plus size={16} /> Tambah Soal
          </button>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="Belum ada soal" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-secondary-100 px-2 py-1 text-xs font-medium text-primary-800">{item.subject || 'Umum'}</span>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{DIFFICULTY_LABELS[item.difficulty]}</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{item.question_text}</p>
              {item.question_type === 'multiple_choice' && (
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  {(item.options || []).map((opt) => (
                    <li key={opt.key} className={opt.key === item.correct_answer ? 'font-semibold text-green-600' : ''}>
                      {opt.key}. {opt.text}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex gap-2">
                <button onClick={() => openEdit(item)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-primary-700 hover:bg-gray-50">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setConfirmDelete(item)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-gray-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <QuestionForm
          form={form}
          setForm={setForm}
          updateOption={updateOption}
          editing={editing}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Nonaktifkan soal ini?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
