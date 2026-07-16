import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, School, Users, GraduationCap, BookOpen, KeyRound,
  ClipboardList, FileText, HelpCircle, Menu, X, LogOut, ChevronRight,
  UserCircle, Database, Eye, ListChecks, LayoutGrid, ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const APP_NAME = 'SiDIAG Madrasah'

const ROLE_LABELS = {
  admin: 'Admin',
  madrasah: 'Madrasah',
  siswa: 'Siswa',
}

const NAV_ITEMS = [
  // Admin (super admin — Yanto)
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'madrasah', 'siswa'] },
  { to: '/madrasah', label: 'Data Madrasah', icon: School, roles: ['admin'] },
  { to: '/guru', label: 'Data Guru', icon: Users, roles: ['admin', 'madrasah'] },
  { to: '/siswa', label: 'Data Siswa', icon: GraduationCap, roles: ['admin', 'madrasah'] },
  { to: '/kelas', label: 'Kelas & Rombel', icon: BookOpen, roles: ['admin', 'madrasah'] },
  { to: '/periode-asesmen', label: 'Periode Asesmen', icon: ClipboardList, roles: ['admin', 'madrasah'] },
  { to: '/bank-instrumen', label: 'Bank Instrumen', icon: FileText, roles: ['admin', 'madrasah'] },
  { to: '/bank-soal', label: 'Bank Soal', icon: FileText, roles: ['admin', 'madrasah'] },
  { to: '/observasi-guru', label: 'Observasi Guru', icon: Eye, roles: ['madrasah'] },
  { to: '/tindak-lanjut', label: 'Tindak Lanjut', icon: ListChecks, roles: ['madrasah'] },
  { to: '/pemetaan-kelas', label: 'Pemetaan Kelas', icon: LayoutGrid, roles: ['admin', 'madrasah'] },
  { to: '/kode-aktivasi', label: 'Kode Aktivasi', icon: KeyRound, roles: ['admin'] },
  { to: '/log-aktivitas', label: 'Log Aktivitas', icon: ClipboardList, roles: ['admin'] },
  { to: '/backup-restore', label: 'Backup & Restore', icon: Database, roles: ['admin', 'madrasah'] },
  { to: '/bantuan', label: 'Bantuan', icon: HelpCircle, roles: ['admin', 'madrasah', 'siswa'] },
]

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <span className="text-gray-400">Home</span>
      {segments.map((seg, idx) => (
        <span key={idx} className="flex items-center gap-1">
          <ChevronRight size={14} />
          <span className="capitalize text-gray-700">{seg.replace(/-/g, ' ')}</span>
        </span>
      ))}
    </div>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))

  const handleLogout = async () => {
    await signOut()
    toast.success('Anda telah keluar')
    navigate('/login')
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 font-bold text-white">S</div>
        <div>
          <p className="text-sm font-bold leading-tight">{APP_NAME}</p>
          <p className="text-xs text-secondary-300">Sistem Asesmen Madrasah</p>
        </div>
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-accent-500 text-white' : 'text-secondary-100 hover:bg-white/10'
              }`}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary-100 transition hover:bg-white/10">
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <aside className="hidden w-64 flex-col bg-primary-800 text-white md:flex">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 flex-col bg-primary-800 text-white flex">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <p className="text-sm font-bold">{APP_NAME}</p>
              <button onClick={() => setSidebarOpen(false)} className="text-white"><X size={20} /></button>
            </div>
            <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-accent-500 text-white' : 'text-secondary-100 hover:bg-white/10'
                    }`}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-white/10 p-3">
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary-100 hover:bg-white/10">
                <LogOut size={18} /> Keluar
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 md:hidden"><Menu size={22} /></button>
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-800">{profile?.full_name || 'Pengguna'}</p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[role] || role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100 text-primary-800">
              <UserCircle size={22} />
            </div>
          </div>
        </header>
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
