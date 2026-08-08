import { readFileSync } from 'fs'
import { join } from 'path'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export type TagihanForPdf = {
  id: string
  nomorTagihan?: string | null
  keterangan: string
  nominal: number | string
  periodeSewa?: string | null
  mulaiSewa: Date | string
  selesaiSewa: Date | string
  syaratKetentuan?: string | null
  penyewa?: {
    nama: string
    nomorTelepon?: string | null
    email?: string | null
  } | null
  itemAset?: { nama: string } | null
  aset?: { nama: string } | null

  /** Alamat dari profil user penyewa, hanya diisi kalau aset mewajibkannya */
  alamatPemesan?: string | null

  /** Nama usaha pemilik aset, diambil dari tabel company */
  namaUsaha?: string | null
}

// Baca logo Bantu Sewa sekali lalu cache sebagai data URI (server-side)
let logoDataUrl: string | null | undefined

const getLogoDataUrl = (): string | null => {
  if (logoDataUrl !== undefined) return logoDataUrl

  try {
    const logoPath = join(process.cwd(), 'public', 'images', 'bantu-sewa', 'Logo_Bantu_Sewa_512.png')
    const buffer = readFileSync(logoPath)

    logoDataUrl = `data:image/png;base64,${buffer.toString('base64')}`
  } catch {
    logoDataUrl = null
  }

  return logoDataUrl
}

const formatRupiah = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num

  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

const formatDate = (d: Date | string): string =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

