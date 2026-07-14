import { supabase } from './supabaseClient'

/**
 * Mencatat aktivitas pengguna ke tabel activity_logs.
 * Gagal secara diam-diam (hanya console.warn) agar tidak mengganggu alur utama.
 */
export async function logActivity({ userId, action, entity, entityId, description }) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId || null,
      action,
      entity: entity || null,
      entity_id: entityId || null,
      description: description || null,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Gagal mencatat log aktivitas:', err.message)
  }
}
