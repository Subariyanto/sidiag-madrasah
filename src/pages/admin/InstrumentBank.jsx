import { useEffect, useState } from 'react'
import { FileText, Plus, Pencil, Trash2, ListPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const CATEGORY_LABELS = {
  minat: 'Minat',
  preferensi_belajar: 'Preferensi Belajar',
  non_kognitif_lainnya: 'Non-Kognitif Lainnya',
}

const emptyForm = { title: '', category: 'preferensi_belajar', description: '' }

export default function InstrumentBank() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [itemsModal, setItemsModal] = useState(null)
  const { user, profile } = useAuth()
  const madrasahId = profile?.madrasah_id

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('instruments')
      .select('*, instrument_items(id)')
      .or(`madrasah_id.eq.${madrasahId},madrasah_id.is.null`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) toast.error('Gagal memuat bank instrumen: ' + error.message)
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
    setForm({ title: item.title || '', category: item.category || 'preferensi_belajar', description: item.description || '' })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title) {
      toast.error('Judul instrumen wajib diisi')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('instruments').update(form).eq('id', editing.id)
        if (error) throw error
        toast.success('Instrumen diperbarui')
      } else {
        const { error } = await supabase.from('instruments').insert({ ...form, madrasah_id: madrasahId, created_by: user?.id })
        if (error) throw error
        toast.success('Instrumen baru ditambahkan')
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
      const { error } = await supabase.from('instruments').update({ is_active: false }).eq('id', confirmDelete.id)
      if (error) throw error
      toast.success('Instrumen dinonaktifkan')
      setConfirmDelete(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data')
    }
  }

  return (
    <div>
      <PageHeader
        title="Bank Instrumen"
        description="Kelola instrumen non-kognitif (minat & preferensi belajar) dengan skala Likert 1-4."
        action={
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">
            <Plus size={16} /> Tambah Instrumen
          </button>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="Belum ada instrumen" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <span className="mb-2 inline-block rounded-full bg-secondary-100 px-2 py-1 text-xs font-medium text-primary-800">
                {CATEGORY_LABELS[item.category] || item.category}
              </span>
              <p className="text-sm font-semibold text-gray-800">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.description}</p>
              <p className="mt-2 text-xs text-gray-400">{item.instrument_items?.length || 0} item</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setItemsModal(item)} className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <ListPlus size={14} /> Kelola Item
                </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-base font-bold text-primary-900">{editing ? 'Edit Instrumen' : 'Tambah Instrumen'}</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Judul *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Kategori</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
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

      {itemsModal && (
        <InstrumentItemsModal instrument={itemsModal} onClose={() => { setItemsModal(null); fetchData() }} />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Nonaktifkan instrumen ini?"
        description={`Instrumen "${confirmDelete?.title}" akan dinonaktifkan.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
