import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, School, Users, GraduationCap, UserCircle, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { APP_NAME, ACADEMIC_YEAR, ORGANIZER_NAME, isSupabaseConfigured } from '../../lib/supabaseClient'

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', icon: ShieldCheck },
  { value: 'admin_madrasah', label: 'Admin Madrasah', icon: School },
  { value: 'guru', label: 'Guru / Guru BK', icon: Users },
  { value: 'siswa', label: 'Siswa', icon: GraduationCap },
  { value: 'orang_tua', label: 'Orang Tua', icon: Heart },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('admin_madrasah')
  const [activationCode, setActivationCode] = useState('')
  const [showActivation, setShowActivation] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email dan password wajib diisi')
      return
    }
    setLoading(true)
    try {
      const profile = await signIn(email, password)
      if (profile && profile.role !== selectedRole) {
        toast.error(
          `Akun ini terdaftar sebagai "${profile.role}", bukan "${selectedRole}". Silakan pilih peran yang sesuai.`
        )
        setLoading(false)
        return
      }
      toast.success('Login berhasil')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login gagal. Periksa email dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-500 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-800 text-2xl font-bold text-white">
            S
          </div>
          <h1 className="text-xl font-bold text-primary-900">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sistem Asesmen Diagnostik, Minat, dan Preferensi Belajar Siswa Madrasah
          </p>
          {(ACADEMIC_YEAR || ORGANIZER_NAME) && (
            <p className="mt-1 text-xs text-gray-400">
              {ORGANIZER_NAME} {ACADEMIC_YEAR && `· TA ${ACADEMIC_YEAR}`}
            </p>
          )}
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Konfigurasi Supabase belum diisi. Salin <code>.env.example</code> menjadi <code>.env</code> lalu isi kredensial Anda.
          </div>
        )}

        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Masuk sebagai</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ROLES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRole(value)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition ${
                  selectedRole === value
                    ? 'border-primary-700 bg-primary-50 text-primary-800'
                    : 'border-gray-200 text-gray-500 hover:border-secondary-300'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@madrasah.sch.id"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowActivation((v) => !v)}
              className="text-xs font-medium text-primary-700 hover:underline"
            >
              {showActivation ? 'Sembunyikan kode aktivasi' : '+ Punya kode aktivasi?'}
            </button>
            {showActivation && (
              <input
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="Masukkan kode aktivasi (opsional)"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/lupa-password" className="font-medium text-primary-700 hover:underline">
              Lupa password?
            </Link>
            <Link to="/registrasi-madrasah" className="font-medium text-accent-600 hover:underline">
              Daftarkan Madrasah
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-800 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          <UserCircle className="mr-1 inline" size={14} />
          Butuh bantuan? Hubungi admin madrasah Anda.
        </p>
      </div>
    </div>
  )
}
