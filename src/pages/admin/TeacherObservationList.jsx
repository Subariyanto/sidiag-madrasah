import { useEffect, useState } from 'react'
import { Eye, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const SCALE_FIELDS = [
  { key: 'participation_score', label: 'Partisipasi' },
  { key: 'concentration_score', label: 'Konsentrasi' },
  { key: 'persistence_score', label: 'Kegigihan' },
  { key: 'collaboration_score', label: 'Kolaborasi' },
  { key: 'communication_score', label: 'Komunikasi' },
  { key: 'independence_score', label: 'Kemandirian' },
  { key: 'emotional_score', label: 'Sosial-Emosional' },
]

const emptyForm = {
  student_id: '',
  observation_date: new Date().toISOString().slice(0, 10),
  participation_score: 3,
  concentration_score: 3,
  persistence_score: 3,
  collaboration_score: 3,
  communication_score: 3,
  independence_score: 3,
  emotional_score: 3,
  strengths: '',
  needs: '',
  notes: '',
}

export default function TeacherObservationList() {
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filterStudent, setFilterStudent] = useState('')
  const { user, profile } = useAuth()
  const madrasahId = profile?.madrasah_id

  const fetchData = async () => {
    setLoading(true)
    const { data: teacherRow } = await supabase.from('teachers').select('id').eq('profile_id', user?.id).maybeSingle()

    const [studentRes, obsRes] = await Promise.all([
      supabase.from('students').select('id, full_name, class:classes(name)').eq('status', 'active').eq('madrasah_id', madrasahId).order('full_name'),
      supabase
        .from('teacher_observations')
        .select('*, student:students(full_name, madrasah_id, class:classes(name)), teacher:teachers(full_name)')
        .order('observation_date', { ascending: false }),
    ])
    if (!studentRes.error) setStudents(studentRes.data || [])
    if (obsRes.error) toast.error('Gagal memuat observasi: ' + obsRes.error.message)
    else setItems((obsRes.data || []).filter((o) => o.student?.madrasah_id === madrasahId))
    setLoading(false)
    return teacherRow?.id
  }

  useEffect(() => {
    if (madrasahId) fetchData()
  }, [madrasahId])

  const openCreate = () => {
    setForm(emptyForm)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.student_id) {
      toast.error('Pilih siswa terlebih dahulu')
      return
    }
    setSaving(true)
    try {
      const { data: teacherRow, error: teacherErr } = await supabase.from('teachers').select('id').eq('profile_id', user?.id).maybeSingle()
      if (teacherErr) throw teacherErr
      if (!teacherRow?.id) {
        toast.error('Profil Anda belum terhubung ke data guru. Hubungi admin madrasah.')
        setSaving(false)
        return
      }
      const payload = { ...form, teacher_id: teacherRow.id }
      const { data, error } = await supabase.from('teacher_observations').insert(payload).select().single()
      if (error) throw error
      await logActivity({
        userId: user?.id,
        action: 'create',
        entity: 'teacher_observations',
        entityId: data.id,
        description: `Menambahkan observasi untuk siswa ${students.find((s) => s.id === form.student_id)?.full_name || ''}`,
      })
      toast.success('Observasi berhasil disimpan')
      setShowForm(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan observasi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      const { error } = await supabase.from('teacher_observations').delete().eq('id', confirmDelete.id)
      if (error) throw error
      await logActivity({ userId: user?.id, action: 'delete', entity: 'teacher_observations', entityId: confirmDelete.id, description: 'Menghapus observasi guru' })
      toast.success('Observasi dihapus')
      setConfirmDelete(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus observasi')
    }
  }

  const filtered = filterStudent ? items.filter((i) => i.student_id === filterStudent) : items

  return (
    <div>
      <PageHeader
        title="Observasi Guru"
        description="Catatan observasi guru terhadap siswa, melengkapi hasil asesmen sebelum tindak lanjut."
        action={
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">
            <Plus size={16} /> Tambah Observasi
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <label className="text-xs font-medium text-gray-600">Filter siswa:</label>
        <select
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
        >
          <option value="">Semua Siswa</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Eye} title="Belum ada observasi" description="Tambahkan catatan observasi guru untuk siswa." />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.student?.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {item.student?.class?.name || '-'} &middot; {new Date(item.observation_date).toLocaleDateString('id-ID')} &middot; oleh {item.teacher?.full_name || '-'}
                  </p>
                </div>
                <button onClick={() => setConfirmDelete(item)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {SCALE_FIELDS.map((f) => (
                  <div key={f.key} className="rounded-lg bg-gray-50 px-2 py-1.5 text-center">
                    <p className="text-[10px] uppercase text-gray-400">{f.label}</p>
                    <p className="text-sm font-bold text-primary-800">{item[f.key] ?? '-'}</p>
                  </div>
                ))}
              </div>
              {item.strengths && <p className="text-xs text-gray-600"><span className="font-semibold">Kekuatan: </span>{item.strengths}</p>}
              {item.needs && <p className="text-xs text-gray-600"><span className="font-semibold">Kebutuhan: </span>{item.needs}</p>}
              {item.notes && <p className="mt-1 text-xs text-gray-500">{item.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ObservationForm
          form={form}
          setForm={setForm}
          students={students}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Hapus observasi ini?"
        description="Data observasi akan dihapus permanen. Ini bukan data induk sehingga hard delete diperbolehkan."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function ObservationForm({ form, setForm, students, saving, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6">
      <form onSubmit={onSubmit} className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-4 text-base font-bold text-primary-900">Tambah Observasi</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">Siswa *</label>
            <select
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
            >
              <option value="">- Pilih Siswa -</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} {s.class?.name ? `(${s.class.name})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal Observasi</label>
            <input
              type="date"
              value={form.observation_date}
              onChange={(e) => setForm((f) => ({ ...f, observation_date: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
            />
          </div>
        </div>

        <p className="mb-2 mt-4 text-xs font-semibold uppercase text-gray-500">Skala 1-4 per dimensi</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SCALE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs font-medium text-gray-600">{f.label}</label>
              <select
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
              >
                {[1, 2, 3, 4].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Kekuatan yang teramati</label>
            <textarea
              value={form.strengths}
              onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Kebutuhan/hal yang perlu didukung</label>
            <textarea
              value={form.needs}
              onChange={(e) => setForm((f) => ({ ...f, needs: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Catatan tambahan</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}
