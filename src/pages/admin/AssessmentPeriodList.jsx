import { useEffect, useState } from 'react'
import { Calendar, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { store } from '../../lib/store'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const emptyForm = { name: '', academic_year: '', semester: 'ganjil' }

export default function AssessmentPeriodList() {
  const [items, setItems] = useState([])
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
    let data = store.getAll('assessment_periods')
    if (madrasahId) data = data.filter((p) => p.madrasah_id === madrasahId)
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { if (madrasahId) fetchData() }, [madrasahId])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name || '', academic_year: item.academic_year || '', semester: item.semester || 'ganjil' }); setShowForm(true) }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.name) return toast.error('Nama periode wajib diisi')
    setSaving(true)
    try {
      if (editing) {
        store.update('assessment_periods', editing.id, form)
        logActivity({ userId: user?.id, action: 'update', entity: 'assessment_periods', entityId: editing.id, description: `Memperbarui periode ${form.name}` })
        toast.success('Periode diperbarui')
      } else {
        const data = store.insert('assessment_periods', { ...form, is_active: true, madrasah_id: madrasahId })
        logActivity({ userId: user?.id, action: 'create', entity: 'assessment_periods', entityId: data.id, description: `Menambahkan periode ${form.name}` })
        toast.success('Periode baru ditambahkan')
      }
      setShowForm(false); fetchData()
    } catch (err) { toast.error(err.message || 'Gagal menyimpan') } finally { setSaving(false) }
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    store.update('assessment_periods', confirmDelete.id, { is_active: false })
    toast.success('Periode dinonaktifkan'); setConfirmDelete(null); fetchData()
  }

  return (
    <div>
      <PageHeader title="Periode Asesmen" description="Kelola periode asesmen (tahun ajaran, semester)." action={<button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900"><Plus size={16} /> Tambah Periode</button>} />
      {loading ? <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div> : items.length === 0 ? <EmptyState icon={Calendar} title="Belum ada periode asesmen" /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Tahun Ajaran</th><th className="px-4 py-3">Semester</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.academic_year || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{item.semester || '-'}</td>
                  <td className="px-4 py-3">{item.is_active ? <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Aktif</span> : <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">Tidak Aktif</span>}</td>
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
            <h3 className="mb-4 text-base font-bold text-primary-900">{editing ? 'Edit Periode' : 'Tambah Periode'}</h3>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Nama Periode *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="TA 2025/2026" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Tahun Ajaran</label><input value={form.academic_year} onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))} placeholder="2025/2026" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Semester</label><select value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"><option value="ganjil">Ganjil</option><option value="genap">Genap</option></select></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button><button type="submit" disabled={saving} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
          </form>
        </div>
      )}
      <ConfirmDialog open={Boolean(confirmDelete)} title="Nonaktifkan periode ini?" description={`Periode "${confirmDelete?.name}" akan dinonaktifkan.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
