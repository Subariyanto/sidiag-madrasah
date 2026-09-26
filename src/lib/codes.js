/**
 * Activation code & license system for SiDIAG Madrasah.
 * localStorage-based, no server needed for data.
 *
 * Kode master/admin TIDAK lagi disimpan di sini; diverifikasi di server
 * Pusat Lisensi via RPC verify_master_code (bisa dicabut/diganti server-side).
 *
 * Code format (validated by prefix, works across devices):
 *   MADRASAH-XXXX                → madrasah registration
 *   SISWA-XXXX                   → siswa registration
 *   SIDIAG-PRO-2026              → madrasah (legacy)
 *   SIDIAG-DEMO-2026             → demo (legacy, 5-day)
 */

const STORAGE_KEY = 'sidiag_license_v1'
const USERS_KEY = 'sidiag_registered_users_v1'

// === PUSAT LISENSI APLIKASI (verifikasi master code terpusat) ===
const PUSAT_URL = 'https://llaukzsztguwrtwdubpm.supabase.co'
const PUSAT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYXVrenN6dGd1d3J0d2R1YnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTI1NDgsImV4cCI6MjEwMjc2ODU0OH0.DqKtA0aus9nOLViMEWjAPvYIAdLS_EKU3H8dYKe_Zhk'

/** Verifikasi master/admin code ke server Pusat Lisensi. */
export async function verifyMasterCode(code) {
  try {
    const r = await fetch(PUSAT_URL.replace(/\/$/, '') + '/rest/v1/rpc/verify_master_code', {
      method: 'POST',
      headers: {
        apikey: PUSAT_ANON_KEY,
        Authorization: 'Bearer ' + PUSAT_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_app_slug: 'sidiag-madrasah', p_code: String(code || '').trim() }),
    })
    if (!r.ok) return { valid: false, reason: 'network' }
    return await r.json()
  } catch {
    return { valid: false, reason: 'network' }
  }
}

/** Bundled activation codes. */
export const BUNDLED_CODES = [
  { code: 'FULL-ZJW4-ZN48-6E3P', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-AFJV-MCQA-DEBS', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-JQ5W-2JGR-EMH2', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-CUN8-XH3S-FGDU', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-33J8-KU6K-KHJ9', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-8H4J-W9K5-9B6Q', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-DB5S-JE3T-NDXH', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-XU9Y-WUXA-5H7A', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-JGZV-F8UM-FZG4', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-997H-9WW2-ZQFS', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-P9KV-CYPR-VNNU', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-VYFA-V28E-TYYN', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-T6GD-W3D4-QVX6', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-UGBQ-UGMD-L4LX', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-EFAV-U3HG-K2E3', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-5HQJ-DBJC-J5U3', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-RVRF-CSZY-XN8W', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-DTZG-JWUV-TE83', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-P2GD-TBWG-886U', tier: 'full', role: 'madrasah', label: 'Full License' },
  { code: 'FULL-EGVR-9J82-AY3N', tier: 'full', role: 'madrasah', label: 'Full License' },
  // Legacy codes
  { code: 'SIDIAG-PRO-2026', tier: 'pro', role: 'madrasah', label: 'Madrasah (Legacy)' },
  { code: 'SIDIAG-DEMO-2026', tier: 'demo', role: 'madrasah', label: 'Demo 5 Hari (Legacy)' },
]

/** Validate an activation code. Returns a Promise of { valid, tier, role, label } or { valid: false }. */
export async function validateCode(code) {
  const c = (code || '').trim().toUpperCase()

  // Madrasah code format: MADRASAH-XXXX
  if (c.startsWith('MADRASAH-') && c.length >= 10) {
    return { valid: true, tier: 'pro', role: 'madrasah', label: 'Kode Madrasah' }
  }

  // Siswa code format: SISWA-XXXX
  if (c.startsWith('SISWA-') && c.length >= 7) {
    return { valid: true, tier: 'pro', role: 'siswa', label: 'Kode Siswa' }
  }

  // Legacy / bundled codes
  const found = BUNDLED_CODES.find((b) => b.code.toUpperCase() === c)
  if (found) return { valid: true, tier: found.tier, role: found.role, label: found.label }

  // Master code → diverifikasi server (kode asli tidak ada di file ini)
  if (c) {
    const mv = await verifyMasterCode(c)
    if (mv && mv.valid) {
      return { valid: true, tier: mv.tier || 'pro', role: mv.role || 'admin', label: 'Admin (Super Admin)', master: true }
    }
  }

  return { valid: false }
}

/** Generate a random code for a specific role. */
export function generateCode(role) {
  const prefix = role === 'madrasah' ? 'MADRASAH' : role === 'siswa' ? 'SISWA' : null
  if (!prefix) return null
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusing chars
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefix}-${suffix}`
}

/** Save license object to localStorage. */
export function saveLicense(license) {
  const data = { ...license, saved_at: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}

/** Get stored license or null. Also checks expiry for demo tier. */
export function getStoredLicense() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const lic = JSON.parse(raw)
    if (lic.tier === 'demo') {
      const saved = new Date(lic.saved_at).getTime()
      const elapsed = Date.now() - saved
      const fiveDays = 5 * 24 * 60 * 60 * 1000
      if (elapsed > fiveDays) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
    }
    return lic
  } catch {
    return null
  }
}

/** Remove license. */
export function clearLicense() {
  localStorage.removeItem(STORAGE_KEY)
}

/* ── Registered users ── */

export function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRegisteredUser(user) {
  const users = getRegisteredUsers()
  const existingIdx = users.findIndex(
    (u) => u.username === user.username || u.nama === user.nama
  )
  const record = {
    id: user.id || crypto.randomUUID(),
    ...user,
    created_at: new Date().toISOString(),
  }
  if (existingIdx >= 0) {
    users[existingIdx] = { ...users[existingIdx], ...record }
  } else {
    users.push(record)
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return record
}

export function findRegisteredUser(username, password) {
  const users = getRegisteredUsers()
  return users.find(
    (u) => (u.username === username || u.nama === username) && u.password === password
  ) || null
}

export function isUserRegistered(username) {
  const users = getRegisteredUsers()
  return users.some((u) => u.username === username || u.nama === username)
}
