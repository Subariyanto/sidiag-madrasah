import { useState } from 'react'
import { KeyRound, Plus, Trash2, Copy, RefreshCw, School, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import { store } from '../../lib/store'
import { useAuth } from '../../context/AuthContext'
import { generateCode } from '../../lib/codes'
import { logActivity } from '../../lib/activityLog'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function ActivationCodeList() {
  const [items, setItems] = useState(store.getAll('activation_codes').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { user } = useAuth()

  const refresh = () => setItems(store.getAll('activation_codes').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))

  const handleGenerate = (role) => {
    const code = generateCode(role)
    if (!code) return
    const data = store.insert('activation_codes', {
      code, tier: 'pro', role, label: role === 'madrasah' ? 'Kode Madrasah' : 'Kode Siswa',
      used: false, generated_by: user?.id,
    })
    logActivity({ userId: user?.id, action: 'create', entity: 'activation_codes', entityId: data.id, description: `Menerbitkan kode ${role}: ${code}` })
    toast.success(`Kode ${role} diterbitkan: ${code}`)
    refresh()
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    store.remove('activation_codes', confirmDelete.id)
    toast.success('Kode dihapus')
    setConfirmDelete(null)
    refresh()
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Kode disalin: ' + code)
  }

  const handleCopyAll = () => {
    const text = items.filter((i) => !i.used).map((i) => `${i.code} (${i.role})`).join('\n')
    if (!text) return toast.error('Tidak ada kode tersedia')
    navigator.clipboard.writeText(text)
    toast.success('Semua kode tersedia disalin')
  }

  return (
    <div>
      <PageHeader title="Kode Aktivasi" description="Terbitkan kode aktivasi untuk madrasah dan siswa." />

      {/* Generate buttons */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button onClick={() => handleGenerate('madrasah')}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50 px-4 py-4 text-sm font-semibold text-primary-800 hover:bg-primary-100">
          <School size={20} /> Terbitkan Kode Madrasah
        </button>
        <button onClick={() => handleGenerate('siswa')}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-secondary-300 bg-secondary-50 px-4 py-4 text-sm font-semibold text-secondary-800 hover:bg-secondary-100">
          <GraduationCap size={20} /> Terbitkan Kode Siswa
        </button>
      </div>

      {/* Action bar */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">{items.filter((i) => !i.used).length} kode tersedia · {items.filter((i) => i.used).length} terpakai</p>
        <div className="flex gap-2">
          <button onClick={refresh} className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleCopyAll} className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Copy size={14} /> Salin Semua
          </button>
        </div>
      </div>

      {/* Code list */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <KeyRound size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada kode aktivasi. Terbitkan kode baru di atas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Untuk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dibuat</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">{item.code}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      item.role === 'madrasah' ? 'bg-primary-100 text-primary-700' :
                      item.role === 'siswa' ? 'bg-secondary-100 text-secondary-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {item.role || 'madrasah'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.used
                      ? <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">Terpakai</span>
                      : <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Tersedia</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleCopy(item.code)} className="mr-2 text-gray-500 hover:text-gray-700" title="Salin kode">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(item)} className="text-red-500 hover:text-red-700" title="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-semibold">Cara Distribusi Kode:</p>
        <p>1. Terbitkan kode madrasah → bagikan ke madrasah yang akan mendaftar</p>
        <p>2. Madrasah melakukan aktivasi di halaman login → masukkan kode + data madrasah</p>
        <p>3. Madrasah dapat menambahkan siswa melalui menu Data Siswa (otomatis membuat akun login siswa)</p>
        <p>4. Atau terbitkan kode siswa → bagikan ke siswa untuk registrasi mandiri</p>
      </div>

      <ConfirmDialog open={Boolean(confirmDelete)} title="Hapus kode ini?" description={`Kode "${confirmDelete?.code}" akan dihapus permanen.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
