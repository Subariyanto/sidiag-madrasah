import { useState } from 'react'
import { Download, Upload, Database } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/PageHeader'

const BACKUP_TABLES = ['madrasas', 'teachers', 'classes', 'students', 'assessment_periods', 'instruments', 'instrument_items']

export default function BackupRestore() {
  const { profile } = useAuth()
  const madrasahId = profile?.madrasah_id
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const backup = {}
      for (const table of BACKUP_TABLES) {
        let query = supabase.from(table).select('*')
        if (table !== 'madrasas') query = query.eq('madrasah_id', madrasahId)
        else query = query.eq('id', madrasahId)
        const { data, error } = await query
        if (error) throw error
        backup[table] = data
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
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result)
        toast(
          'Fitur restore memerlukan peninjauan manual sebelum ditulis ke database untuk mencegah duplikasi/konflik data. ' +
            `File berisi ${Object.keys(data).filter((k) => k !== '_meta').length} tabel. Hubungi tim teknis untuk proses restore penuh.`,
          { duration: 6000 }
        )
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
            Unggah file backup JSON untuk ditinjau. Proses restore penuh ke database memerlukan verifikasi tim teknis untuk mencegah
            duplikasi/konflik data.
          </p>
          <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Upload size={16} /> {importing ? 'Memproses...' : 'Pilih File Backup'}
            <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={importing} />
          </label>
        </div>
      </div>
    </div>
  )
}
