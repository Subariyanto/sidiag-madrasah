/**
 * supabaseClient.js — localStorage shim that provides a Supabase-compatible API.
 *
 * All `supabase.from(table).select()/.insert()/.update()/.delete()` calls
 * are routed to the localStorage store. This allows the 25+ page components
 * to work without any changes to their data-access code.
 *
 * Supported chainable methods:
 *   .select(columns)           — start SELECT (parses join syntax)
 *   .eq(col, val)              — filter equality
 *   .neq(col, val)             — filter inequality
 *   .in(col, vals)             — filter IN array
 *   .order(col, { ascending }) — sort
 *   .limit(n)                  — limit rows
 *   .single()                  — return { data, error } single
 *   .maybeSingle()             — return { data: null, error: null } if not found
 *   .insert(payload)           — INSERT (returns .select().single() chain or { data, error })
 *   .update(payload)           — UPDATE matching rows
 *   .delete()                  — DELETE matching rows
 *   .upsert(payload)           — UPSERT
 *
 * Also exports APP_NAME, ACADEMIC_YEAR, ORGANIZER_NAME, isSupabaseConfigured.
 */

import { store } from './store'

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'SiDIAG Madrasah'
export const ACADEMIC_YEAR = import.meta.env.VITE_ACADEMIC_YEAR || '2025/2026'
export const ORGANIZER_NAME = import.meta.env.VITE_ORGANIZER_NAME || 'Pokjawas Jember'
export const isSupabaseConfigured = true // always true — localStorage mode

/* ── Helpers ── */

