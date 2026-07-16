import { useEffect, useState } from 'react'
import { Users, Plus, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { store } from '../../lib/store'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const emptyForm = { full_name: '', nip: '', gender: 'L', subject: '', is_guru_bk: false, phone: '', email: '' }

export default function TeacherList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { user, profile } = useAuth()
  const madrasahId = profile?.madrasah_id || store.getAll('madrasas')[0]?.id

  const fetchData = () => {
    setLoading(true)
    let data = store.query('teachers', { is_active: true })
    if (madrasahId) data = data.filter((t) => t.madrasah_id === madrasahId)
    data.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [madrasahId])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ full_name: item.full_name || '', nip: item.nip || '', gender: item.gender || 'L', subject: item.subject || '', is_guru_bk: item.is_guru_bk || false, phone: item.phone || '', email: item.email || '' })
    setShowForm(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.full_name) return toast.error('Nama guru wajib diisi')
    if (!madrasahId) return toast.error('Madrasah belum teridentifikasi. Coba logout lalu login kembali.')
    setSaving(true)
    try {
      const payload = { ...form, madrasah_id: madrasahId, status: 'active', is_active: true }
      const data = store.insert('teachers', payload)
      try { logActivity({ userId: user?.id, action: 'create', entity: 'teachers', entityId: data.id, description: `Menambahkan guru ${form.full_name}` }) } catch {}
      toast.success('Guru baru ditambahkan')
      setShowForm(false); fetchData()
    } catch (err) { console.error('Save error:', err); toast.error('Gagal simpan: ' + (err.message || err)) } finally { setSaving(false) }
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    store.update('teachers', confirmDelete.id, { is_active: false })
    logActivity({ userId: user?.id, action: 'soft_delete', entity: 'teachers', entityId: confirmDelete.id, description: `Menonaktifkan guru ${confirmDelete.full_name}` })
    toast.success('Guru dinonaktifkan'); setConfirmDelete(null); fetchData()
  }

  const filtered = items.filter((i) => i.full_name?.toLowerCase().includes(search.toLowerCase()) || i.nip?.includes(search))

  return (
    <div>
      <PageHeader title="Data Guru" description="Kelola daftar guru di madrasah Anda." action={<button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900"><Plus size={16} /> Tambah Guru</button>} />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"><Search size={16} className="text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau NIP guru..." className="w-full text-sm outline-none" /></div>
      {loading ? <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div> : filtered.length === 0 ? <EmptyState icon={Users} title="Belum ada data guru" description="Tambahkan guru baru untuk mulai." /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">NIP</th><th className="px-4 py-3">Mapel/Bidang</th><th className="px-4 py-3">Guru BK</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.nip || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{item.subject || '-'}</td>
                  <td className="px-4 py-3">{item.is_guru_bk ? <span className="rounded-full bg-secondary-100 px-2 py-1 text-xs font-medium text-primary-800">Ya</span> : '-'}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => openEdit(item)} className="mr-2 text-primary-700 hover:text-primary-900"><Pencil size={16} /></button><button onClick={() => setConfirmDelete(item)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-base font-bold text-primary-900">{editing ? 'Edit Guru' : 'Tambah Guru'}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-gray-600">Nama Lengkap *</label><input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">NIP</label><input value={form.nip} onChange={(e) => setForm((f) => ({ ...f, nip: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Jenis Kelamin</label><select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Mapel/Bidang</label><input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Telepon</label><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-gray-600">Email</label><input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div className="sm:col-span-2 flex items-center gap-2"><input type="checkbox" checked={form.is_guru_bk} onChange={(e) => setForm((f) => ({ ...f, is_guru_bk: e.target.checked }))} id="is_guru_bk" /><label htmlFor="is_guru_bk" className="text-sm text-gray-600">Guru ini adalah Guru BK / Konselor</label></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button><button type="submit" disabled={saving} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
          </form>
        </div>
      )}
      <ConfirmDialog open={Boolean(confirmDelete)} title="Nonaktifkan guru ini?" description={`Data guru "${confirmDelete?.full_name}" akan dinonaktifkan (soft delete).`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
