import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, ACADEMIC_YEAR } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const STATUS_LABELS = {
  draft: { label: 'Draf', color: 'bg-gray-100 text-gray-600' },
  active: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Ditutup', color: 'bg-red-100 text-red-600' },
}

const emptyForm = { name: '', academic_year: ACADEMIC_YEAR, start_date: '', end_date: '', status: 'draft' }

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

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('assessment_periods').select('*').eq('madrasah_id', madrasahId).order('created_at', { ascending: false })
    if (error) toast.error('Gagal memuat periode asesmen: ' + error.message)
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
      name: item.name || '',
      academic_year: item.academic_year || ACADEMIC_YEAR,
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      status: item.status || 'draft',
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name) {
      toast.error('Nama periode wajib diisi')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, start_date: form.start_date || null, end_date: form.end_date || null }
      if (editing) {
        const { error } = await supabase.from('assessment_periods').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ userId: user?.id, action: 'update', entity: 'assessment_periods', entityId: editing.id, description: `Memperbarui periode ${form.name}` })
        toast.success('Periode asesmen diperbarui')
      } else {
        const { data, error } = await supabase.from('assessment_periods').insert({ ...payload, madrasah_id: madrasahId, created_by: user?.id }).select().single()
        if (error) throw error
        await logActivity({ userId: user?.id, action: 'create', entity: 'assessment_periods', entityId: data.id, description: `Membuat periode ${form.name}` })
        toast.success('Periode asesmen dibuat')
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
      const { error } = await supabase.from('assessment_periods').update({ status: 'closed' }).eq('id', confirmDelete.id)
      if (error) throw error
      toast.success('Periode ditutup')
      setConfirmDelete(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menutup periode')
    }
  }

  return (
    <div>
      <PageHeader
        title="Periode Asesmen"
        description="Kelola periode pelaksanaan asesmen."
        action={
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">
            <Plus size={16} /> Tambah Periode
          </button>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada periode asesmen" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama Periode</th>
                <th className="px-4 py-3">Tahun Ajaran</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.academic_year || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.start_date ? new Date(item.start_date).toLocaleDateString('id-ID') : '-'} - {item.end_date ? new Date(item.end_date).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_LABELS[item.status]?.color}`}>{STATUS_LABELS[item.status]?.label}</span>
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
          <form onSubmit={handleSave} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-base font-bold text-primary-900">{editing ? 'Edit Periode' : 'Tambah Periode'}</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nama Periode *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Semester Ganjil 2025/2026" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tahun Ajaran</label>
                <input value={form.academic_year} onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Mulai</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Selesai</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
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
        title="Tutup periode ini?"
        description={`Periode "${confirmDelete?.name}" akan ditutup dan tidak menerima pengerjaan baru.`}
        confirmLabel="Tutup"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
