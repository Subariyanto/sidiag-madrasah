import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, School, GraduationCap, Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { store, logActivity } from '../lib/store'
import { useAuth } from '../context/AuthContext'
import { validateCode, saveLicense, saveRegisteredUser } from '../lib/codes'

export default function ActivationPage() {
  const [step, setStep] = useState(1) // 1=code, 2=registration
  const [code, setCode] = useState('')
  const [codeInfo, setCodeInfo] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    username: '',
    password: '',
    confirmPassword: '',
    // Madrasah-specific
    madrasahName: '',
    npsn: '',
    address: '',
    // Siswa-specific
    madrasahId: '',
  })
  const { registerUser } = useAuth()
  const navigate = useNavigate()

  const handleValidateCode = (e) => {
    e.preventDefault()
    if (!code.trim()) return toast.error('Kode aktivasi wajib diisi')
    const info = validateCode(code)
    if (!info.valid) return toast.error('Kode aktivasi tidak valid')
    setCodeInfo(info)
    setStep(2)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.nama.trim()) return toast.error('Nama wajib diisi')
    if (!form.username.trim()) return toast.error('Username wajib diisi')
    if (form.password.length < 6) return toast.error('Password minimal 6 karakter')
    if (form.password !== form.confirmPassword) return toast.error('Konfirmasi password tidak cocok')

    setLoading(true)
    try {
      const role = codeInfo.role

      // Determine madrasah_id
      let madrasahId = null
      let studentId = null

      if (role === 'madrasah') {
        if (!form.madrasahName.trim()) {
          setLoading(false)
          return toast.error('Nama madrasah wajib diisi')
        }
        // Create madrasah record
        const { data: madrasah, error: mErr } = await supabase
          .from('madrasas')
          .insert({
            name: form.madrasahName.trim(),
            npsn: form.npsn || null,
            address: form.address || null,
            status: 'active',
          })
          .select()
          .single()
        if (mErr) throw mErr
        madrasahId = madrasah.id
      } else if (role === 'siswa') {
        // Siswa selects their madrasah from dropdown
        if (!form.madrasahId) {
          setLoading(false)
          return toast.error('Pilih madrasah Anda')
        }
        madrasahId = form.madrasahId
      }

      // Save license
      saveLicense({
        code: code.toUpperCase(),
        tier: codeInfo.tier,
        role,
        name: form.nama.trim(),
      })

      // Register user
      await registerUser({
        username: form.username.trim().toLowerCase().replace(/\s+/g, '_'),
        nama: form.nama.trim(),
        password: form.password,
        role,
        madrasah_id: madrasahId,
        student_id: studentId,
      })

      logActivity({
        action: 'activation',
        entity: 'auth',
        description: `${form.nama} aktivasi sebagai ${role}`,
      })

      toast.success('Aktivasi berhasil! Silakan login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Aktivasi gagal')
    } finally {
      setLoading(false)
    }
  }

  const madrasahOptions = store.getAll('madrasas')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-500 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        {step === 1 ? (
          <form onSubmit={handleValidateCode}>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-800 text-2xl font-bold text-white">S</div>
              <h1 className="text-xl font-bold text-primary-900">Aktivasi SiDIAG Madrasah</h1>
              <p className="mt-1 text-sm text-gray-500">Masukkan kode aktivasi yang Anda dapatkan dari admin.</p>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Kode Aktivasi *</label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Contoh: MADRASAH-AB12"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm font-mono uppercase focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <button type="submit" className="w-full rounded-lg bg-primary-800 py-2.5 text-sm font-semibold text-white hover:bg-primary-900">
              Validasi Kode
            </button>

            <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700">
              <p className="font-semibold">3 Jenis Kode:</p>
              <p>• Kode Admin → diberikan ke admin sistem</p>
              <p>• Kode Madrasah → diberikan ke madrasah</p>
              <p>• Kode Siswa → diberikan ke siswa</p>
              <p className="mt-1">Dapatkan kode dari admin (Pengawas).</p>
            </div>

            <div className="mt-4 text-center">
              <button type="button" onClick={() => navigate('/login')} className="text-sm font-medium text-primary-700 hover:underline">
                Sudah punya akun? Login di sini
              </button>
            </div>
          </form>
        ) : (
            <form onSubmit={handleRegister}>
              <div className="mb-4 flex items-center gap-2">
                <button type="button" onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600">
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-primary-900">Registrasi {codeInfo?.label}</h1>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
                <CheckCircle2 size={16} />
                <span>Kode valid: <strong>{code}</strong></span>
              </div>

              {/* Madrasah fields */}
              {codeInfo?.role === 'madrasah' && (
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Nama Madrasah *</label>
                    <input value={form.madrasahName} onChange={(e) => setForm((f) => ({ ...f, madrasahName: e.target.value }))}
                      placeholder="MTs Negeri 1 Contoh" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">NPSN</label>
                      <input value={form.npsn} onChange={(e) => setForm((f) => ({ ...f, npsn: e.target.value }))}
                        placeholder="12345678" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Alamat</label>
                      <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="Alamat" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Siswa: select madrasah */}
              {codeInfo?.role === 'siswa' && (
                <div className="mb-4">
                  <label className="mb-1 block text-xs font-medium text-gray-600">Pilih Madrasah *</label>
                  {madrasahOptions.length > 0 ? (
                    <select value={form.madrasahId} onChange={(e) => setForm((f) => ({ ...f, madrasahId: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none">
                      <option value="">- Pilih Madrasah -</option>
                      {madrasahOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  ) : (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Belum ada madrasah terdaftar di perangkat ini. Hubungi admin madrasah untuk menambahkan data madrasah terlebih dahulu.
                    </p>
                  )}
                </div>
              )}

              {/* Common fields */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Nama Lengkap *</label>
                  <input value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                    placeholder="Nama lengkap" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Username *</label>
                  <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="username login" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 6 karakter" className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-primary-700 focus:outline-none" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Konfirmasi Password *</label>
                  <input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Ulangi password" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="mt-5 w-full rounded-lg bg-primary-800 py-2.5 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60">
                {loading ? 'Memproses...' : 'Aktivasi Sekarang'}
              </button>
            </form>
          )}
      </div>
    </div>
  )
}
