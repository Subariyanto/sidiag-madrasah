import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <ShieldAlert size={56} className="mb-4 text-accent-500" />
      <h1 className="text-xl font-bold text-primary-900">Akses Ditolak</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi admin madrasah atau super admin jika ini
        adalah kesalahan.
      </p>
      <Link to="/dashboard" className="mt-6 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
