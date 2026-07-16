import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { APP_NAME, ACADEMIC_YEAR, ORGANIZER_NAME } from '../../lib/supabaseClient'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) return toast.error('Username dan password wajib diisi')
    setLoading(true)
    try {
      await signIn(username, password)
      toast.success('Login berhasil')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login gagal. Periksa username dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-500 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-800 text-2xl font-bold text-white">S</div>
          <h1 className="text-xl font-bold text-primary-900">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-gray-500">Sistem Asesmen Diagnostik, Minat, dan Preferensi Belajar Siswa Madrasah</p>
          {(ACADEMIC_YEAR || ORGANIZER_NAME) && (
            <p className="mt-1 text-xs text-gray-400">{ORGANIZER_NAME}{ACADEMIC_YEAR && ` · TA ${ACADEMIC_YEAR}`}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
              autoComplete="username" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/aktivasi" className="font-medium text-primary-700 hover:underline">+ Aktivasi baru</Link>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary-800 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:opacity-60">
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          <UserCircle className="mr-1 inline" size={14} />
          Butuh bantuan? Hubungi admin.
        </p>
      </div>
    </div>
  )
}
