import { useEffect, useState } from 'react'
import { KeyRound, Plus, Trash2, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 10; i++) {
    if (i === 5) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const emptyForm = { code: generateCode(), quota: 1, expires_at: '' }

export default function ActivationCodeList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { user } = useAuth()

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('activation_codes').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Gagal memuat kode aktivasi: ' + error.message)
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = () => {
    setForm({ ...emptyForm, code: generateCode() })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        code: form.code,
        quota: Number(form.quota) || 1,
        expires_at: form.expires_at || null,
        created_by: user?.id,
      }
      const { data, error } = await supabase.from('activation_codes').insert(payload).select().single()
      if (error) throw error
      await logActivity({ userId: user?.id, action: 'create', entity: 'activation_codes', entityId: data.id, description: `Membuat kode aktivasi ${form.code}` })
      toast.success('Kode aktivasi dibuat')
      setShowForm(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal membuat kode aktivasi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      const { error } = await supabase.from('activation_codes').update({ is_active: false }).eq('id', confirmDelete.id)
      if (error) throw error
      await logActivity({ userId: user?.id, action: 'deactivate', entity: 'activation_codes', entityId: confirmDelete.id, description: `Menonaktifkan kode ${confirmDelete.code}` })
      toast.success('Kode aktivasi dinonaktifkan')
      setConfirmDelete(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus kode')
    }
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Kode disalin ke clipboard')
  }

  return (
    <div>
      <PageHeader
        title="Kode Aktivasi"
        description="Kelola kode aktivasi untuk pendaftaran madrasah baru."
        action={
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">
            <Plus size={16} /> Buat Kode
          </button>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={KeyRound} title="Belum ada kode aktivasi" description="Buat kode aktivasi baru untuk didistribusikan." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Kuota</th>
                <th className="px-4 py-3">Terpakai</th>
                <th className="px-4 py-3">Kadaluwarsa</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">
                    <button onClick={() => handleCopy(item.code)} className="flex items-center gap-1 hover:text-primary-700">
                      {item.code} <Copy size={12} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.quota}</td>
                  <td className="px-4 py-3 text-gray-500">{item.used_count}</td>
                  <td className="px-4 py-3 text-gray-500">{item.expires_at ? new Date(item.expires_at).toLocaleDateString('id-ID') : 'Tidak ada'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
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
            <h3 className="mb-4 text-base font-bold text-primary-900">Buat Kode Aktivasi</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Kode</label>
                <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-700 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Kuota Penggunaan</label>
                <input type="number" min={1} value={form.quota} onChange={(e) => setForm((f) => ({ ...f, quota: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Kadaluwarsa (opsional)</label>
                <input type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
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
        title="Nonaktifkan kode ini?"
        description={`Kode "${confirmDelete?.code}" tidak akan bisa digunakan lagi.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
