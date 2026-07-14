import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { APP_NAME } from '../../lib/supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Email wajib diisi')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
      toast.success('Tautan reset password telah dikirim ke email Anda')
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim tautan reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-500 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline">
          <ArrowLeft size={16} />
          Kembali ke login
        </Link>
        <h1 className="text-lg font-bold text-primary-900">Lupa Password</h1>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          Masukkan email akun {APP_NAME} Anda. Kami akan mengirimkan tautan untuk mengatur ulang password.
        </p>

        {sent ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Tautan reset password telah dikirim. Silakan cek kotak masuk email Anda.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@madrasah.sch.id"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-800 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:opacity-60"
            >
              {loading ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
