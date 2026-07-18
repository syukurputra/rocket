import fs from 'fs'
import path from 'path'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function getLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public/images/bantu-sewa/Logo_Bantu_Sewa_512.png')

    return fs.readFileSync(logoPath).toString('base64')
  } catch {
    return null
  }
}

export type InvoiceForPdf = {
  nomorInvoice: string
  tanggalInvoice: Date | string
  tanggalBayar?: Date | string | null
  subtotal: number | string
  total: number | string
  billingCycle: string
  paket?: { nama: string } | null
  company?: {
    nama: string
    alamat?: string | null
    email?: string | null
  } | null
}

const formatRupiah = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num

  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

const formatDate = (d: Date | string): string =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

export function generateInvoicePdf(invoice: InvoiceForPdf): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const primaryColor: [number, number, number] = [99, 89, 233]
  const successColor: [number, number, number] = [40, 167, 69]
  const grayColor: [number, number, number] = [108, 117, 125]
  const lightGray: [number, number, number] = [248, 249, 250]
  const darkText: [number, number, number] = [33, 37, 41]

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20

  // Header bar
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageW, 35, 'F')

  // Logo — ukuran sesuai tinggi blok teks (title baseline y=16, subtitle y=23)
  const logoBase64 = getLogoBase64()
  const logoSize = 13       // ≈ tinggi blok teks (12pt cap-height + subtitle)
  const logoX = margin
  const logoY = 11.5        // rata atas dengan cap-height "Bantu Sewa"

  if (logoBase64) {
    doc.setFillColor(255, 255, 255)
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 0.5, 'F')
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', logoX, logoY, logoSize, logoSize)
  }

  const textX = logoBase64 ? logoX + logoSize + 3 : margin

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Bantu Sewa', textX, 16)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Platform Manajemen Sewa', textX, 23)

  // LUNAS badge
  doc.setFillColor(...successColor)
  doc.roundedRect(pageW - margin - 30, 10, 30, 12, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('LUNAS', pageW - margin - 15, 18, { align: 'center' })

  // Title
  doc.setTextColor(...darkText)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Bukti Pembayaran Invoice', margin, 50)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text(invoice.nomorInvoice, margin, 57)

  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(margin, 60, pageW - margin, 60)

  // Date info box
  let y = 68
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, y, pageW - margin * 2, 24, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...grayColor)
  doc.text('TANGGAL INVOICE', margin + 4, y + 7)
  doc.text('TANGGAL BAYAR', pageW / 2, y + 7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkText)
  doc.setFontSize(9)
  doc.text(formatDate(invoice.tanggalInvoice), margin + 4, y + 16)
  doc.text(invoice.tanggalBayar ? formatDate(invoice.tanggalBayar) : '-', pageW / 2, y + 16)

  // Bill to
  y += 34
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  doc.text('DITAGIHKAN KEPADA', margin, y)
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...darkText)
  doc.text(invoice.company?.nama || '-', margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  if (invoice.company?.alamat) { doc.text(invoice.company.alamat, margin, y); y += 5 }
  if (invoice.company?.email) { doc.text(invoice.company.email, margin, y); y += 5 }

  // Table
  y += 6
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['PAKET', 'SIKLUS', 'QTY', 'HARGA']],
    body: [[
      invoice.paket?.nama || '-',
      invoice.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan',
      '1',
      formatRupiah(invoice.subtotal)
    ]],
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: darkText },
    columnStyles: { 3: { halign: 'right' } },
    theme: 'striped',
    alternateRowStyles: { fillColor: lightGray }
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // Summary
  const summaryX = pageW / 2

  doc.setFillColor(...lightGray)
  doc.rect(summaryX, y, pageW / 2 - margin, 36, 'F')

  const rows = [
    { label: 'Subtotal', val: formatRupiah(invoice.subtotal) }
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  rows.forEach(r => {
    doc.text(r.label, summaryX + 4, y + 8)
    doc.text(r.val, pageW - margin - 2, y + 8, { align: 'right' })
    y += 10
  })

  doc.setDrawColor(...grayColor)
  doc.setLineWidth(0.3)
  doc.line(summaryX + 2, y + 2, pageW - margin - 2, y + 2)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...darkText)
  doc.text('TOTAL', summaryX + 4, y + 10)
  doc.setTextColor(...primaryColor)
  doc.setFontSize(11)
  doc.text(formatRupiah(invoice.total), pageW - margin - 2, y + 10, { align: 'right' })

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20

  doc.setDrawColor(...grayColor)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...grayColor)
  const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  doc.text(`Dicetak: ${printDate}`, margin, footerY)
  doc.text('Bantu Sewa — Platform Manajemen Sewa', pageW - margin, footerY, { align: 'right' })

  return doc.output('arraybuffer')
}
