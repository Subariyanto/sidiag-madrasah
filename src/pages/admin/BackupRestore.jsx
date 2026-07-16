import { useState } from 'react'
import { Download, Upload, Database } from 'lucide-react'
import toast from 'react-hot-toast'
import { store } from '../../lib/store'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/PageHeader'

export default function BackupRestore() {
  const { profile } = useAuth()
  const madrasahId = profile?.madrasah_id
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleExport = () => {
    setExporting(true)
    try {
      const allData = store.exportAll()
      // Filter by madrasah_id if not super admin
      const backup = {}
      for (const [table, rows] of Object.entries(allData)) {
        if (table.startsWith('_')) continue
        if (madrasahId && table !== 'madrasas') {
          backup[table] = rows.filter((r) => r.madrasah_id === madrasahId || r.madrasah_id == null)
        } else if (madrasahId) {
          backup[table] = rows.filter((r) => r.id === madrasahId)
        } else {
          backup[table] = rows
        }
      }
      backup._meta = { exported_at: new Date().toISOString(), madrasah_id: madrasahId }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup-sidiag-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Backup berhasil diunduh')
    } catch (err) {
      toast.error(err.message || 'Gagal membuat backup')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        const tables = Object.keys(data).filter((k) => !k.startsWith('_'))
        // Merge imported data into existing store
        const existing = store.exportAll()
        for (const table of tables) {
          if (!existing[table]) existing[table] = []
          for (const row of data[table]) {
            const idx = existing[table].findIndex((r) => r.id === row.id)
            if (idx >= 0) {
              existing[table][idx] = { ...existing[table][idx], ...row }
            } else {
              existing[table].push(row)
            }
          }
        }
        store.importAll(existing)
        toast.success(`Restore berhasil: ${tables.length} tabel diimpor. Halaman akan dimuat ulang.`)
        setTimeout(() => window.location.reload(), 2000)
      } catch {
        toast.error('File backup tidak valid')
      } finally {
        setImporting(false)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      <PageHeader title="Backup & Restore Data" description="Ekspor data madrasah Anda dalam format JSON sebagai cadangan." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <Database className="mb-2 text-primary-800" size={24} />
          <p className="text-sm font-semibold text-gray-800">Backup Data</p>
          <p className="mt-1 text-xs text-gray-500">Unduh seluruh data madrasah (guru, siswa, kelas, instrumen) dalam format JSON.</p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60"
          >
            <Download size={16} /> {exporting ? 'Membuat backup...' : 'Unduh Backup'}
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <Upload className="mb-2 text-accent-500" size={24} />
          <p className="text-sm font-semibold text-gray-800">Restore Data</p>
          <p className="mt-1 text-xs text-gray-500">
            Unggah file backup JSON untuk memulihkan data. Data yang sudah ada akan digabung (merge), bukan ditimpa.
          </p>
          <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Upload size={16} /> {importing ? 'Memproses...' : 'Pilih File Backup'}
            <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={importing} />
          </label>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        <p className="font-semibold">Catatan:</p>
        <p>Data disimpan di browser (localStorage). Clear cache/mengganti browser akan menghapus data. Backup rutin disarankan.</p>
      </div>
    </div>
  )
}
