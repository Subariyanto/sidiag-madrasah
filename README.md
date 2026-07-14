# SiDIAG Madrasah

Sistem Asesmen Diagnostik, Minat, dan Preferensi Belajar Siswa Madrasah.

Aplikasi web untuk membantu madrasah mengelola data guru/siswa/kelas dan
melaksanakan asesmen non-kognitif (minat, preferensi belajar) serta kognitif,
dengan hasil yang ditampilkan sebagai **kecenderungan** (bukan label
permanen), dilengkapi disclaimer etik dan mekanisme peringatan tinjauan Guru BK.

## Stack Teknologi

- React 18 + Vite 5 + Tailwind CSS 3 + React Router 6 (HashRouter, kompatibel GitHub Pages)
- Supabase (PostgreSQL + Auth + Storage) via `@supabase/supabase-js`
- Recharts untuk visualisasi grafik
- jsPDF + jspdf-autotable untuk laporan PDF
- qrcode untuk QR Code verifikasi laporan
- vite-plugin-pwa untuk kemampuan instal PWA
- lucide-react untuk ikon
- papaparse untuk impor/ekspor CSV
- react-hot-toast untuk notifikasi

## Struktur Folder

```
sidiag-madrasah/
├── public/                  # Aset statis, ikon PWA
├── src/
│   ├── components/          # Komponen UI reusable (Layout, ProtectedRoute, dll)
│   ├── context/             # AuthContext (state login & role)
│   ├── lib/                 # supabaseClient, pdfReport, activityLog
│   ├── pages/
│   │   ├── auth/             # Login, Registrasi Madrasah, Lupa Password
│   │   ├── dashboard/        # Dashboard per role
│   │   ├── admin/             # CRUD Madrasah, Guru, Siswa, Kelas, Periode, dll
│   │   ├── siswa/             # Pengerjaan asesmen & hasil
│   │   └── common/           # Halaman Bantuan, 404, Unauthorized
│   ├── App.jsx               # Routing utama (HashRouter)
│   └── main.jsx
├── supabase/
│   └── schema.sql            # Skema database lengkap + RLS
├── .env.example
└── package.json
```

## Instalasi & Menjalankan Secara Lokal

1. Clone/masuk ke folder project:
   ```bash
   cd sidiag-madrasah
   ```
2. Install dependency:
   ```bash
   npm install
   ```
3. Salin `.env.example` menjadi `.env` dan isi kredensial Supabase Anda
   (lihat bagian "Setup Supabase" di bawah):
   ```bash
   cp .env.example .env
   ```
4. Jalankan server development:
   ```bash
   npm run dev
   ```
5. Build untuk produksi:
   ```bash
   npm run build
   ```

## Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** pada dashboard Supabase, tempel seluruh isi file
   `supabase/schema.sql`, lalu jalankan (Run). Skema ini akan membuat semua
   tabel, index, trigger `updated_at`, fungsi helper role, dan RLS policy.
3. Buka **Project Settings > API**, salin:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

   **PENTING:** jangan pernah menyalin/menaruh `service_role` key di frontend
   manapun. Key tersebut memiliki akses penuh dan harus tetap rahasia di sisi
   server saja.
4. Tempel nilai-nilai tersebut ke file `.env` Anda.

## Membuat Akun Super Admin Pertama

Karena tidak ada Super Admin bawaan (untuk keamanan), buat secara manual:

1. Jalankan aplikasi (`npm run dev`), buka halaman **Registrasi Madrasah**
   ATAU gunakan **Supabase Auth > Users > Add User** di dashboard Supabase
   untuk membuat user baru dengan email & password pilihan Anda.
2. Setelah user berhasil dibuat, sebuah baris di tabel `public.profiles`
   akan otomatis terbuat (lewat trigger `handle_new_user`) dengan role
   default `siswa`.
3. Buka **SQL Editor** di Supabase dan jalankan query berikut (ganti email
   sesuai akun yang baru dibuat):
   ```sql
   update public.profiles
   set role = 'super_admin'
   where email = 'email-anda@contoh.com';
   ```
4. Login ke aplikasi dengan email & password tersebut, pilih role
   **Super Admin** pada halaman login.

## Environment Variables (`.env.example`)