export function generateBookingPdf(tagihan: TagihanForPdf): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const primaryColor: [number, number, number] = [99, 89, 233]
  const successColor: [number, number, number] = [40, 167, 69]
  const grayText: [number, number, number] = [108, 117, 125]
  const lightGray: [number, number, number] = [245, 245, 248]
  const darkText: [number, number, number] = [33, 37, 41]
  const borderColor: [number, number, number] = [220, 220, 228]

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentW = pageW - margin * 2

  const mulai = formatDate(tagihan.mulaiSewa)
  const selesai = formatDate(tagihan.selesaiSewa)
  const periodeSewa = tagihan.periodeSewa
    ? tagihan.periodeSewa.charAt(0).toUpperCase() + tagihan.periodeSewa.slice(1)
    : 'Harian'

  // Header card
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, 15, contentW, 30, 2, 2, 'F')

  // Logo Bantu Sewa
  const logo = getLogoDataUrl()
  const textX = logo ? margin + 22 : margin + 5

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin + 5, 22, 14, 14)
    } catch {
      /* abaikan jika gagal memuat logo */
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...darkText)
  doc.text('Bantu Sewa', textX, 27)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...grayText)
  doc.text('Platform Manajemen Sewa', textX, 34)

  // LUNAS badge
  const rightX = pageW - margin - 5

  doc.setFillColor(...successColor)
  doc.roundedRect(rightX - 22, 27, 22, 7, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.text('Lunas', rightX - 11, 32, { align: 'center' })

  // Info Transaksi
  let y = 56
  const labelX = margin
  const valueX = margin + 42

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grayText)
  doc.text('ID Pemesanan', labelX, y)
  doc.setTextColor(...darkText)
  doc.setFont('helvetica', 'bold')
  doc.text(tagihan.nomorTagihan || '-', valueX, y)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayText)
  doc.text('ID Transaksi', labelX, y)
  doc.setTextColor(...darkText)
  doc.setFont('helvetica', 'bold')
  doc.text(tagihan.id, valueX, y)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayText)
  doc.text('Tanggal Pembayaran', labelX, y)
  doc.setTextColor(...darkText)
  doc.setFont('helvetica', 'bold')
  doc.text(mulai, valueX, y)

  if (tagihan.namaUsaha) {
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayText)
    doc.text('Nama Usaha', labelX, y)
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.text(tagihan.namaUsaha, valueX, y)
  }

  y += 10
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // Pemesan
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...grayText)
  doc.text('PEMESAN', margin, y)

  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...darkText)
  doc.text(tagihan.penyewa?.nama || '-', margin, y)

  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grayText)
  if (tagihan.penyewa?.nomorTelepon) { doc.text(tagihan.penyewa.nomorTelepon, margin, y); y += 6 }
  if (tagihan.penyewa?.email) { doc.text(tagihan.penyewa.email, margin, y); y += 6 }

  // Alamat bisa panjang, jadi dipecah mengikuti lebar halaman
  if (tagihan.alamatPemesan) {
    const barisAlamat = doc.splitTextToSize(tagihan.alamatPemesan, pageW - margin * 2)

    doc.text(barisAlamat, margin, y)
    y += barisAlamat.length * 5 + 1
  }

  // Divider
  y += 3
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // Table ITEM | JUMLAH
  const namaItem = tagihan.itemAset?.nama || tagihan.keterangan || '-'
  const itemContent = `${namaItem}\n${periodeSewa}\n${mulai} - ${selesai}`

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['ITEM', 'JUMLAH']],
    body: [[
      { content: itemContent, styles: { fontSize: 10, textColor: darkText } },
      { content: formatRupiah(Number(tagihan.nominal)), styles: { halign: 'right', fontSize: 10, textColor: primaryColor, fontStyle: 'bold' } }
    ]],
    headStyles: { fillColor: lightGray, textColor: grayText, fontSize: 8, fontStyle: 'bold', lineColor: borderColor, lineWidth: 0.3 },
    bodyStyles: { fontSize: 10, textColor: darkText, minCellHeight: 16 },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 45, halign: 'right' } },
    theme: 'plain',
    tableLineColor: borderColor,
    tableLineWidth: 0.3
  })

  // Total
  y = (doc as any).lastAutoTable.finalY + 6
  const totalLabelX = pageW - margin - 60
  const totalValX = pageW - margin

  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.4)
  doc.line(totalLabelX, y, totalValX, y)
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...darkText)
  doc.text('Total', totalLabelX, y)
  doc.setTextColor(...primaryColor)
  doc.setFontSize(13)
  doc.text(formatRupiah(Number(tagihan.nominal)), totalValX, y, { align: 'right' })

  const footerY = doc.internal.pageSize.getHeight() - 15

  // Syarat & Ketentuan
  const syarat = (tagihan.syaratKetentuan || '').trim()

  if (syarat) {
    y += 16

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...darkText)
    doc.text('Syarat & Ketentuan', margin, y)
    y += 6

    // Helper: tulis teks dengan wrapping + pindah halaman bila perlu
    const writeWrapped = (text: string, x: number, maxWidth: number, lineHeight = 4.5) => {
      const wrapped: string[] = doc.splitTextToSize(text, maxWidth)

      for (const line of wrapped) {
        if (y > footerY - 8) {
          doc.addPage()
          y = 20
        }

        doc.text(line, x, y)
        y += lineHeight
      }
    }

    // Coba parse sebagai poin terstruktur (JSON), fallback ke teks biasa
    type SKPoint = { text?: string; subPoin?: { text?: string }[] }
    let points: SKPoint[] | null = null

    try {
      const parsed = JSON.parse(syarat)

      if (Array.isArray(parsed)) points = parsed as SKPoint[]
    } catch {
      points = null
    }

    if (points) {
      points.forEach((poin, i) => {
        // Judul poin (1. 2. 3.)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(...darkText)
        writeWrapped(`${i + 1}. ${poin.text || ''}`, margin, contentW)

        // Sub poin (a. b. c.)
        if (Array.isArray(poin.subPoin) && poin.subPoin.length > 0) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(...grayText)
          poin.subPoin.forEach((sub, j) => {
            const letter = String.fromCharCode(97 + (j % 26))

            writeWrapped(`${letter}. ${sub.text || ''}`, margin + 6, contentW - 6, 4.2)
          })
        }

        y += 2
      })
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...grayText)
      writeWrapped(syarat, margin, contentW)
    }
  }

  // Footer

  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...grayText)
  const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  doc.text(`Dicetak: ${printDate}`, margin, footerY)
  doc.text('Bantu Sewa — Platform Manajemen Sewa', pageW - margin, footerY, { align: 'right' })

  return doc.output('arraybuffer')
}
