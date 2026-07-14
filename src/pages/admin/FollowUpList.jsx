import { useEffect, useState } from 'react'
import { ListChecks, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const FOLLOW_UP_TYPES = [
  'Pengayaan',
  'Remedial',
  'Konseling',
  'Pendampingan Wali Kelas',
  'Komunikasi Orang Tua',
  'Tutor Sebaya',
  'Program Pembiasaan',
  'Rujukan Profesional',
]

const STATUS_LABELS = {
  planned: { label: 'Direncanakan', color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'Berjalan', color: 'bg-amber-100 text-amber-700' },
  done: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-600' },
}

const emptyForm = {
  student_id: '',
  follow_up_type: FOLLOW_UP_TYPES[0],
  action_plan: '',
  person_in_charge: '',
  due_date: '',
  status: 'planned',
  progress_notes: '',
  evaluation: '',
  involves_professional_referral: false,
}

export default function FollowUpList() {
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStudent, setFilterStudent] = useState('')
  const { user, profile } = useAuth()
  const madrasahId = profile?.madrasah_id

  const fetchData = async () => {
    setLoading(true)
    const [studentRes, followUpRes] = await Promise.all([
      supabase.from('students').select('id, full_name, class:classes(name)').eq('status', 'active').eq('madrasah_id', madrasahId).order('full_name'),
      supabase
        .from('follow_ups')
        .select('*, student:students(full_name, madrasah_id, class:classes(name))')
        .order('created_at', { ascending: false }),
    ])
    if (!studentRes.error) setStudents(studentRes.data || [])
    if (followUpRes.error) toast.error('Gagal memuat tindak lanjut: ' + followUpRes.error.message)
    else setItems((followUpRes.data || []).filter((f) => f.student?.madrasah_id === madrasahId))
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
      student_id: item.student_id || '',
      follow_up_type: item.follow_up_type || FOLLOW_UP_TYPES[0],
      action_plan: item.action_plan || '',
      person_in_charge: item.person_in_charge || '',
      due_date: item.due_date || '',
      status: item.status || 'planned',
      progress_notes: item.progress_notes || '',
      evaluation: item.evaluation || '',
      involves_professional_referral: item.follow_up_type === 'Rujukan Profesional' || item.involves_professional_referral || false,
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.student_id) {
      toast.error('Pilih siswa terlebih dahulu')
      return
    }
    if (!form.action_plan) {
      toast.error('Rencana tindakan wajib diisi')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        due_date: form.due_date || null,
        involves_professional_referral: form.follow_up_type === 'Rujukan Profesional',
      }
      if (editing) {
        const { error } = await supabase.from('follow_ups').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ userId: user?.id, action: 'update', entity: 'follow_ups', entityId: editing.id, description: 'Memperbarui rencana tindak lanjut' })
        toast.success('Tindak lanjut diperbarui')
      } else {
        const { data, error } = await supabase.from('follow_ups').insert({ ...payload, created_by: user?.id }).select().single()
        if (error) throw error
        await logActivity({ userId: user?.id, action: 'create', entity: 'follow_ups', entityId: data.id, description: 'Membuat rencana tindak lanjut' })
        toast.success('Tindak lanjut baru dibuat')
      }
      setShowForm(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan tindak lanjut')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      const { error } = await supabase.from('follow_ups').delete().eq('id', confirmDelete.id)
      if (error) throw error
      await logActivity({ userId: user?.id, action: 'delete', entity: 'follow_ups', entityId: confirmDelete.id, description: 'Menghapus rencana tindak lanjut' })
      toast.success('Tindak lanjut dihapus')
      setConfirmDelete(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus tindak lanjut')
    }
  }

  const filtered = items.filter((i) => (!filterStatus || i.status === filterStatus) && (!filterStudent || i.student_id === filterStudent))

  return (
    <div>
      <PageHeader
        title="Tindak Lanjut"
        description="Rencana tindak lanjut atas hasil asesmen dan observasi. Keputusan tetap dibuat oleh guru/Guru BK, bukan otomatis sistem."
        action={
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">
            <Plus size={16} /> Tambah Tindak Lanjut
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none">
            <option value="">Semua</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Siswa:</label>
          <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none">
            <option value="">Semua Siswa</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="Belum ada tindak lanjut" description="Buat rencana tindak lanjut untuk siswa." />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.student?.full_name} <span className="text-xs text-gray-400">({item.student?.class?.name || '-'})</span></p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-secondary-100 px-2 py-1 text-xs font-medium text-primary-800">{item.follow_up_type}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_LABELS[item.status]?.color}`}>{STATUS_LABELS[item.status]?.label}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-primary-700 hover:text-primary-900">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setConfirmDelete(item)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {item.follow_up_type === 'Rujukan Profesional' && (
                <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <p>Rujukan Profesional harus melalui diskusi dengan Guru BK/pihak berwenang. Sistem hanya mencatat rencana, bukan memutuskan otomatis.</p>
                </div>
              )}

              <p className="text-xs text-gray-600"><span className="font-semibold">Rencana: </span>{item.action_plan}</p>
              {item.person_in_charge && <p className="text-xs text-gray-500"><span className="font-semibold">PIC: </span>{item.person_in_charge}</p>}
              {item.due_date && <p className="text-xs text-gray-500"><span className="font-semibold">Target: </span>{new Date(item.due_date).toLocaleDateString('id-ID')}</p>}
              {item.progress_notes && <p className="mt-1 text-xs text-gray-500"><span className="font-semibold">Progres: </span>{item.progress_notes}</p>}
              {item.evaluation && <p className="mt-1 text-xs text-gray-500"><span className="font-semibold">Evaluasi: </span>{item.evaluation}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <FollowUpForm
          form={form}
          setForm={setForm}
          students={students}
          editing={editing}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Hapus tindak lanjut ini?"
        description="Data rencana tindak lanjut akan dihapus permanen."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
