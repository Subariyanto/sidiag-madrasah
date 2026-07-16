/**
 * localStorage-based data store for SiDIAG Madrasah.
 * Replaces all Supabase CRUD operations.
 *
 * All data lives under `sidiag_data_v1` as an object of table arrays.
 */

import { getSeedData } from './seed'

const STORAGE_KEY = 'sidiag_data_v1'

/* ── Internal helpers ── */

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = getSeedData()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return JSON.parse(raw)
  } catch {
    const seed = getSeedData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function _save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function _genId(table) {
  return `${table.slice(0, 3)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/* ── Public API ── */

export const store = {
  /** Get all rows from a table. */
  getAll(table) {
    const data = _load()
    return data[table] || []
  },

  /** Get a single row by id. */
  getById(table, id) {
    const rows = _load()[table] || []
    return rows.find((r) => r.id === id) || null
  },

  /** Query rows with a filter object (AND logic). */
  query(table, filters = {}) {
    const rows = _load()[table] || []
    return rows.filter((row) =>
      Object.entries(filters).every(([key, val]) => {
        if (val === null || val === undefined) return true
        if (Array.isArray(val)) return val.includes(row[key])
        return row[key] === val
      })
    )
  },

  /** Insert a new row. Returns the inserted row with id + created_at. */
  insert(table, row) {
    const data = _load()
    if (!data[table]) data[table] = []
    const record = {
      id: row.id || _genId(table),
      created_at: new Date().toISOString(),
      ...row,
    }
    data[table].push(record)
    _save(data)
    return record
  },

  /** Insert multiple rows. */
  insertBatch(table, rows) {
    const data = _load()
    if (!data[table]) data[table] = []
    const records = rows.map((r) => ({
      id: r.id || _genId(table),
      created_at: new Date().toISOString(),
      ...r,
    }))
    data[table].push(...records)
    _save(data)
    return records
  },

  /** Update a row by id. Returns updated row or null. */
  update(table, id, updates) {
    const data = _load()
    const rows = data[table] || []
    const idx = rows.findIndex((r) => r.id === id)
    if (idx === -1) return null
    data[table][idx] = { ...rows[idx], ...updates, updated_at: new Date().toISOString() }
    _save(data)
    return data[table][idx]
  },

  /** Upsert: update if exists (by id), else insert. */
  upsert(table, row) {
    const data = _load()
    if (!data[table]) data[table] = []
    const rows = data[table]
    const id = row.id
    const idx = id ? rows.findIndex((r) => r.id === id) : -1
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...row, updated_at: new Date().toISOString() }
      _save(data)
      return rows[idx]
    }
    const record = { id: id || _genId(table), created_at: new Date().toISOString(), ...row }
    rows.push(record)
    _save(data)
    return record
  },

  /** Upsert by conflict key (e.g., assignment_id+cognitive_question_id). */
  upsertBy(table, row, conflictKeys) {
    const data = _load()
    if (!data[table]) data[table] = []
    const rows = data[table]
    const idx = rows.findIndex((r) =>
      conflictKeys.every((k) => r[k] === row[k])
    )
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...row, updated_at: new Date().toISOString() }
      _save(data)
      return rows[idx]
    }
    const record = { id: row.id || _genId(table), created_at: new Date().toISOString(), ...row }
    rows.push(record)
    _save(data)
    return record
  },

  /** Remove a row by id. */
  remove(table, id) {
    const data = _load()
    const rows = data[table] || []
    data[table] = rows.filter((r) => r.id !== id)
    _save(data)
    return true
  },

  /** Soft-delete: set is_active=false or status=inactive. */
  softDelete(table, id) {
    return this.update(table, id, { is_active: false, status: 'inactive' })
  },

  /** Get the entire data object (for backup). */
  exportAll() {
    return _load()
  },

  /** Replace the entire data object (for restore). */
  importAll(data) {
    _save(data)
    return true
  },

  /** Reset to seed data. */
  reset() {
    const seed = getSeedData()
    _save(seed)
    return seed
  },

  /** Raw access to load (for complex queries). */
  _load,
  _save,
}

/* ── Convenience: activity log ── */

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
