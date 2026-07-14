import { useEffect, useState } from 'react'
import { GraduationCap, Plus, Pencil, Trash2, Search, Upload, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const emptyForm = { full_name: '', nis: '', nisn: '', gender: 'L', birth_date: '', class_id: '', parent_name: '', parent_phone: '', parent_email: '' }

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
  const madrasahId = profile?.madrasah_id

  const fetchData = async () => {
    setLoading(true)
    const [studentRes, classRes] = await Promise.all([
      supabase.from('students').select('*, class:classes(name)').eq('status', 'active').eq('madrasah_id', madrasahId).order('full_name'),
      supabase.from('classes').select('id, name').eq('is_active', true).eq('madrasah_id', madrasahId).order('name'),
    ])
    if (studentRes.error) toast.error('Gagal memuat data siswa: ' + studentRes.error.message)
    else setItems(studentRes.data || [])
    if (!classRes.error) setClasses(classRes.data || [])
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
      full_name: item.full_name || '',
      nis: item.nis || '',
      nisn: item.nisn || '',
      gender: item.gender || 'L',
      birth_date: item.birth_date || '',
      class_id: item.class_id || '',
      parent_name: item.parent_name || '',
      parent_phone: item.parent_phone || '',
      parent_email: '',
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.full_name) {
      toast.error('Nama siswa wajib diisi')
      return
    }
    setSaving(true)
    try {
      const { parent_email, ...formRest } = form
      const payload = { ...formRest, class_id: form.class_id || null, birth_date: form.birth_date || null }
      if (editing) {
        const { error } = await supabase.from('students').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ userId: user?.id, action: 'update', entity: 'students', entityId: editing.id, description: `Memperbarui siswa ${form.full_name}` })
        toast.success('Data siswa diperbarui')
      } else {
        let parentProfileId = null
        if (parent_email) {
          const { data: parentProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', parent_email)
            .eq('role', 'orang_tua')
            .maybeSingle()
          if (parentProfile?.id) {
            parentProfileId = parentProfile.id
          } else {
            toast('Akun orang tua dengan email tersebut belum terdaftar. Siswa akan tetap tersimpan, hubungkan manual nanti setelah orang tua mendaftar.', { duration: 6000 })
          }
        }
        const { data, error } = await supabase
          .from('students')
          .insert({ ...payload, madrasah_id: madrasahId, parent_profile_id: parentProfileId })
          .select()
          .single()
        if (error) throw error
        await logActivity({ userId: user?.id, action: 'create', entity: 'students', entityId: data.id, description: `Menambahkan siswa ${form.full_name}` })
        toast.success('Siswa baru ditambahkan')
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
      const { error } = await supabase.from('students').update({ is_active: false, status: 'inactive' }).eq('id', confirmDelete.id)
      if (error) throw error
      await logActivity({ userId: user?.id, action: 'soft_delete', entity: 'students', entityId: confirmDelete.id, description: `Menonaktifkan siswa ${confirmDelete.full_name}` })
      toast.success('Siswa dinonaktifkan')
      setConfirmDelete(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data')
    }
  }

  const handleExportCSV = () => {
    const csv = Papa.unparse(
      items.map((i) => ({
        nama: i.full_name,
        nis: i.nis,
        nisn: i.nisn,
        jenis_kelamin: i.gender,
        kelas: i.class?.name || '',
        nama_ortu: i.parent_name,
        telp_ortu: i.parent_phone,
      }))
    )
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'data-siswa.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportCSV = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data
            .filter((r) => r.nama)
            .map((r) => ({
              full_name: r.nama,
              nis: r.nis || null,
              nisn: r.nisn || null,
              gender: r.jenis_kelamin === 'P' ? 'P' : 'L',
              parent_name: r.nama_ortu || null,
              parent_phone: r.telp_ortu || null,
              madrasah_id: madrasahId,
            }))
          if (rows.length === 0) {
            toast.error('Tidak ada baris valid ditemukan pada file CSV')
            return
          }
          const { error } = await supabase.from('students').insert(rows)
          if (error) throw error
          toast.success(`${rows.length} siswa berhasil diimpor`)
          fetchData()
        } catch (err) {
          toast.error(err.message || 'Gagal mengimpor CSV')
        }
      },
    })
    e.target.value = ''
  }

  const filtered = items.filter(
    (i) => i.full_name?.toLowerCase().includes(search.toLowerCase()) || i.nis?.includes(search) || i.nisn?.includes(search)
  )

  return (
    <div>
      <PageHeader
        title="Data Siswa"
        description="Kelola daftar siswa di madrasah Anda."
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Download size={16} /> Ekspor CSV
            </button>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Upload size={16} /> Impor CSV
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>
            <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">
              <Plus size={16} /> Tambah Siswa
            </button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIS, atau NISN siswa..." className="w-full text-sm outline-none" />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Belum ada data siswa" description="Tambahkan siswa baru atau impor dari CSV." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">NIS/NISN</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Nama Orang Tua</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.nis || item.nisn || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{item.class?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{item.parent_name || '-'}</td>
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
    </div>
  )
}