| Variable | Keterangan |
|---|---|
| `VITE_SUPABASE_URL` | URL project Supabase Anda |
| `VITE_SUPABASE_ANON_KEY` | Anon public key Supabase (aman untuk frontend) |
| `VITE_APP_NAME` | Nama aplikasi yang ditampilkan di UI |
| `VITE_ACADEMIC_YEAR` | Tahun ajaran default, contoh `2025/2026` |
| `VITE_ORGANIZER_NAME` | Nama instansi penyelenggara, contoh `Kementerian Agama` |

Catatan: jika `.env` belum diisi, aplikasi tetap bisa di-build dan dijalankan
(memakai nilai placeholder), namun fitur login/registrasi/CRUD berbasis
Supabase tidak akan berfungsi hingga kredensial asli diisi. Peringatan akan
muncul di console browser dan pada halaman login.

## Deploy ke GitHub Pages

1. Set `base` di `vite.config.js` sesuai nama repo Anda jika di-deploy ke
   `https://<user>.github.io/<repo>/`, contoh:
   ```js
   export default defineConfig({
     base: '/sidiag-madrasah/',
     // ...
   })
   ```
   (Tidak diperlukan jika deploy ke root domain atau ke Netlify/Vercel.)
2. Build:
   ```bash
   npm run build
   ```
3. Deploy folder `dist/` ke branch `gh-pages` (bisa pakai package
   `gh-pages` atau GitHub Actions). Karena aplikasi memakai `HashRouter`,
   tidak diperlukan konfigurasi rewrite/redirect khusus untuk routing SPA.

## Deploy ke Netlify

1. Hubungkan repository ke Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Tambahkan environment variables (`VITE_SUPABASE_URL`, dst) di
   **Site settings > Environment variables**.

## Status Implementasi vs Spesifikasi 30-Bagian Asli

Jujur, ini bukan aplikasi 100% lengkap dari spesifikasi 30-bagian. Berikut status per fase:

### Sudah diimplementasikan

- Fase 1 (Fondasi): scaffold Vite+React+Tailwind+Router+PWA, schema.sql lengkap (18 tabel + RLS per role), AuthContext, Login multi-role, Registrasi Madrasah, Lupa Password, layout sidebar/hamburger/breadcrumb/header, tema warna sesuai spek.
- Fase 2 (Data Inti): CRUD Madrasah, Guru, Siswa (+ impor/ekspor CSV), Kelas & Rombel, dengan soft delete, toast, empty/loading state. Dashboard Super Admin, Admin Madrasah, Guru, Orang Tua dengan statistik & grafik Recharts dari data nyata Supabase.
- Fase 3 (Asesmen) sebagian: Periode Asesmen (CRUD), Bank Instrumen non-kognitif, Bank Soal kognitif, halaman pengerjaan asesmen siswa non-kognitif (Likert 1-4 per langkah, simpan progresif) **dan sekarang juga asesmen kognitif pilihan ganda** (`TakeCognitiveAssessment.jsx`, satu soal per langkah, simpan progresif ke `assessment_responses`, skor dihitung otomatis 0-100 dan dikategorikan Sangat Siap/Siap/Memerlukan Penguatan/Memerlukan Pendampingan, disimpan sebagai `skor_kognitif`/`kategori_kognitif` di `result_summary`), halaman Hasil Asesmen dengan grafik + disclaimer resmi + peringatan "perlu ditinjau Guru BK" (bukan keputusan otomatis).
- Fase 4 sebagian: Laporan PDF per siswa dengan QR Code verifikasi, Kode Aktivasi (CRUD Super Admin), Backup (ekspor JSON) & Log Aktivitas, halaman Bantuan.
- Observasi Guru: halaman CRUD (`TeacherObservationList.jsx`) untuk role guru/guru_bk/admin_madrasah, mencatat skala 1-4 per dimensi (partisipasi, konsentrasi, kegigihan, kolaborasi, komunikasi, kemandirian, sosial-emosional), kekuatan, kebutuhan, dan catatan per siswa. Hard delete diperbolehkan karena bukan data induk.
- Tindak Lanjut: halaman CRUD (`FollowUpList.jsx`) untuk role admin_madrasah/guru/guru_bk dengan jenis tindak lanjut sesuai spesifikasi (Pengayaan, Remedial, Konseling, Pendampingan Wali Kelas, Komunikasi Orang Tua, Tutor Sebaya, Program Pembiasaan, Rujukan Profesional), status planned/in_progress/done/cancelled, filter per status & siswa. Jenis "Rujukan Profesional" menampilkan catatan tegas bahwa keputusan harus melalui diskusi dengan Guru BK/pihak berwenang — sistem hanya mencatat rencana.
- Pemetaan Kelas: halaman agregat (`ClassMapping.jsx`) per kelas yang menampilkan hasil kognitif terakhir, kecenderungan non-kognitif tertinggi (berlabel "kecenderungan tertinggi saat ini", bukan label permanen), status perlu tinjauan Guru BK, dan jumlah tindak lanjut aktif per siswa. Ada filter urutkan skor kognitif dan ekspor CSV.
- Alur akun Orang Tua: form Tambah/Edit Siswa (`StudentList.jsx`) kini punya input opsional email orang tua. Saat membuat siswa baru, sistem mencari profil dengan email & role `orang_tua` tersebut dan menghubungkan `parent_profile_id` otomatis jika ditemukan; jika belum terdaftar, data siswa tetap tersimpan dan muncul notifikasi untuk menghubungkan manual nanti.

