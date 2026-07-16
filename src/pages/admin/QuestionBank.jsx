import { useEffect, useState } from 'react'
import { FileQuestion, Plus, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { store } from '../../lib/store'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'
import QuestionForm from '../../components/QuestionForm'

const emptyForm = {
  subject: '', question_type: 'multiple_choice', question_text: '', difficulty: 'sedang',
  correct_answer: 'A',
  options: [
    { key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' },
  ],
}

export default function QuestionBank() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { user, profile } = useAuth()
  const madrasahId = profile?.madrasah_id

  const fetchData = () => {
    setLoading(true)
    let data = store.query('cognitive_questions', { is_active: true })
    // Show global (madrasah_id=null) + own madrasah questions
    data = data.filter((q) => !q.madrasah_id || q.madrasah_id === madrasahId)
    data.sort((a, b) => (a.subject || '').localeCompare(b.subject || ''))
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [madrasahId])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({
      subject: item.subject || '', question_type: item.question_type || 'multiple_choice',
      question_text: item.question_text || '', difficulty: item.difficulty || 'sedang',
      correct_answer: item.correct_answer || 'A',
      options: item.options?.length ? item.options : emptyForm.options,
    })
    setShowForm(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.question_text) return toast.error('Teks soal wajib diisi')
    setSaving(true)
    try {
      const payload = { ...form, madrasah_id: madrasahId }
      if (editing) {
        store.update('cognitive_questions', editing.id, payload)
        logActivity({ userId: user?.id, action: 'update', entity: 'cognitive_questions', entityId: editing.id, description: `Memperbarui soal ${form.subject}` })
        toast.success('Soal diperbarui')
      } else {
        const data = store.insert('cognitive_questions', { ...payload, is_active: true })
        logActivity({ userId: user?.id, action: 'create', entity: 'cognitive_questions', entityId: data.id, description: `Menambahkan soal ${form.subject}` })
        toast.success('Soal baru ditambahkan')
      }
      setShowForm(false); fetchData()
    } catch (err) { toast.error(err.message || 'Gagal menyimpan') } finally { setSaving(false) }
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    store.update('cognitive_questions', confirmDelete.id, { is_active: false })
    toast.success('Soal dinonaktifkan'); setConfirmDelete(null); fetchData()
  }

  const updateOption = (idx, value) => {
    setForm((f) => {
      const options = [...f.options]
      options[idx] = { ...options[idx], text: value }
      return { ...f, options }
    })
  }

  const filtered = items.filter((i) => i.subject?.toLowerCase().includes(search.toLowerCase()) || i.question_text?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader title="Bank Soal Kognitif" description="Kelola soal pilihan ganda untuk asesmen kognitif." action={<button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900"><Plus size={16} /> Tambah Soal</button>} />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"><Search size={16} className="text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari soal..." className="w-full text-sm outline-none" /></div>
      {loading ? <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div> : filtered.length === 0 ? <EmptyState icon={FileQuestion} title="Belum ada soal" /> : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-primary-800">{item.subject}</span>
                    <span className="text-xs text-gray-400 capitalize">{item.difficulty}</span>
                  </div>
                  <p className="text-sm text-gray-800">{idx + 1}. {item.question_text}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-500">
                    {(item.options || []).map((opt) => (
                      <div key={opt.key} className={opt.key === item.correct_answer ? 'font-semibold text-green-700' : ''}>
                        {opt.key}. {opt.text} {opt.key === item.correct_answer && '✓'}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => openEdit(item)} className="text-primary-700 hover:text-primary-900"><Pencil size={16} /></button>
                  <button onClick={() => setConfirmDelete(item)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && <QuestionForm form={form} setForm={setForm} updateOption={updateOption} editing={editing} saving={saving} onSubmit={handleSave} onCancel={() => setShowForm(false)} />}
      <ConfirmDialog open={Boolean(confirmDelete)} title="Nonaktifkan soal ini?" description="Soal akan dinonaktifkan." onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
