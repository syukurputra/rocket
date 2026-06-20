'use client'

import { useState } from 'react'

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

import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

const downloadBuktiPembayaran = async (tagihan: TagihanBooking) => {
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

  const formatRp = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

  const mulai = new Date(tagihan.mulaiSewa).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const selesai = new Date(tagihan.selesaiSewa).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const periodeSewa = tagihan.periodeSewa
    ? tagihan.periodeSewa.charAt(0).toUpperCase() + tagihan.periodeSewa.slice(1)
    : 'Harian'

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

  // Right: label + badge + tanggal
  const rightX = pageW - margin - 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkText)
  doc.text('Tagihan Booking', rightX - 26, 23, { align: 'right' })

  doc.setFillColor(...successColor)
  doc.roundedRect(rightX - 22, 18, 22, 7, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.text('Lunas', rightX - 11, 23, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...grayText)
  doc.text(`${mulai} s/d ${selesai}`, rightX, 33, { align: 'right' })

  // ── PEMESAN ────────────────────────────────────────────────────────────────
  let y = 56
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

  // ── Divider ────────────────────────────────────────────────────────────────
  y += 3
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // ── Tabel ITEM | JUMLAH ────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['ITEM', 'JUMLAH']],
    body: [[
      { content: `${tagihan.keterangan}\n${periodeSewa}`, styles: { fontSize: 10, textColor: darkText } },
      { content: formatRp(Number(tagihan.nominal)), styles: { halign: 'right', fontSize: 10, textColor: primaryColor, fontStyle: 'bold' } }
    ]],
    headStyles: {
      fillColor: lightGray,
      textColor: grayText,
      fontSize: 8,
      fontStyle: 'bold',
      lineColor: borderColor,
      lineWidth: 0.3
    },
    bodyStyles: { fontSize: 10, textColor: darkText, minCellHeight: 16 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 45, halign: 'right' }
    },
    theme: 'plain',
    tableLineColor: borderColor,
    tableLineWidth: 0.3
  })

  // ── Total ──────────────────────────────────────────────────────────────────
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
  doc.text(formatRp(Number(tagihan.nominal)), totalValX, y, { align: 'right' })

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

  doc.save('Bukti Bayar Booking.pdf')
}

type TagihanBooking = {
  id: string
  keterangan: string
  nominal: number
  status: string
  periodeSewa?: string | null
  mulaiSewa: string
  selesaiSewa: string
  metodeBayar?: string | null
  buktiPembayaran?: string | null
  ipaymuSessionId?: string | null
  aset?: { id: string; nama: string } | null
  ruangan?: { id: string; nama: string } | null
  penyewa?: {
    id: string
    nama: string
    nomorTelepon?: string
    email?: string
  }
}

