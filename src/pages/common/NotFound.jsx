import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <Compass size={56} className="mb-4 text-secondary-400" />
      <h1 className="text-xl font-bold text-primary-900">404 - Halaman Tidak Ditemukan</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
      </p>
      <Link to="/dashboard" className="mt-6 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