### Belum diimplementasikan / perlu pengembangan lanjutan

- Penugasan otomatis asesmen ke banyak siswa sekaligus (assignment generator) — saat ini assignment perlu dibuat manual per baris di database, untuk kedua jenis asesmen (non-kognitif maupun kognitif).
- Restore data dari backup JSON hanya menampilkan pratinjau, belum menulis otomatis ke Supabase (sengaja, untuk mencegah duplikasi/konflik data tanpa tinjauan manual).
- Login Orang Tua yang benar-benar baru mendaftar sendiri (self-service signup) belum otomatis terhubung ke banyak anak sekaligus; penghubungan saat ini terjadi satu arah saat admin/guru menambahkan data siswa dan mengetahui email orang tua yang bersangkutan.
- Belum ada test otomatis (unit/e2e). Verifikasi sejauh ini hanya `npm run build` (sukses).
- Belum pernah dites terhadap project Supabase sungguhan (tidak tersedia kredensial saat pengembangan); schema.sql valid secara sintaks tapi belum dieksekusi live, termasuk fitur-fitur baru di atas.

Prioritaskan item-item di atas untuk iterasi berikutnya sesuai kebutuhan madrasah.

## Deploy ke Custom Domain (GitHub Pages)

Project ini menyediakan draf `public/CNAME` berisi `sidiag.pokjawasjember.com` sebagai
contoh subdomain (mengikuti pola aplikasi sebelumnya seperti `sertifikat.pokjawasjember.com`).
File ini **belum diaktifkan/di-deploy** — berikut langkah manual yang perlu Anda lakukan:

1. Pastikan repo ini sudah di-push ke GitHub dengan nama repo dan username Anda sendiri
   (ganti placeholder `<username-github-anda>` dan `<nama-repo-anda>` di bawah).
2. Di **registrar domain** `pokjawasjember.com`, tambahkan DNS record:
   - Tipe: `CNAME`
   - Host/Name: `sidiag` (agar menjadi `sidiag.pokjawasjember.com`)
   - Value/Target: `<username-github-anda>.github.io`
   - TTL: default (atau sesuai anjuran registrar)
3. Di **GitHub repo Settings > Pages**, isi kolom **Custom domain** dengan
   `sidiag.pokjawasjember.com`, lalu simpan (GitHub akan memvalidasi DNS dan
   memperbarui/menjaga file `CNAME` di branch Pages secara otomatis).
4. Tunggu propagasi DNS (bisa beberapa menit hingga jam) sampai GitHub Pages
   menampilkan status "DNS check successful" dan mengaktifkan HTTPS otomatis.
5. Jika `vite.config.js` memakai `base: '/<nama-repo-anda>/'` untuk deploy ke
   `<username>.github.io/<repo>/`, saat pakai custom domain root (`sidiag.pokjawasjember.com/`)
   ubah `base` menjadi `'/'` agar aset tidak salah path.

Catatan: langkah di atas TIDAK dijalankan otomatis oleh asisten ini. File `public/CNAME`
hanya draf konfigurasi; DNS record harus ditambahkan sendiri oleh Yanto di registrar domain,
dan repo GitHub harus dibuat/diketahui nama & usernamenya sebelum custom domain bisa aktif.
