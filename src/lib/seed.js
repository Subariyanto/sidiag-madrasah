/**
 * Seed data for SiDIAG Madrasah.
 * Called once on first load to populate localStorage store.
 */

export function getSeedData() {
  const now = new Date().toISOString()
  const madrasahId = 'mrd-001'
  const adminId = 'usr-admin'
  const guruId = 'usr-guru'
  const siswaId = 'usr-siswa'
  const periodId = 'prd-001'
  const class1Id = 'cls-001'
  const class2Id = 'cls-002'
  const instr1Id = 'ins-001'
  const instr2Id = 'ins-002'
  const cqBase = 'cq-'

  // 5 students
  const students = [
    { id: 'std-001', madrasah_id: madrasahId, class_id: class1Id, nis: '2025001', nisn: '0012345001', full_name: 'Ahmad Fauzi', gender: 'L', status: 'active', created_at: now },
    { id: 'std-002', madrasah_id: madrasahId, class_id: class1Id, nis: '2025002', nisn: '0012345002', full_name: 'Siti Aminah', gender: 'P', status: 'active', created_at: now },
    { id: 'std-003', madrasah_id: madrasahId, class_id: class1Id, nis: '2025003', nisn: '0012345003', full_name: 'Budi Santoso', gender: 'L', status: 'active', created_at: now },
    { id: 'std-004', madrasah_id: madrasahId, class_id: class2Id, nis: '2025004', nisn: '0012345004', full_name: 'Dewi Lestari', gender: 'P', status: 'active', created_at: now },
    { id: 'std-005', madrasah_id: madrasahId, class_id: class2Id, nis: '2025005', nisn: '0012345005', full_name: 'Rizki Pratama', gender: 'L', status: 'active', created_at: now },
  ]

  // Instrument 1: Minat Belajar (5 items)
  const minatItems = [
    { id: 'itmi-001', instrument_id: instr1Id, statement: 'Saya merasa antusias saat belajar mata pelajaran di sekolah', dimension: 'Antusiasme', order_index: 0, is_active: true },
    { id: 'itmi-002', instrument_id: instr1Id, statement: 'Saya mengerjakan tugas sekolah tepat waktu tanpa ditagih', dimension: 'Kemandirian', order_index: 1, is_active: true },
    { id: 'itmi-003', instrument_id: instr1Id, statement: 'Saya mencari informasi tambahan di luar materi yang diberikan guru', dimension: 'Eksplorasi', order_index: 2, is_active: true },
    { id: 'itmi-004', instrument_id: instr1Id, statement: 'Saya merasa senang saat berhasil memahami materi yang sulit', dimension: 'Kepuasan', order_index: 3, is_active: true },
    { id: 'itmi-005', instrument_id: instr1Id, statement: 'Saya bertanya kepada guru jika tidak memahami pelajaran', dimension: 'Interaksi', order_index: 4, is_active: true },
  ]

  // Instrument 2: Preferensi Gaya Belajar (5 items)
  const gayaItems = [
    { id: 'itmi-006', instrument_id: instr2Id, statement: 'Saya lebih mudah belajar dengan melihat diagram atau gambar', dimension: 'Visual', order_index: 0, is_active: true },
    { id: 'itmi-007', instrument_id: instr2Id, statement: 'Saya lebih mudah belajar dengan mendengarkan penjelasan', dimension: 'Auditori', order_index: 1, is_active: true },
    { id: 'itmi-008', instrument_id: instr2Id, statement: 'Saya belajar sambil mencatat atau menulis ulang materi', dimension: 'Kinestetik', order_index: 2, is_active: true },
    { id: 'itmi-009', instrument_id: instr2Id, statement: 'Saya suka belajar melalui diskusi kelompok', dimension: 'Sosial', order_index: 3, is_active: true },
    { id: 'itmi-010', instrument_id: instr2Id, statement: 'Saya lebih fokus belajar sendiri di tempat yang tenang', dimension: 'Individual', order_index: 4, is_active: true },
  ]

  // 5 cognitive questions with 4 options each
  const cognitiveQuestions = [
    {
      id: cqBase + '001', madrasah_id: null, subject: 'Bahasa Indonesia', question_type: 'multiple_choice',
      question_text: 'Sinonim dari kata "rajin" adalah ...', difficulty: 'mudah', is_active: true,
      correct_answer: 'B',
      options: [
        { key: 'A', text: 'Malas' },
        { key: 'B', text: 'Tekun' },
        { key: 'C', text: 'Cepat' },
        { key: 'D', text: 'Pintar' },
      ],
    },
    {
      id: cqBase + '002', madrasah_id: null, subject: 'Matematika', question_type: 'multiple_choice',
      question_text: 'Hasil dari 15 + 27 adalah ...', difficulty: 'mudah', is_active: true,
      correct_answer: 'C',
      options: [
        { key: 'A', text: '32' },
        { key: 'B', text: '40' },
        { key: 'C', text: '42' },
        { key: 'D', text: '45' },
      ],
    },
    {
      id: cqBase + '003', madrasah_id: null, subject: 'IPA', question_type: 'multiple_choice',
      question_text: 'Proses tumbuhan membuat makanannya sendiri disebut ...', difficulty: 'sedang', is_active: true,
      correct_answer: 'A',
      options: [
        { key: 'A', text: 'Fotosintesis' },
        { key: 'B', text: 'Respirasi' },
        { key: 'C', text: 'Transpirasi' },
        { key: 'D', text: 'Evaporasi' },
      ],
    },
    {
      id: cqBase + '004', madrasah_id: null, subject: 'IPS', question_type: 'multiple_choice',
      question_text: 'Ibu kota Provinsi Jawa Timur adalah ...', difficulty: 'mudah', is_active: true,
      correct_answer: 'D',
      options: [
        { key: 'A', text: 'Malang' },
        { key: 'B', text: 'Kediri' },
        { key: 'C', text: 'Madiun' },
        { key: 'D', text: 'Surabaya' },
      ],
    },
    {
      id: cqBase + '005', madrasah_id: null, subject: 'Bahasa Inggris', question_type: 'multiple_choice',
      question_text: 'The opposite of "happy" is ...', difficulty: 'sedang', is_active: true,
      correct_answer: 'B',
      options: [
        { key: 'A', text: 'Glad' },
        { key: 'B', text: 'Sad' },
        { key: 'C', text: 'Angry' },
        { key: 'D', text: 'Tired' },
      ],
    },
  ]

  return {
    madrasas: [
      { id: madrasahId, name: 'MTs Negeri 1 Jember', npsn: '12345678', address: 'Jl. Imam Bonjol No. 1, Jember', head_master_name: 'Drs. H. Suparman, M.Pd', created_at: now },
    ],
    profiles: [
      { id: adminId, madrasah_id: madrasahId, full_name: 'Admin Madrasah', role: 'admin_madrasah', created_at: now },
      { id: guruId, madrasah_id: madrasahId, full_name: 'Guru Demontrasi', role: 'guru', created_at: now },
      { id: siswaId, madrasah_id: madrasahId, full_name: 'Siswa Demo', role: 'siswa', student_id: 'std-001', created_at: now },
    ],
    teachers: [
      { id: 'tch-001', madrasah_id: madrasahId, profile_id: guruId, nip: '198501012010011001', full_name: 'Guru Demontrasi', subject: 'Bahasa Indonesia', status: 'active', created_at: now },
    ],
    students,
    classes: [
      { id: class1Id, madrasah_id: madrasahId, name: '7A', level: '7', is_active: true, created_at: now },
      { id: class2Id, madrasah_id: madrasahId, name: '7B', level: '7', is_active: true, created_at: now },
    ],
    class_members: [],
    assessment_periods: [
      { id: periodId, madrasah_id: madrasahId, name: 'TA 2025/2026', academic_year: '2025/2026', semester: 'ganjil', is_active: true, created_at: now },
    ],
    instruments: [
      { id: instr1Id, madrasah_id: null, title: 'Minat Belajar', description: 'Mengukur tingkat minat belajar siswa', type: 'likert', scale_min: 1, scale_max: 4, is_active: true, created_at: now },
      { id: instr2Id, madrasah_id: null, title: 'Preferensi Gaya Belajar', description: 'Mengidentifikasi gaya belajar siswa', type: 'likert', scale_min: 1, scale_max: 4, is_active: true, created_at: now },
    ],
    instrument_items: [...minatItems, ...gayaItems],
    questions: [],
    question_options: [],
    cognitive_questions: cognitiveQuestions,
    cognitive_options: [],
    assessment_assignments: [],
    assessment_responses: [],
    assessment_results: [],
    result_summary: [],
    teacher_observations: [],
    follow_ups: [],
    activation_codes: [
      { id: 'ac-001', code: 'SIDIAG-PRO-2026', tier: 'pro', used: false, created_at: now },
      { id: 'ac-002', code: 'SIDIAG-DEMO-2026', tier: 'demo', used: false, created_at: now },
    ],
    activity_logs: [
      { id: 'log-001', user_id: null, action: 'system', entity: 'system', entity_id: null, description: 'Sistem diinisialisasi dengan data demo', created_at: now },
    ],
  }
}

/** Registered users seed (for login). */
export function getSeedUsers() {
  const now = new Date().toISOString()
  return [
    { id: 'usr-admin', username: 'admin', nama: 'Admin Sistem', password: 'admin123', role: 'admin', madrasah_id: 'mrd-001', created_at: now },
    { id: 'usr-madrasah', username: 'madrasah', nama: 'Admin Madrasah', password: 'madrasah123', role: 'madrasah', madrasah_id: 'mrd-001', created_at: now },
    { id: 'usr-siswa', username: 'siswa', nama: 'Siswa Demo', password: 'siswa123', role: 'siswa', madrasah_id: 'mrd-001', student_id: 'std-001', created_at: now },
  ]
}
