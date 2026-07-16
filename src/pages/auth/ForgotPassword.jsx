import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { APP_NAME } from '../../lib/supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-500 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline">
          <ArrowLeft size={16} />
          Kembali ke login
        </Link>
        <h1 className="text-lg font-bold text-primary-900">Lupa Password</h1>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          {APP_NAME} menggunakan sistem login berbasis lokal. Untuk reset password,
          silakan hubungi admin madrasah Anda atau gunakan halaman aktivasi ulang dengan kode aktivasi yang sama.
        </p>

        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <p className="font-semibold">Tip:</p>
          <p>Hubungi admin madrasah untuk reset password, atau aktifkan ulang dengan kode aktivasi Anda.</p>
        </div>

        <div className="mt-4 text-center text-sm">
          <Link to="/aktivasi" className="font-semibold text-primary-700 hover:underline">
            Aktivasi ulang
          </Link>
        </div>
      </div>
    </div>
  )
}
