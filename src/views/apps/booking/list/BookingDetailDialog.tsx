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
  const grayColor: [number, number, number] = [108, 117, 125]
  const lightGray: [number, number, number] = [248, 249, 250]
  const darkText: [number, number, number] = [33, 37, 41]

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20

  // Header
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageW, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Bantu Sewa', margin, 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Platform Manajemen Properti', margin, 22)

  // Badge LUNAS
  doc.setFillColor(...successColor)
  doc.roundedRect(pageW - margin - 30, 10, 30, 12, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('LUNAS', pageW - margin - 15, 18, { align: 'center' })

  // Judul
  doc.setTextColor(...darkText)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Bukti Pembayaran Booking', margin, 50)

  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(margin, 53, pageW - margin, 53)

  // Info Aset & Tanggal
  let y = 62

  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, y, pageW - margin * 2, 24, 2, 2, 'F')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...grayColor)
  doc.text('ASET / RUANGAN', margin + 4, y + 7)
  doc.text('PERIODE SEWA', pageW / 2, y + 7)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkText)
  const asetNama = tagihan.penyewa?.aset?.nama || '-'
  const ruanganNama = tagihan.penyewa?.ruangan?.nama || '-'

  doc.setFont('helvetica', 'bold')
  doc.text(`${asetNama} — ${ruanganNama}`, margin + 4, y + 16)

  const mulai = new Date(tagihan.mulaiSewa).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const selesai = new Date(tagihan.selesaiSewa).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  doc.text(`${mulai} s/d ${selesai}`, pageW / 2, y + 16)

  // Info Pemesan
  y += 34

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  doc.text('PEMESAN', margin, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...darkText)
  doc.text(tagihan.penyewa?.nama || '-', margin, y)

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)

  if (tagihan.penyewa?.nomorTelepon) { doc.text(tagihan.penyewa.nomorTelepon, margin, y); y += 5 }
  if (tagihan.penyewa?.email) { doc.text(tagihan.penyewa.email, margin, y); y += 5 }

  // Tabel Item
  y += 6

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['ITEM', 'PERIODE', 'JUMLAH']],
    body: [[
      tagihan.keterangan,
      tagihan.penyewa?.periodeSewa ? tagihan.penyewa.periodeSewa.charAt(0).toUpperCase() + tagihan.penyewa.periodeSewa.slice(1) : '-',
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(tagihan.nominal))
    ]],
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: darkText },
    columnStyles: { 2: { halign: 'right' } },
    theme: 'striped',
    alternateRowStyles: { fillColor: lightGray }
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // Total
  doc.setFillColor(...lightGray)
  doc.rect(pageW / 2, y, pageW / 2 - margin, 14, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...darkText)
  doc.text('TOTAL', pageW / 2 + 4, y + 9)

  doc.setTextColor(...primaryColor)
  doc.setFontSize(11)
  doc.text(
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(tagihan.nominal)),
    pageW - margin - 2,
    y + 9,
    { align: 'right' }
  )

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20

  doc.setDrawColor(...grayColor)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...grayColor)

  const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  doc.text(`Dicetak: ${printDate}`, margin, footerY)
  doc.text('Bantu Sewa — Platform Manajemen Properti', pageW - margin, footerY, { align: 'right' })

  const filename = `bukti-pembayaran-${tagihan.keterangan.replace(/\s+/g, '-').toLowerCase()}.pdf`

  doc.save(filename)
}

type TagihanBooking = {
  id: string
  keterangan: string
  nominal: number
  status: string
  mulaiSewa: string
  selesaiSewa: string
  metodeBayar?: string | null
  buktiPembayaran?: string | null
  penyewa?: {
    id: string
    nama: string
    nomorTelepon?: string
    email?: string
    periodeSewa?: string
    aset?: { id: string; nama: string }
    ruangan?: { id: string; nama: string }
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
                  {tagihan.penyewa?.aset?.nama} — {tagihan.penyewa?.ruangan?.nama}
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
                          Platform Manajemen Properti
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
                            {tagihan.penyewa?.periodeSewa && (
                              <Chip
                                label={tagihan.penyewa.periodeSewa}
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
                    <Box className='p-4 rounded flex items-center gap-3' sx={{ bgcolor: 'success.light' }}>
                      <i className='tabler-circle-check text-white text-2xl' />
                      <Typography color='white' fontWeight={600}>Sudah Dibayar</Typography>
                    </Box>
                    <Button
                      fullWidth
                      variant='contained'
                      color='success'
                      size='large'
                      startIcon={downloading ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-download' />}
                      disabled={downloading}
                      onClick={async () => {
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
                      {downloading ? 'Menyiapkan...' : 'Download Bukti Pembayaran'}
                    </Button>
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

                {/* Bayar & Batal — tampil berdampingan jika belum lunas/dibatalkan */}
                {!isLunas && !isCancelled && !confirmCancel && (
                  <>
                    <Button
                      fullWidth
                      variant='contained'
                      color='success'
                      size='large'
                      startIcon={paying ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-credit-card' />}
                      onClick={handleBayar}
                      disabled={paying}
                    >
                      {paying ? 'Memproses...' : 'Bayar Sekarang'}
                    </Button>
                    <Button
                      fullWidth
                      variant='tonal'
                      color='error'
                      size='large'
                      startIcon={<i className='tabler-x' />}
                      onClick={() => setConfirmCancel(true)}
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

                <Button fullWidth variant='tonal' color='secondary' onClick={onClose} startIcon={<i className='tabler-arrow-left' />}>
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
