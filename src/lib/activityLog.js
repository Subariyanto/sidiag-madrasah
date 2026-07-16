import { store } from './store'

/**
 * Mencatat aktivitas pengguna ke localStorage activity_logs.
 * Gagal secara diam-diam (hanya console.warn) agar tidak mengganggu alur utama.
 */
export function logActivity({ userId, action, entity, entityId, description }) {
  try {
    store.insert('activity_logs', {
      user_id: userId || null,
      action,
      entity: entity || null,
      entity_id: entityId || null,
      description: description || null,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Gagal mencatat log aktivitas:', err?.message || err)
  }
}
