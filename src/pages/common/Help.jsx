import { HelpCircle, Mail, BookOpen } from 'lucide-react'

const FAQS = [
  {
    q: 'Apa itu SiDIAG Madrasah?',
    a: 'SiDIAG Madrasah adalah sistem asesmen diagnostik, minat, dan preferensi belajar siswa yang membantu guru memahami kebutuhan belajar siswa secara awal, bukan sebagai alat diagnosis medis atau psikologis.',
  },
  {
    q: 'Apakah hasil asesmen bersifat permanen?',
    a: 'Tidak. Hasil asesmen ditampilkan sebagai kecenderungan atau preferensi saat ini dalam bentuk persentase, dan dapat berubah dari waktu ke waktu. Sistem tidak memberikan label permanen kepada siswa.',
  },
  {
    q: 'Bagaimana jika siswa mendapat kategori "Perlu Rujukan Profesional"?',
    a: 'Kategori ini tidak diputuskan otomatis oleh sistem. Kategori tersebut hanya tampil sebagai peringatan untuk ditinjau oleh Guru BK, yang kemudian mempertimbangkan observasi, komunikasi dengan orang tua, dan bila perlu konsultasi tenaga profesional.',
  },
  {
    q: 'Siapa yang bisa melihat data siswa?',
    a: 'Akses data diatur berdasarkan peran (role). Madrasah hanya dapat melihat data internal mereka sendiri, siswa hanya dapat melihat data miliknya sendiri, sesuai kebijakan Row Level Security pada basis data.',
  },
  {
    q: 'Bagaimana cara mengatasi lupa password?',
    a: 'Gunakan menu "Lupa Password" pada halaman login untuk menerima tautan reset password melalui email terdaftar.',
  },
  {
    q: 'Bagaimana cara mendaftarkan madrasah baru?',
    a: 'Gunakan menu "Daftarkan Madrasah" pada halaman login. Akun akan diverifikasi oleh Super Admin sebelum aktif sepenuhnya.',
  },
]

export default function Help() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <HelpCircle className="text-primary-800" size={28} />
        <div>
          <h1 className="text-xl font-bold text-primary-900">Bantuan Pengguna</h1>
          <p className="text-sm text-gray-500">Pertanyaan yang sering diajukan dan panduan singkat penggunaan sistem.</p>
        </div>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, idx) => (
          <details key={idx} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm open:shadow-md">
            <summary className="cursor-pointer text-sm font-semibold text-primary-900">{item.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-secondary-100 bg-secondary-100/30 p-5">
        <div className="mb-2 flex items-center gap-2 text-primary-900">
          <BookOpen size={18} />
          <p className="text-sm font-semibold">Panduan Singkat</p>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>Login sesuai peran Anda (Admin, Guru, Siswa, atau Orang Tua).</li>
          <li>Admin madrasah mengelola data guru, siswa, dan kelas.</li>
          <li>Guru/Guru BK membuat periode asesmen dan bank instrumen/soal.</li>
          <li>Siswa mengerjakan asesmen yang ditugaskan pada periode aktif.</li>
          <li>Hasil asesmen ditinjau oleh guru dan dapat diunduh sebagai laporan PDF.</li>
        </ol>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
        <Mail size={16} />
        Butuh bantuan lebih lanjut? Hubungi admin madrasah atau tim teknis Anda.
      </div>
    </div>
  )
}