function genId(table) {
  return `${table.slice(0, 3)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Parse select columns string like '*, class:classes(name)'.
 * Returns { all: true, joins: [{ alias, table, columns }] }.
 */
function parseSelect(columns) {
  if (!columns || columns === '*' || columns === '') return { all: true, joins: [] }
  const parts = columns.split(',').map((s) => s.trim())
  const joins = []
  let all = false
  const cols = []
  for (const part of parts) {
    if (part === '*') {
      all = true
      continue
    }
    const joinMatch = part.match(/^(\w+):(\w+)\(([^)]+)\)$/)
    if (joinMatch) {
      joins.push({ alias: joinMatch[1], table: joinMatch[2], columns: joinMatch[3] })
    } else {
      cols.push(part)
    }
  }
  return { all, cols, joins }
}

/** Resolve joins for a row. E.g., class:classes(name) → row.class = { name: ... } */
function resolveJoins(row, joins) {
  if (!joins || joins.length === 0) return row
  const result = { ...row }
  for (const join of joins) {
    const fkCol = `${join.alias}_id` // e.g., class_id → classes table
    const fkVal = row[fkCol]
    if (fkVal) {
      const related = store.getById(join.table, fkVal)
      if (related) {
        // Pick only requested columns
        if (join.columns === '*') {
          result[join.alias] = related
        } else {
          const picked = {}
          for (const col of join.columns.split(',').map((s) => s.trim())) {
            if (related[col] !== undefined) picked[col] = related[col]
          }
          result[join.alias] = picked
        }
      } else {
        result[join.alias] = null
      }
    } else {
      result[join.alias] = null
    }
  }
  return result
}

/* ── Chainable query builder ── */

class QueryBuilder {
  constructor(table) {
    this._table = table
    this._filters = [] // { col, op, val }
    this._order = null // { col, ascending }
    this._limit = null
    this._selectCols = '*'
    this._single = false
    this._maybeSingle = false
  }

  select(columns = '*') {
    this._selectCols = columns
    return this
  }

  eq(col, val) {
    this._filters.push({ col, op: 'eq', val })
    return this
  }

  neq(col, val) {
    this._filters.push({ col, op: 'neq', val })
    return this
  }

  in(col, vals) {
    this._filters.push({ col, op: 'in', val: vals })
    return this
  }

  is(col, val) {
    this._filters.push({ col, op: 'is', val })
    return this
  }

  like(col, val) {
    this._filters.push({ col, op: 'like', val })
    return this
  }

  ilike(col, val) {
    this._filters.push({ col, op: 'ilike', val })
    return this
  }

  order(col, opts = {}) {
    this._order = { col, ascending: opts.ascending !== false }
    return this
  }

  limit(n) {
    this._limit = n
    return this
  }

  single() {
    this._single = true
    return this
  }

  maybeSingle() {
    this._maybeSingle = true
    return this
  }

  /** Execute SELECT and return { data, error }. */
  _executeSelect() {
    try {
      const { all, cols, joins } = parseSelect(this._selectCols)
      let rows = store.getAll(this._table)

      // Apply filters
      for (const f of this._filters) {
        rows = rows.filter((row) => {
          const v = row[f.col]
          switch (f.op) {
            case 'eq': return v === f.val
            case 'neq': return v !== f.val
            case 'in': return Array.isArray(f.val) && f.val.includes(v)
            case 'is': return (f.val === null && v == null) || v === f.val
            case 'like': return typeof v === 'string' && v.includes(f.val.replace(/%/g, ''))
            case 'ilike': return typeof v === 'string' && v.toLowerCase().includes(f.val.replace(/%/g, '').toLowerCase())
            default: return true
          }
        })
      }

      // Apply order
      if (this._order) {
        rows.sort((a, b) => {
          const av = a[this._order.col]
          const bv = b[this._order.col]
          if (av == null) return 1
          if (bv == null) return -1
          if (typeof av === 'string' && typeof bv === 'string') {
            return this._order.ascending ? av.localeCompare(bv) : bv.localeCompare(av)
          }
          return this._order.ascending ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
        })
      }

      // Apply limit
      if (this._limit != null) {
        rows = rows.slice(0, this._limit)
      }

      // Apply joins
      if (joins.length > 0) {
        rows = rows.map((row) => resolveJoins(row, joins))
      }

      // Apply column selection (if not all)
      if (!all && cols.length > 0) {
        rows = rows.map((row) => {
          const picked = {}
          for (const c of cols) {
            if (row[c] !== undefined) picked[c] = row[c]
          }
          return picked
        })
      }

      // Handle single/maybeSingle
      if (this._single) {
        if (rows.length === 0) {
          return { data: null, error: { message: 'No rows found' } }
        }
        return { data: rows[0], error: null }
      }
      if (this._maybeSingle) {
        return { data: rows[0] || null, error: null }
      }

      return { data: rows, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  /** INSERT. Returns chainable for .select().single() or { data, error }. */
  insert(payload) {
    this._insertPayload = payload
    return this
  }

  /** UPDATE matching rows. */
  update(payload) {
    this._updatePayload = payload
    return this
  }

  /** DELETE matching rows. */
  delete() {
    this._deleteMode = true
    return this
  }

  /** UPSERT. */
  upsert(payload) {
    this._upsertPayload = payload
    return this
  }

  /** Resolve the query — called by await (thenable). */
  then(resolve, reject) {
    let result

    if (this._insertPayload !== undefined) {
      result = this._executeInsert()
    } else if (this._updatePayload !== undefined) {
      result = this._executeUpdate()
    } else if (this._deleteMode) {
      result = this._executeDelete()
    } else if (this._upsertPayload !== undefined) {
      result = this._executeUpsert()
    } else {
      result = this._executeSelect()
    }

    Promise.resolve(result).then(resolve, reject)
  }

  _executeInsert() {
    try {
      const payload = this._insertPayload
      const isArray = Array.isArray(payload)
      const rows = isArray ? payload : [payload]

      const inserted = rows.map((row) => {
        const record = {
          id: row.id || genId(this._table),
          created_at: row.created_at || new Date().toISOString(),
          ...row,
        }
        return store.insert(this._table, record)
      })

      // If .select().single() was chained after insert
      if (this._selectCols && this._single) {
        return { data: inserted[0] || null, error: null }
      }
      if (this._selectCols) {
        return { data: inserted, error: null }
      }
      return { data: inserted, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  _executeUpdate() {
    try {
      const payload = this._updatePayload
      // Get matching rows first (using same filters)
      let rows = store.getAll(this._table)
      for (const f of this._filters) {
        rows = rows.filter((row) => {
          const v = row[f.col]
          switch (f.op) {
            case 'eq': return v === f.val
            case 'neq': return v !== f.val
            case 'in': return Array.isArray(f.val) && f.val.includes(v)
            default: return true
          }
        })
      }

      const updated = rows.map((row) => {
        return store.update(this._table, row.id, payload)
      })

      if (this._selectCols && this._single) {
        return { data: updated[0] || null, error: null }
      }
      if (this._selectCols) {
        return { data: updated, error: null }
      }
      return { data: updated, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  _executeDelete() {
    try {
      let rows = store.getAll(this._table)
      for (const f of this._filters) {
        rows = rows.filter((row) => {
          const v = row[f.col]
          switch (f.op) {
            case 'eq': return v === f.val
            default: return true
          }
        })
      }

      for (const row of rows) {
        store.remove(this._table, row.id)
      }

      return { data: rows, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  _executeUpsert() {
    try {
      const payload = this._upsertPayload
      const isArray = Array.isArray(payload)
      const rows = isArray ? payload : [payload]

      const upserted = rows.map((row) => {
        // Try to find existing by id
        if (row.id) {
          const existing = store.getById(this._table, row.id)
          if (existing) {
            return store.update(this._table, row.id, row)
          }
        }
        const record = {
          id: row.id || genId(this._table),
          created_at: row.created_at || new Date().toISOString(),
          ...row,
        }
        return store.insert(this._table, record)
      })

      if (this._selectCols && this._single) {
        return { data: upserted[0] || null, error: null }
      }
      return { data: upserted, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }
}

/* ── Fake supabase client ── */

export const supabase = {
  from(table) {
    return new QueryBuilder(table)
  },

  // Auth stubs — not used since AuthContext uses localStorage directly.
  // Included so any stray `supabase.auth` calls don't crash.
  auth: {
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: { message: 'Auth disabled — use localStorage login' },
    }),
    signUp: async () => ({
      data: { user: null, session: null },
      error: { message: 'Auth disabled — use activation page' },
    }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    resetPasswordForEmail: async () => ({ error: null }),
  },

  // Channel/realtime stubs
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
    subscribe: () => {},
  }),
  removeChannel: () => {},
}
