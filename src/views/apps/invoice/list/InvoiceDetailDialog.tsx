'use client'

import { useState, useEffect } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import dayjs from 'dayjs'

import type { InvoiceClient, InvoiceStatus } from '@/src/types/apps/invoiceTypes'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import tableStyles from '@core/styles/table.module.css'

const statusColors: Record<InvoiceStatus, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  PENDING: 'warning',
  KONFIRMASI: 'info',
  PAID: 'success',
  CANCELLED: 'error',
  EXPIRED: 'default'
}

const statusLabels: Record<InvoiceStatus, string> = {
  PENDING: 'Menunggu Pembayaran',
  KONFIRMASI: 'Konfirmasi Pembayaran',
  PAID: 'Lunas',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kadaluarsa'
}

const formatRupiah = (num: number | string) => {
  const n = typeof num === 'string' ? parseFloat(num) : num

  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

const downloadInvoicePdf = async (invoice: InvoiceClient) => {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

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

  // ── Header card (gray bg, like dialog) ────────────────────────────────────
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, 15, contentW, 30, 2, 2, 'F')

  // Left: Bantu Sewa
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...darkText)
  doc.text('Bantu Sewa', margin + 5, 27)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...grayText)
  doc.text('Platform Manajemen Sewa', margin + 5, 34)

  // Right: Lunas badge centered in header card
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
  doc.text('ID Invoice', labelX, y)
  doc.setTextColor(...darkText)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.nomorInvoice, valueX, y)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayText)
  doc.text('Tanggal Invoice', labelX, y)
  doc.setTextColor(...darkText)
  doc.setFont('helvetica', 'bold')
  doc.text(dayjs(invoice.tanggalInvoice).format('DD MMMM YYYY'), valueX, y)

  if (invoice.tanggalBayar) {
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayText)
    doc.text('Tanggal Bayar', labelX, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...successColor)
    doc.text(dayjs(invoice.tanggalBayar).format('DD MMMM YYYY'), valueX, y)
  }

  y += 10
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ── DITAGIHKAN KEPADA ──────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...grayText)
  doc.text('DITAGIHKAN KEPADA', margin, y)
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...darkText)
  doc.text((invoice as any).company?.nama || '-', margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...grayText)
  if ((invoice as any).company?.alamat) { doc.text((invoice as any).company.alamat, margin, y); y += 5 }
  if ((invoice as any).company?.email) { doc.text((invoice as any).company.email, margin, y); y += 5 }

  // ── Divider ────────────────────────────────────────────────────────────────
  y += 4
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // ── Tabel PAKET | SIKLUS | HARGA ──────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['PAKET', 'SIKLUS', 'HARGA']],
    body: [[(invoice as any).paket?.nama || '-', invoice.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan', formatRupiah(invoice.subtotal)]],
    headStyles: {
      fillColor: lightGray,
      textColor: grayText,
      fontSize: 8,
      fontStyle: 'bold',
      lineColor: borderColor,
      lineWidth: 0.3
    },
    bodyStyles: { fontSize: 10, textColor: darkText },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 35 },
      2: { halign: 'right', textColor: primaryColor, fontStyle: 'bold' }
    },
    theme: 'plain',
    tableLineColor: borderColor,
    tableLineWidth: 0.3
  })

  // ── Summary ────────────────────────────────────────────────────────────────
  y = (doc as any).lastAutoTable.finalY + 8
  const summaryLabelX = pageW - margin - 60
  const summaryValX = pageW - margin

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grayText)
  doc.text('Subtotal', summaryLabelX, y)
  doc.text(formatRupiah(invoice.subtotal), summaryValX, y, { align: 'right' })
  y += 7
  doc.text('PPN (11%)', summaryLabelX, y)
  doc.text(formatRupiah(invoice.pajak), summaryValX, y, { align: 'right' })
  y += 4
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(summaryLabelX, y, summaryValX, y)
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...darkText)
  doc.text('Total', summaryLabelX, y)
  doc.setTextColor(...primaryColor)
  doc.setFontSize(13)
  doc.text(formatRupiah(invoice.total), summaryValX, y, { align: 'right' })

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...grayText)
  const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Dicetak: ${printDate}`, margin, footerY)
  doc.text('Bantu Sewa — Platform Manajemen Sewa', pageW - margin, footerY, { align: 'right' })

  doc.save(`Bukti Bayar Paket.pdf`)
}

interface Props {
  open: boolean
  invoiceId: string | null
  onClose: () => void
  onUpdated: () => void
}

const InvoiceDetailDialog = ({ open, invoiceId, onClose, onUpdated }: Props) => {
  const [invoice, setInvoice] = useState<InvoiceClient | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  useEffect(() => {
    if (!open || !invoiceId) return

    const fetch = async () => {
      try {
        setLoading(true)
        const result = await apiFetchClient<{ data: InvoiceClient }>(
          `/api/invoice/${invoiceId}`,
          undefined,
          { redirectOn401: '/login' }
        )

        setInvoice(result.data)
      } catch {
        showSnack('Gagal memuat data invoice', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceId])

  const handleCheckTransaction = async () => {
    if (!invoice) return
    try {
      setChecking(true)
      const result = await apiFetchClient<{ data: InvoiceClient; message: string }>(
        `/api/invoice/${invoice.id}/check`,
        { method: 'POST' },
        { redirectOn401: '/login' }
      )

      setInvoice(result.data)

      if (result.data.status === 'PAID') {
        showSnack(result.message || 'Pembayaran berhasil!', 'success')
        onUpdated()
      } else {
        showSnack(`${result.message}. Mengalihkan ke halaman pembayaran...`, 'warning')
        setTimeout(() => {
          if (result.data.paymentUrl) window.location.href = result.data.paymentUrl
        }, 1500)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengecek transaksi'

      showSnack(`${msg}. Mengalihkan ke halaman pembayaran...`, 'error')
      setTimeout(() => {
        if (invoice?.paymentUrl) window.location.href = invoice.paymentUrl
      }, 1500)
    } finally {
      setChecking(false)
    }
  }

  const status = invoice?.status as InvoiceStatus
  const isPaid = status === 'PAID'

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='body'>
        <DialogTitle sx={{ pb: 0 }}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex flex-col items-center justify-center bg-primary rounded p-2'>
                <i className='tabler-file-invoice text-white text-xl' />
              </div>
              <div>
                <Typography variant='h5'>Detail Invoice</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {invoice?.nomorInvoice || '—'}
                </Typography>
              </div>
            </div>
            <IconButton onClick={onClose}>
              <i className='tabler-x' />
            </IconButton>
          </div>
        </DialogTitle>

        <Divider sx={{ mt: 3 }} />

        <DialogContent sx={{ pt: 4 }}>
          {loading || !invoice ? (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={5}>
              {/* Left: Invoice content */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Card variant='outlined'>
                  <CardContent sx={{ p: 4 }}>
                    {/* Header */}
                    <Box className='p-4 rounded mb-4' sx={{ bgcolor: 'action.hover' }}>
                      <div className='flex justify-between items-start gap-4 flex-wrap'>
                        <div>
                          <Typography variant='h6' fontWeight={700} color='primary'>Bantu Sewa</Typography>
                          <Typography variant='body2' color='text.secondary'>Platform Manajemen Sewa</Typography>
                        </div>
                        <div className='flex flex-col items-end gap-1'>
                          <div className='flex items-center gap-2'>
                            <Typography variant='body2' fontWeight={600}>{invoice.nomorInvoice}</Typography>
                            <Chip label={statusLabels[status] ?? status} color={statusColors[status] ?? 'default'} size='small' variant='tonal' />
                          </div>
                          <Typography variant='caption' color='text.secondary'>
                            {dayjs(invoice.tanggalInvoice).format('DD MMMM YYYY')}
                          </Typography>
                          {invoice.tanggalBayar && (
                            <Typography variant='caption' color='success.main'>
                              Dibayar: {dayjs(invoice.tanggalBayar).format('DD MMMM YYYY')}
                            </Typography>
                          )}
                        </div>
                      </div>
                    </Box>

                    {/* Ditagihkan kepada */}
                    <div className='flex flex-col gap-1 mb-4'>
                      <Typography variant='body2' color='text.secondary' fontWeight={600}>DITAGIHKAN KEPADA</Typography>
                      <Typography fontWeight={500}>{(invoice as any).company?.nama || '-'}</Typography>
                      {(invoice as any).company?.alamat && (
                        <Typography variant='body2' color='text.secondary'>{(invoice as any).company.alamat}</Typography>
                      )}
                      {(invoice as any).company?.email && (
                        <Typography variant='body2' color='text.secondary'>{(invoice as any).company.email}</Typography>
                      )}
                    </div>

                    <Divider sx={{ my: 3 }} />

                    {/* Tabel item */}
                    <div className='border rounded overflow-hidden mb-4'>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                            <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                              <Typography variant='caption' fontWeight={600}>PAKET</Typography>
                            </th>
                            <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                              <Typography variant='caption' fontWeight={600}>SIKLUS</Typography>
                            </th>
                            <th style={{ padding: '10px 16px', textAlign: 'right' }}>
                              <Typography variant='caption' fontWeight={600}>HARGA</Typography>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '12px 16px' }}>
                              <Typography fontWeight={500}>{(invoice as any).paket?.nama || '-'}</Typography>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <Chip label={invoice.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'} color='primary' size='small' variant='tonal' />
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <Typography fontWeight={600} color='primary.main'>{formatRupiah(invoice.subtotal)}</Typography>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Summary */}
                    <div className='flex justify-end'>
                      <div style={{ minWidth: 220 }}>
                        <div className='flex justify-between'>
                          <Typography color='text.secondary'>Subtotal</Typography>
                          <Typography>{formatRupiah(invoice.subtotal)}</Typography>
                        </div>
                        <div className='flex justify-between'>
                          <Typography color='text.secondary'>PPN (11%)</Typography>
                          <Typography>{formatRupiah(invoice.pajak)}</Typography>
                        </div>
                        <Divider sx={{ my: 1 }} />
                        <div className='flex justify-between items-center'>
                          <Typography variant='h6' fontWeight={600}>Total</Typography>
                          <Typography variant='h5' color='primary.main' fontWeight={700}>{formatRupiah(invoice.total)}</Typography>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right: Actions */}
              <Grid size={{ xs: 12, md: 4 }}>
                <div className='flex flex-col gap-3'>
                  {/* PAID */}
                  {isPaid && (
                    <>
                      <Box
                        className='p-2 rounded flex items-center gap-3'
                        sx={{ bgcolor: 'primary.light', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1 }}
                        onClick={async () => {
                          if (downloading) return
                          try {
                            setDownloading(true)
                            await downloadInvoicePdf(invoice)
                          } catch {
                            showSnack('Gagal mengunduh bukti pembayaran', 'error')
                          } finally {
                            setDownloading(false)
                          }
                        }}
                      >
                        {downloading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : <i className='tabler-download text-white text-2xl' />}
                        <Typography color='white' fontWeight={600}>
                          {downloading ? 'Menyiapkan...' : 'Download Bukti'}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {/* Belum PAID */}
                  {!isPaid && (
                    <Button
                      fullWidth
                      variant='contained'
                      color='primary'
                      size='large'
                      disabled={checking}
                      startIcon={checking ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-refresh' />}
                      onClick={handleCheckTransaction}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {checking ? 'Mengecek...' : 'Check Transaksi'}
                    </Button>
                  )}

                  <Divider />

                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-2'>
                      <i className='tabler-shield-check text-success' />
                      <Typography variant='caption' color='text.secondary'>Transaksi aman & terenkripsi</Typography>
                    </div>
                    <div className='flex items-center gap-2'>
                      <i className='tabler-headset text-primary' />
                      <Typography variant='caption' color='text.secondary'>Butuh bantuan? Hubungi kami</Typography>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    variant='tonal'
                    color='secondary'
                    onClick={onClose}
                    startIcon={<i className='tabler-arrow-left' />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Kembali
                  </Button>
                </div>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default InvoiceDetailDialog
