export default function QuestionForm({ form, setForm, updateOption, editing, saving, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form onSubmit={onSubmit} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-4 text-base font-bold text-primary-900">{editing ? 'Edit Soal' : 'Tambah Soal'}</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Mata Pelajaran</label>
            <input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Tipe Soal</label>
            <select
              value={form.question_type}
              onChange={(e) => setForm((f) => ({ ...f, question_type: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
            >
              <option value="multiple_choice">Pilihan Ganda</option>
              <option value="essay">Uraian</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Teks Soal *</label>
            <textarea
              value={form.question_text}
              onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
            />
          </div>

          {form.question_type === 'multiple_choice' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Pilihan Jawaban</label>
              <div className="space-y-2">
                {form.options.map((opt, idx) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={form.correct_answer === opt.key}
                      onChange={() => setForm((f) => ({ ...f, correct_answer: opt.key }))}
                    />
                    <span className="w-5 text-sm font-semibold text-gray-500">{opt.key}</span>
                    <input
                      value={opt.text}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-400">Pilih radio button pada jawaban yang benar.</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Tingkat Kesulitan</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:outline-none"
            >
              <option value="mudah">Mudah</option>
              <option value="sedang">Sedang</option>
              <option value="sulit">Sulit</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-60">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}
