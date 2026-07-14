import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*, madrasa:madrasas(id, name, npsn, status)')
      .eq('id', userId)
      .single()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Gagal memuat profil:', error.message)
      setProfile(null)
      return null
    }
    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      if (data.session?.user?.id) {
        await fetchProfile(data.session.user.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user?.id) {
        await fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data?.user?.id) {
      const p = await fetchProfile(data.user.id)
      return p
    }
    return null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const signUp = async ({ email, password, fullName, role = 'siswa' }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })
    if (error) throw error
    return data
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    })
    if (error) throw error
  }

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id)
    }
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    isAuthenticated: Boolean(session),
    loading,
    signIn,
    signOut,
    signUp,
    resetPassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider')
  }
  return ctx
}
