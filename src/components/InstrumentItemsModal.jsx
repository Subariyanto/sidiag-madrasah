import { useEffect, useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'

export default function InstrumentItemsModal({ instrument, onClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newStatement, setNewStatement] = useState('')
  const [newDimension, setNewDimension] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('instrument_items')
      .select('*')
      .eq('instrument_id', instrument.id)
      .eq('is_active', true)
      .order('order_index')
    if (error) toast.error('Gagal memuat item: ' + error.message)
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [instrument.id])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newStatement.trim()) {
      toast.error('Pernyataan wajib diisi')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('instrument_items').insert({
        instrument_id: instrument.id,
        statement: newStatement,
        dimension: newDimension || null,
        order_index: items.length,
      })
      if (error) throw error
      setNewStatement('')
      setNewDimension('')
      fetchItems()
    } catch (err) {
      toast.error(err.message || 'Gagal menambahkan item')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id) => {
    try {
      const { error } = await supabase.from('instrument_items').update({ is_active: false }).eq('id', id)
      if (error) throw error
      fetchItems()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus item')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-primary-900">Item: {instrument.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-2 rounded-lg border border-dashed border-gray-300 p-3 sm:flex-row">
          <input
            value={newStatement}
            onChange={(e) => setNewStatement(e.target.value)}
            placeholder="Tulis pernyataan (skala 1-4)..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
          />
          <input
            value={newDimension}
            onChange={(e) => setNewDimension(e.target.value)}
            placeholder="Dimensi (opsional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none sm:w-40"
          />
          <button type="submit" disabled={saving} className="flex items-center justify-center gap-1 rounded-lg bg-primary-800 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60">
            <Plus size={16} /> Tambah
          </button>
        </form>

        {loading ? (
          <p className="py-6 text-center text-sm text-gray-400">Memuat item...</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Belum ada item pada instrumen ini.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <p className="text-sm text-gray-800">
                    {idx + 1}. {item.statement}
                  </p>
                  {item.dimension && <p className="text-xs text-gray-400">Dimensi: {item.dimension}</p>}
                </div>
                <button onClick={() => handleRemove(item.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
