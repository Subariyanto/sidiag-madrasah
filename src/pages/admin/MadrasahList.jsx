import { useEffect, useState } from 'react'
import { School, Plus, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const STATUS_LABELS = {
  pending_verification: { label: 'Menunggu Verifikasi', color: 'bg-amber-100 text-amber-700' },
  active: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
  suspended: { label: 'Ditangguhkan', color: 'bg-red-100 text-red-700' },
  inactive: { label: 'Tidak Aktif', color: 'bg-gray-100 text-gray-600' },
}

const emptyForm = { name: '', npsn: '', address: '', phone: '', email: '', head_master_name: '', status: 'pending_verification' }

export default function MadrasahList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { user } = useAuth()

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('madrasas')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      toast.error('Gagal memuat data madrasah: ' + error.message)
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name || '',
      npsn: item.npsn || '',
      address: item.address || '',
      phone: item.phone || '',
      email: item.email || '',
      head_master_name: item.head_master_name || '',
      status: item.status || 'pending_verification',
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name) {
      toast.error('Nama madrasah wajib diisi')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('madrasas').update(form).eq('id', editing.id)
        if (error) throw error
        await logActivity({ userId: user?.id, action: 'update', entity: 'madrasas', entityId: editing.id, description: `Memperbarui madrasah ${form.name}` })
        toast.success('Data madrasah diperbarui')
      } else {
        const { data, error } = await supabase.from('madrasas').insert(form).select().single()
        if (error) throw error
        await logActivity({ userId: user?.id, action: 'create', entity: 'madrasas', entityId: data.id, description: `Menambahkan madrasah ${form.name}` })
        toast.success('Madrasah baru ditambahkan')
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
      const { error } = await supabase.from('madrasas').update({ is_active: false, status: 'inactive' }).eq('id', confirmDelete.id)
      if (error) throw error
      await logActivity({ userId: user?.id, action: 'soft_delete', entity: 'madrasas', entityId: confirmDelete.id, description: `Menonaktifkan madrasah ${confirmDelete.name}` })
      toast.success('Madrasah dinonaktifkan')
      setConfirmDelete(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data')
    }
  }

  const filtered = items.filter((i) => i.name?.toLowerCase().includes(search.toLowerCase()) || i.npsn?.includes(search))

  return (
    <div>
      <PageHeader
        title="Data Madrasah"
        description="Kelola daftar madrasah yang terdaftar di sistem."
        action={
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">
            <Plus size={16} /> Tambah Madrasah
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau NPSN madrasah..."
          className="w-full text-sm outline-none"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={School} title="Belum ada data madrasah" description="Tambahkan madrasah baru untuk mulai." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama Madrasah</th>
                <th className="px-4 py-3">NPSN</th>
                <th className="px-4 py-3">Kepala Madrasah</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.npsn || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{item.head_master_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_LABELS[item.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[item.status]?.label || item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(item)} className="mr-2 text-primary-700 hover:text-primary-900">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(item)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-base font-bold text-primary-900">{editing ? 'Edit Madrasah' : 'Tambah Madrasah'}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Nama Madrasah *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">NPSN</label>
                <input value={form.npsn} onChange={(e) => setForm((f) => ({ ...f, npsn: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Alamat</label>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Telepon</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Nama Kepala Madrasah</label>
                <input value={form.head_master_name} onChange={(e) => setForm((f) => ({ ...f, head_master_name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Nonaktifkan madrasah ini?"
        description={`Madrasah "${confirmDelete?.name}" akan dinonaktifkan (soft delete), data tidak akan dihapus permanen.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
