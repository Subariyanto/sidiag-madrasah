import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { saveRegisteredUser } from '../../lib/codes'

export default function RegisterMadrasah() {
  const [form, setForm] = useState({
    madrasahName: '',
    npsn: '',
    address: '',
    adminName: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { registerUser } = useAuth()
  const navigate = useNavigate()

  const onChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.madrasahName || !form.adminName || !form.username || !form.password) {
      toast.error('Lengkapi semua kolom wajib')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setLoading(true)
    try {
      // Insert madrasah via shim → store
      const { data: madrasah, error: madrasahError } = await supabase
        .from('madrasas')
        .insert({
          name: form.madrasahName,
          npsn: form.npsn || null,
          address: form.address || null,
          status: 'active',
        })
        .select()
        .single()

      if (madrasahError) throw madrasahError

      // Register admin user
      await registerUser({
        username: form.username,
        nama: form.adminName,
        password: form.password,
        role: 'admin_madrasah',
        madrasah_id: madrasah.id,
      })

      toast.success('Registrasi berhasil! Silakan login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-500 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline">
          <ArrowLeft size={16} />
          Kembali ke login
        </Link>
        <h1 className="text-lg font-bold text-primary-900">Registrasi Madrasah</h1>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          Daftarkan madrasah Anda untuk mulai menggunakan SiDIAG Madrasah.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Nama Madrasah *</label>
              <input
                value={form.madrasahName}
                onChange={onChange('madrasahName')}
                placeholder="MTs Negeri 1 Contoh"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">NPSN</label>
              <input
                value={form.npsn}
                onChange={onChange('npsn')}
                placeholder="12345678"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nama Admin *</label>
              <input
                value={form.adminName}
                onChange={onChange('adminName')}
                placeholder="Nama lengkap admin madrasah"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Alamat</label>
              <input
                value={form.address}
                onChange={onChange('address')}
                placeholder="Alamat madrasah"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Username *</label>
              <input
                value={form.username}
                onChange={onChange('username')}
                placeholder="username login admin"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={onChange('password')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Konfirmasi Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={onChange('confirmPassword')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent-500 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Daftarkan Madrasah'}
          </button>
        </form>
      </div>
    </div>
  )
}
