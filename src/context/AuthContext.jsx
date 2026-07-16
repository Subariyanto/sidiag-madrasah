import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { store, logActivity } from '../lib/store'
import {
  getStoredLicense,
  getRegisteredUsers,
  saveRegisteredUser,
  findRegisteredUser,
} from '../lib/codes'
import { getSeedData, getSeedUsers } from '../lib/seed'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [license, setLicense] = useState(null)

  useEffect(() => {
    // Ensure seed users exist on first load
    const users = getRegisteredUsers()
    if (users.length === 0) {
      const seedUsers = getSeedUsers()
      seedUsers.forEach((u) => saveRegisteredUser(u))
    }
    // Ensure seed data exists
    store.getAll('madrasas')

    // Restore session from localStorage
    try {
      const saved = localStorage.getItem('sidiag_session_v1')
      if (saved) {
        const session = JSON.parse(saved)
        setUser(session.user)
        setProfile(session.profile)
        setRole(session.role)
      }
    } catch {}

    // Check license
    const lic = getStoredLicense()
    setLicense(lic)
    setLoading(false)
  }, [])

  /** Login by username/nama + password (localStorage only). */
  const signIn = useCallback(async (username, password) => {
    let found = findRegisteredUser(username, password)
    // Fallback: re-seed if no users at all
    if (!found) {
      const allUsers = getRegisteredUsers()
      if (allUsers.length === 0) {
        const seedUsers = getSeedUsers()
        seedUsers.forEach((u) => saveRegisteredUser(u))
        found = findRegisteredUser(username, password)
      }
    }
    if (!found) {
      throw new Error('Username atau password salah')
    }

    // Build profile from user record
    const userProfile = {
      id: found.id,
      full_name: found.nama,
      role: found.role,
      madrasah_id: found.madrasah_id || null,
      student_id: found.student_id || null,
    }

    // Normalize legacy roles
    const normalizedRole = found.role === 'admin_madrasah' ? 'madrasah'
      : (found.role === 'guru' || found.role === 'guru_bk') ? 'madrasah'
      : found.role

    setUser({ id: found.id, email: null })
    setProfile(userProfile)
    setRole(normalizedRole)

    // Persist session
    localStorage.setItem('sidiag_session_v1', JSON.stringify({
      user: { id: found.id, email: null },
      profile: userProfile,
      role: normalizedRole,
    }))

    logActivity({
      userId: found.id,
      action: 'login',
      entity: 'auth',
      entityId: found.id,
      description: `${found.nama} login sebagai ${found.role}`,
    })

    return { user: { id: found.id }, profile: userProfile, role: normalizedRole }
  }, [])

  /** Sign out — just clear local state. */
  const signOut = useCallback(async () => {
    if (user?.id) {
      logActivity({
        userId: user.id,
        action: 'logout',
        entity: 'auth',
        entityId: user.id,
        description: 'User logout',
      })
    }
    setUser(null)
    setProfile(null)
    setRole(null)
    localStorage.removeItem('sidiag_session_v1')
  }, [user])

  /** Register a new user (from activation page). */
  const registerUser = useCallback(async (userData) => {
    const record = saveRegisteredUser(userData)
    return record
  }, [])

  /** Refresh license state. */
  const refreshLicense = useCallback(() => {
    const lic = getStoredLicense()
    setLicense(lic)
    return lic
  }, [])

  const value = {
    user,
    profile,
    role,
    loading,
    license,
    signIn,
    signOut,
    registerUser,
    refreshLicense,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