interface Props {
  open: boolean
  onClose: () => void
  tagihan: TagihanBooking | null
  onPaid: () => void
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

const BookingDetailDialog = ({ open, onClose, tagihan, onPaid }: Props) => {
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [checking, setChecking] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  const isLunas = tagihan?.status === 'LUNAS'
  const isCancelled = tagihan?.status === 'DIBATALKAN'

  const handleBayar = async () => {
    try {
      setPaying(true)

      const result = await apiFetchClient<{ data: { paymentUrl: string } }>(
        '/api/tagihan/payment',
        {
          method: 'POST',
          body: JSON.stringify({ tagihanId: tagihan?.id })
        },
        { redirectOn401: '/login' }
      )

      if (result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl
      } else {
        throw new Error('Payment URL tidak ditemukan')
      }
    } catch (err) {
      showSnack(err instanceof Error ? err.message : 'Gagal membuat link pembayaran', 'error')
      setPaying(false)
    }
  }

  const handleCheckTransaction = async () => {
    try {
      setChecking(true)

      const result = await apiFetchClient<{ data: { status: string }; message: string }>(
        `/api/tagihan/${tagihan?.id}/check`,
        { method: 'POST' },
        { redirectOn401: '/login' }
      )

      if (result.data?.status === 'LUNAS') {
        showSnack(result.message || 'Pembayaran berhasil!', 'success')
        setTimeout(() => { onPaid(); onClose() }, 1200)
      } else {
        showSnack(result.message || 'Transaksi belum selesai', 'warning')
      }
    } catch (err) {
      showSnack(err instanceof Error ? err.message : 'Gagal mengecek transaksi', 'error')
    } finally {
      setChecking(false)
    }
  }

  const handleBatal = async () => {
    try {
      setCancelling(true)

      await apiFetchClient(
        `/api/tagihan/${tagihan?.id}`,
        { method: 'PUT', body: JSON.stringify({ status: 'DIBATALKAN' }) },
        { redirectOn401: '/login' }
      )

      showSnack('Booking berhasil dibatalkan', 'success')
      setConfirmCancel(false)
      setTimeout(() => {
        onPaid() // refresh list
        onClose()
      }, 1000)
    } catch (err) {
      showSnack(err instanceof Error ? err.message : 'Gagal membatalkan booking', 'error')
    } finally {
      setCancelling(false)
    }
  }

  if (!tagihan) return null

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='body'>
        <DialogTitle sx={{ pb: 0 }}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex flex-col items-center justify-center bg-primary rounded p-2'>
                <i className='tabler-receipt text-white text-xl' />
              </div>
              <div>
                <Typography variant='h5'>Detail Booking</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {tagihan.aset?.nama} — {tagihan.ruangan?.nama}
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
          <Grid container spacing={5}>
            {/* Left: Detail */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card variant='outlined'>
                <CardContent sx={{ p: 4 }}>
                  {/* Header */}
                  <Box className='p-4 rounded mb-4' sx={{ bgcolor: 'action.hover' }}>
                    <div className='flex justify-between items-start gap-4 flex-wrap'>
                      <div>
                        <Typography variant='h6' fontWeight={700} color='primary'>
                          Bantu Sewa
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Platform Manajemen Sewa
                        </Typography>
                      </div>
                      <div className='flex flex-col items-end gap-1'>
                        <div className='flex items-center gap-2'>
                          <Typography variant='body2' fontWeight={600}>Tagihan Booking</Typography>
                          <Chip
                            label={isLunas ? 'Lunas' : 'Belum Terbayar'}
                            color={isLunas ? 'success' : 'warning'}
                            size='small'
                            variant='tonal'
                          />
                        </div>
                        <Typography variant='caption' color='text.secondary'>
                          {formatDate(tagihan.mulaiSewa)} s/d {formatDate(tagihan.selesaiSewa)}
                        </Typography>
                      </div>
                    </div>
                  </Box>

                  {/* Pemesan */}
                  <div className='flex flex-col gap-2 mb-4'>
                    <Typography variant='body2' color='text.secondary' fontWeight={600}>PEMESAN</Typography>
                    <Typography fontWeight={500}>{tagihan.penyewa?.nama || '-'}</Typography>
                    {tagihan.penyewa?.nomorTelepon && (
                      <Typography variant='body2' color='text.secondary'>{tagihan.penyewa.nomorTelepon}</Typography>
                    )}
                    {tagihan.penyewa?.email && (
                      <Typography variant='body2' color='text.secondary'>{tagihan.penyewa.email}</Typography>
                    )}
                  </div>

                  <Divider sx={{ my: 3 }} />

                  {/* Item */}
                  <div className='border rounded overflow-hidden mb-4'>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                          <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                            <Typography variant='caption' fontWeight={600}>ITEM</Typography>
                          </th>
                          <th style={{ padding: '10px 16px', textAlign: 'right' }}>
                            <Typography variant='caption' fontWeight={600}>JUMLAH</Typography>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '12px 16px' }}>
                            <Typography fontWeight={500}>{tagihan.keterangan}</Typography>
                            {tagihan.periodeSewa && (
                              <Chip
                                label={tagihan.periodeSewa}
                                size='small'
                                variant='tonal'
                                sx={{ mt: 0.5, textTransform: 'capitalize' }}
                              />
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <Typography fontWeight={600} color='primary.main'>
                              {formatCurrency(tagihan.nominal)}
                            </Typography>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Total */}
                  <div className='flex justify-end'>
                    <div style={{ minWidth: 200 }}>
                      <Divider sx={{ mb: 1 }} />
                      <div className='flex justify-between items-center'>
                        <Typography variant='h6' fontWeight={600}>Total</Typography>
                        <Typography variant='h5' color='primary.main' fontWeight={700}>
                          {formatCurrency(tagihan.nominal)}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  {/* Bukti yang sudah ada */}
                  {tagihan.buktiPembayaran && (
                    <>
                      <Divider sx={{ my: 3 }} />
                      <div className='flex items-center gap-3'>
                        <i className='tabler-file-check text-success text-xl' />
                        <div>
                          <Typography variant='body2' fontWeight={500}>Bukti Pembayaran</Typography>
                          <Button
                            size='small'
                            variant='text'
                            startIcon={<i className='tabler-eye' />}
                            onClick={() => window.open(tagihan.buktiPembayaran!, '_blank')}
                          >
                            Lihat Bukti
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Right: Actions */}
            <Grid size={{ xs: 12, md: 4 }}>
              <div className='flex flex-col gap-3'>
                {/* Status Lunas */}
                {isLunas && (
                  <>
                    <Box
                      className='p-2 rounded flex items-center gap-3'
                      sx={{ bgcolor: 'primary.light', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1 }}
                      onClick={async () => {
                        if (downloading) return
                        try {
                          setDownloading(true)
                          await downloadBuktiPembayaran(tagihan)
                        } catch {
                          showSnack('Gagal mengunduh bukti pembayaran', 'error')
                        } finally {
                          setDownloading(false)
                        }
                      }}
                    >
                      {downloading
                        ? <CircularProgress size={22} sx={{ color: 'white' }} />
                        : <i className='tabler-download text-white text-2xl' />
                      }
                      <Typography color='white' fontWeight={600}>
                        {downloading ? 'Menyiapkan...' : 'Download Bukti'}
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Status Dibatalkan */}
                {isCancelled && (
                  <Box className='p-4 rounded flex items-center gap-3' sx={{ bgcolor: 'error.light' }}>
                    <i className='tabler-circle-x text-white text-2xl' />
                    <Typography color='white' fontWeight={600}>Booking Dibatalkan</Typography>
                  </Box>
                )}

                {/* Konfirmasi Batal */}
                {confirmCancel && (
                  <Box className='p-3 rounded flex flex-col gap-2' sx={{ border: '1px solid', borderColor: 'error.main' }}>
                    <Typography variant='body2' fontWeight={600} color='error.main'>
                      Yakin ingin membatalkan booking ini?
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Tindakan ini tidak dapat dibatalkan.
                    </Typography>
                    <div className='flex gap-2 mt-1'>
                      <Button
                        fullWidth
                        variant='contained'
                        color='error'
                        size='small'
                        startIcon={cancelling ? <CircularProgress size={14} color='inherit' /> : <i className='tabler-check' />}
                        onClick={handleBatal}
                        disabled={cancelling}
                      >
                        {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
                      </Button>
                      <Button fullWidth variant='tonal' color='secondary' size='small' onClick={() => setConfirmCancel(false)} disabled={cancelling}>
                        Tidak
                      </Button>
                    </div>
                  </Box>
                )}

                {/* Bayar, Check & Batal — jika belum lunas/dibatalkan */}
                {!isLunas && !isCancelled && !confirmCancel && (
                  <>
                    <Button
                      fullWidth
                      variant='contained'
                      color='success'
                      size='large'
                      startIcon={paying ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-credit-card' />}
                      onClick={handleBayar}
                      disabled={paying || checking}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {paying ? 'Memproses...' : 'Bayar Sekarang'}
                    </Button>
                    <Button
                      fullWidth
                      variant='contained'
                      color='primary'
                      size='large'
                      startIcon={checking ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-refresh' />}
                      onClick={handleCheckTransaction}
                      disabled={paying || checking || !tagihan?.ipaymuSessionId}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {checking ? 'Mengecek...' : 'Check Transaksi'}
                    </Button>
                    <Button
                      fullWidth
                      variant='tonal'
                      color='error'
                      size='large'
                      startIcon={<i className='tabler-x' />}
                      onClick={() => setConfirmCancel(true)}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Batalkan Booking
                    </Button>
                  </>
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

                <Button fullWidth variant='tonal' color='secondary' onClick={onClose} startIcon={<i className='tabler-arrow-left' />} sx={{ justifyContent: 'flex-start' }}>
                  Kembali
                </Button>
              </div>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default BookingDetailDialog
