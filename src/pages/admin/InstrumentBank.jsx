import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Pencil, Trash2, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { store } from '../../lib/store'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'
import InstrumentItemsModal from '../../components/InstrumentItemsModal'

const emptyForm = { title: '', description: '', type: 'likert', scale_min: 1, scale_max: 4 }

export default function InstrumentBank() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [modalInstrument, setModalInstrument] = useState(null)
  const { user, profile } = useAuth()
  const madrasahId = profile?.madrasah_id

  const fetchData = () => {
    setLoading(true)
    let data = store.query('instruments', { is_active: true })
    // Show global (madrasah_id=null) + own madrasah instruments
    data = data.filter((i) => !i.madrasah_id || i.madrasah_id === madrasahId)
    data.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    // Enrich with item count
    const allItems = store.getAll('instrument_items')
    data = data.map((inst) => ({ ...inst, item_count: allItems.filter((ii) => ii.instrument_id === inst.id && ii.is_active).length }))
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [madrasahId])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (item) => { setEditing(item); setForm({ title: item.title || '', description: item.description || '', type: item.type || 'likert', scale_min: item.scale_min || 1, scale_max: item.scale_max || 4 }); setShowForm(true) }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.title) return toast.error('Judul instrumen wajib diisi')
    setSaving(true)
    try {
      const payload = { ...form, scale_min: Number(form.scale_min), scale_max: Number(form.scale_max) }
      if (editing) {
        store.update('instruments', editing.id, payload)
        logActivity({ userId: user?.id, action: 'update', entity: 'instruments', entityId: editing.id, description: `Memperbarui instrumen ${form.title}` })
        toast.success('Instrumen diperbarui')
      } else {
        const data = store.insert('instruments', { ...payload, is_active: true, madrasah_id: madrasahId })
        logActivity({ userId: user?.id, action: 'create', entity: 'instruments', entityId: data.id, description: `Menambahkan instrumen ${form.title}` })
        toast.success('Instrumen baru ditambahkan')
      }
      setShowForm(false); fetchData()
    } catch (err) { toast.error(err.message || 'Gagal menyimpan') } finally { setSaving(false) }
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    store.update('instruments', confirmDelete.id, { is_active: false })
    toast.success('Instrumen dinonaktifkan'); setConfirmDelete(null); fetchData()
  }

  return (
    <div>
      <PageHeader title="Bank Instrumen" description="Kelola instrumen asesmen non-kognitif (skala Likert)." action={<button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900"><Plus size={16} /> Tambah Instrumen</button>} />
      {loading ? <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div> : items.length === 0 ? <EmptyState icon={ClipboardList} title="Belum ada instrumen" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">{item.title}</h3>
                  <p className="text-xs text-gray-400">{item.type === 'likert' ? `Skala ${item.scale_min}-${item.scale_max}` : item.type}</p>
                </div>
                <span className="rounded-full bg-secondary-100 px-2 py-1 text-xs font-medium text-primary-800">{item.item_count} item</span>
              </div>
              <p className="mb-3 text-xs text-gray-500">{item.description || '-'}</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setModalInstrument(item)} className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"><Settings size={14} /> Item</button>
                <button onClick={() => openEdit(item)} className="text-primary-700 hover:text-primary-900"><Pencil size={16} /></button>
                <button onClick={() => setConfirmDelete(item)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
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
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Judul *</label><input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Deskripsi</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Tipe</label><select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"><option value="likert">Likert (Skala)</option></select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs font-medium text-gray-600">Skala Min</label><input type="number" value={form.scale_min} onChange={(e) => setForm((f) => ({ ...f, scale_min: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
                <div><label className="mb-1 block text-xs font-medium text-gray-600">Skala Max</label><input type="number" value={form.scale_max} onChange={(e) => setForm((f) => ({ ...f, scale_max: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button><button type="submit" disabled={saving} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
          </form>
        </div>
      )}
      {modalInstrument && <InstrumentItemsModal instrument={modalInstrument} onClose={() => { setModalInstrument(null); fetchData() }} />}
      <ConfirmDialog open={Boolean(confirmDelete)} title="Nonaktifkan instrumen ini?" description={`Instrumen "${confirmDelete?.title}" akan dinonaktifkan.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
