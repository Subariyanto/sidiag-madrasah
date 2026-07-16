import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
const APP_NAME = 'SiDIAG Madrasah'
const ORGANIZER_NAME = ''

/**
 * Membuat laporan hasil asesmen siswa dalam format PDF, lengkap dengan
 * kop madrasah dan QR Code verifikasi. Disclaimer WAJIB disertakan persis
 * sesuai teks yang diberikan (lihat pemanggil fungsi ini).
 */
export async function generateResultPDF({ student, result, disclaimer }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40

  // Kop madrasah
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(student?.madrasa?.name || 'Madrasah', margin, 50)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(student?.madrasa?.address || '', margin, 65)
  doc.text(`Kepala Madrasah: ${student?.madrasa?.head_master_name || '-'}`, margin, 78)
  doc.setDrawColor(30, 58, 138)
  doc.setLineWidth(1.5)
  doc.line(margin, 86, pageWidth - margin, 86)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 138)
  doc.text('LAPORAN HASIL ASESMEN SISWA', pageWidth / 2, 110, { align: 'center' })
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.text(`${APP_NAME}${ORGANIZER_NAME ? ' - ' + ORGANIZER_NAME : ''}`, pageWidth / 2, 124, { align: 'center' })

  // Info siswa
  autoTable(doc, {
    startY: 140,
    theme: 'plain',
    styles: { fontSize: 10 },
    body: [
      ['Nama Siswa', ':', student?.full_name || '-'],
      ['NIS / NISN', ':', `${student?.nis || '-'} / ${student?.nisn || '-'}`],
      ['Kelas', ':', student?.class?.name || '-'],
      ['Instrumen', ':', result?.assignment?.instrument?.title || '-'],
      ['Tanggal Pengerjaan', ':', result?.created_at ? new Date(result.created_at).toLocaleDateString('id-ID') : '-'],
    ],
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 15 } },
  })

  // Hasil kecenderungan
  const finalY = doc.lastAutoTable.finalY + 15
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Hasil Kecenderungan / Preferensi', margin, finalY)

  const rows = Object.entries(result?.result_summary || {}).map(([dim, val]) => [dim, `${val}%`])
  autoTable(doc, {
    startY: finalY + 8,
    head: [['Dimensi', 'Persentase Kecenderungan']],
    body: rows.length > 0 ? rows : [['-', '-']],
    headStyles: { fillColor: [30, 58, 138] },
    styles: { fontSize: 10 },
  })

  let y = doc.lastAutoTable.finalY + 20

  if (result?.needs_professional_review) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(220, 38, 38)
    const warning = doc.splitTextToSize(
      'Peringatan: hasil ini menunjukkan indikasi yang perlu ditinjau oleh Guru BK. Kategori ini bukan keputusan otomatis sistem.',
      pageWidth - margin * 2
    )
    doc.text(warning, margin, y)
    y += warning.length * 12 + 10
    doc.setTextColor(0, 0, 0)
  }

  // Disclaimer wajib
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2)
  doc.text(disclaimerLines, margin, y)
  y += disclaimerLines.length * 10 + 15

  // QR Code verifikasi
  try {
    const verificationPayload = JSON.stringify({
      app: APP_NAME,
      student_id: student?.id,
      result_id: result?.id,
      generated_at: new Date().toISOString(),
    })
    const qrDataUrl = await QRCode.toDataURL(verificationPayload, { width: 120, margin: 1 })
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 80, y, 80, 80)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Scan untuk verifikasi laporan', pageWidth - margin - 80, y + 90)
  } catch {
    // Jika QR gagal dibuat, laporan tetap dihasilkan tanpa QR
  }

  const fileName = `Laporan-Asesmen-${(student?.full_name || 'siswa').replace(/\s+/g, '-')}.pdf`
  doc.save(fileName)
}
