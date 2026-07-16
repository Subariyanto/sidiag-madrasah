import { useEffect, useState } from 'react'
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { store } from '../../lib/store'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const emptyForm = { name: '', level: '', homeroom_teacher_id: '' }

export default function ClassList() {
  const [items, setItems] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { user, profile } = useAuth()
  const madrasahId = profile?.madrasah_id

  const fetchData = () => {
    setLoading(true)
    let classes = store.query('classes', { is_active: true })
    if (madrasahId) classes = classes.filter((c) => c.madrasah_id === madrasahId)
    const allTeachers = store.query('teachers', { is_active: true }).filter((t) => !madrasahId || t.madrasah_id === madrasahId)
    classes = classes.map((c) => ({ ...c, homeroom_teacher: allTeachers.find((t) => t.id === c.homeroom_teacher_id) }))
    classes.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    setItems(classes)
    setTeachers(allTeachers)
    setLoading(false)
  }

  useEffect(() => { if (madrasahId) fetchData() }, [madrasahId])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ name: item.name || '', level: item.level || item.grade_level || '', homeroom_teacher_id: item.homeroom_teacher_id || '' })
    setShowForm(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.name) return toast.error('Nama kelas wajib diisi')
    setSaving(true)
    try {
      const payload = { ...form, homeroom_teacher_id: form.homeroom_teacher_id || null, grade_level: form.level }
      if (editing) {
        store.update('classes', editing.id, payload)
        logActivity({ userId: user?.id, action: 'update', entity: 'classes', entityId: editing.id, description: `Memperbarui kelas ${form.name}` })
        toast.success('Data kelas diperbarui')
      } else {
        const data = store.insert('classes', { ...payload, madrasah_id: madrasahId })
        logActivity({ userId: user?.id, action: 'create', entity: 'classes', entityId: data.id, description: `Menambahkan kelas ${form.name}` })
        toast.success('Kelas baru ditambahkan')
      }
      setShowForm(false); fetchData()
    } catch (err) { toast.error(err.message || 'Gagal menyimpan data') } finally { setSaving(false) }
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    store.update('classes', confirmDelete.id, { is_active: false })
    logActivity({ userId: user?.id, action: 'soft_delete', entity: 'classes', entityId: confirmDelete.id, description: `Menonaktifkan kelas ${confirmDelete.name}` })
    toast.success('Kelas dinonaktifkan'); setConfirmDelete(null); fetchData()
  }

  return (
    <div>
      <PageHeader title="Kelas & Rombel" description="Kelola kelas dan rombongan belajar." action={<button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900"><Plus size={16} /> Tambah Kelas</button>} />
      {loading ? <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div> : items.length === 0 ? <EmptyState icon={BookOpen} title="Belum ada kelas" description="Tambahkan kelas baru untuk mulai." /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Nama Kelas</th><th className="px-4 py-3">Tingkat</th><th className="px-4 py-3">Wali Kelas</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.level || item.grade_level || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{item.homeroom_teacher?.full_name || '-'}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => openEdit(item)} className="mr-2 text-primary-700 hover:text-primary-900"><Pencil size={16} /></button><button onClick={() => setConfirmDelete(item)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-base font-bold text-primary-900">{editing ? 'Edit Kelas' : 'Tambah Kelas'}</h3>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Nama Kelas *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VII-A" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Tingkat</label><input value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} placeholder="7" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Wali Kelas</label><select value={form.homeroom_teacher_id} onChange={(e) => setForm((f) => ({ ...f, homeroom_teacher_id: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"><option value="">- Pilih Wali Kelas -</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button><button type="submit" disabled={saving} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
          </form>
        </div>
      )}
      <ConfirmDialog open={Boolean(confirmDelete)} title="Nonaktifkan kelas ini?" description={`Kelas "${confirmDelete?.name}" akan dinonaktifkan (soft delete).`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
