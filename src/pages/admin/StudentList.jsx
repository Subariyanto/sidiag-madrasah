import { useEffect, useState } from 'react'
import { GraduationCap, Plus, Pencil, Trash2, Search, Upload, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import { store } from '../../lib/store'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import { saveRegisteredUser } from '../../lib/codes'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const emptyForm = { full_name: '', nis: '', nisn: '', gender: 'L', birth_date: '', class_id: '', parent_name: '', parent_phone: '' }

export default function StudentList() {
  const [items, setItems] = useState([])
  const [classes, setClasses] = useState([])
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
    let students = store.query('students', { status: 'active' })
    if (madrasahId) students = students.filter((s) => s.madrasah_id === madrasahId)
    const allClasses = store.query('classes', { is_active: true }).filter((c) => !madrasahId || c.madrasah_id === madrasahId)
    // Enrich with class name
    students = students.map((s) => ({ ...s, class: allClasses.find((c) => c.id === s.class_id) }))
    students.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    setItems(students)
    setClasses(allClasses)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [madrasahId])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ full_name: item.full_name || '', nis: item.nis || '', nisn: item.nisn || '', gender: item.gender || 'L', birth_date: item.birth_date || '', class_id: item.class_id || '', parent_name: item.parent_name || '', parent_phone: item.parent_phone || '' })
    setShowForm(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.full_name) return toast.error('Nama siswa wajib diisi')
    if (!madrasahId) return toast.error('Madrasah belum teridentifikasi. Coba logout lalu login kembali.')
    setSaving(true)
    try {
      const payload = { ...form, class_id: form.class_id || null, birth_date: form.birth_date || null }
      if (editing) {
        store.update('students', editing.id, payload)
        try { logActivity({ userId: user?.id, action: 'update', entity: 'students', entityId: editing.id, description: `Memperbarui siswa ${form.full_name}` }) } catch {}
        toast.success('Data siswa diperbarui')
      } else {
        const data = store.insert('students', { ...payload, madrasah_id: madrasahId })
        // Auto-create login account for student
        const username = (form.nis || form.full_name).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        try {
          saveRegisteredUser({
            username,
            nama: form.full_name,
            password: form.nis || 'siswa123',
            role: 'siswa',
            madrasah_id: madrasahId,
            student_id: data.id,
          })
        } catch (e) { console.warn('Auto-create user failed:', e) }
        try { logActivity({ userId: user?.id, action: 'create', entity: 'students', entityId: data.id, description: `Menambahkan siswa ${form.full_name}` }) } catch {}
        toast.success(`Siswa ditambahkan. Login: ${username} / ${form.nis || 'siswa123'}`)
      }
      setShowForm(false); fetchData()
    } catch (err) { console.error('Save error:', err); toast.error('Gagal simpan: ' + (err.message || err)) } finally { setSaving(false) }
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    store.update('students', confirmDelete.id, { is_active: false, status: 'inactive' })
    logActivity({ userId: user?.id, action: 'soft_delete', entity: 'students', entityId: confirmDelete.id, description: `Menonaktifkan siswa ${confirmDelete.full_name}` })
    toast.success('Siswa dinonaktifkan'); setConfirmDelete(null); fetchData()
  }

  const handleExportCSV = () => {
    const csv = Papa.unparse(items.map((i) => ({ nama: i.full_name, nis: i.nis, nisn: i.nisn, jenis_kelamin: i.gender, kelas: i.class?.name || '', nama_ortu: i.parent_name, telp_ortu: i.parent_phone })))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = 'data-siswa.csv'; link.click(); URL.revokeObjectURL(url)
  }

  const handleImportCSV = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data.filter((r) => r.nama).map((r) => ({ full_name: r.nama, nis: r.nis || null, nisn: r.nisn || null, gender: r.jenis_kelamin === 'P' ? 'P' : 'L', parent_name: r.nama_ortu || null, parent_phone: r.telp_ortu || null, madrasah_id: madrasahId, status: 'active' }))
          if (rows.length === 0) return toast.error('Tidak ada baris valid ditemukan pada file CSV')
          store.insertBatch('students', rows)
          toast.success(`${rows.length} siswa berhasil diimpor`); fetchData()
        } catch (err) { toast.error(err.message || 'Gagal mengimpor CSV') }
      },
    })
    e.target.value = ''
  }

  const filtered = items.filter((i) => i.full_name?.toLowerCase().includes(search.toLowerCase()) || i.nis?.includes(search) || i.nisn?.includes(search))

  return (
    <div>
      <PageHeader title="Data Siswa" description="Kelola daftar siswa di madrasah Anda." action={<div className="flex flex-wrap gap-2"><button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"><Download size={16} /> Ekspor CSV</button><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"><Upload size={16} /> Impor CSV<input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" /></label><button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900"><Plus size={16} /> Tambah Siswa</button></div>} />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"><Search size={16} className="text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIS, atau NISN siswa..." className="w-full text-sm outline-none" /></div>
      {loading ? <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div> : filtered.length === 0 ? <EmptyState icon={GraduationCap} title="Belum ada data siswa" description="Tambahkan siswa baru atau impor dari CSV." /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">NIS/NISN</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Nama Orang Tua</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.nis || item.nisn || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{item.class?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{item.parent_name || '-'}</td>
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
            <h3 className="mb-4 text-base font-bold text-primary-900">{editing ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-gray-600">Nama Lengkap *</label><input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">NIS</label><input value={form.nis} onChange={(e) => setForm((f) => ({ ...f, nis: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">NISN</label><input value={form.nisn} onChange={(e) => setForm((f) => ({ ...f, nisn: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Jenis Kelamin</label><select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Tanggal Lahir</label><input type="date" value={form.birth_date} onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-gray-600">Kelas</label><select value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"><option value="">- Pilih Kelas -</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Nama Orang Tua</label><input value={form.parent_name} onChange={(e) => setForm((f) => ({ ...f, parent_name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Telepon Orang Tua</label><input value={form.parent_phone} onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" /></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button><button type="submit" disabled={saving} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
          </form>
        </div>
      )}
      <ConfirmDialog open={Boolean(confirmDelete)} title="Nonaktifkan siswa ini?" description={`Siswa "${confirmDelete?.full_name}" akan dinonaktifkan (soft delete).`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
