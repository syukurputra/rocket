'use client'

import { useCallback, useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import CustomTextField from '@core/components/mui/TextField'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import { isTelat } from '@/src/libs/periodeSewa'

type TagihanBooking = {
  id: string
  nomorTagihan?: string | null
  keterangan: string
  nominal: number
  adminBooking?: number | null
  hargaMerchant?: number | null
  status: string
  periodeSewa?: string | null
  mulaiSewa: string
  selesaiSewa: string
  lateDate?: string | null
  alasanBatal?: string | null
  tanggalBayar?: string | null
  metodeBayar?: string | null
  buktiPembayaran?: string | null
  orderId?: string | null
  aset?: { id: string; nama: string } | null
  itemAset?: { id: string; nama: string } | null
  penyewa?: { id: string; nama: string; nomorTelepon?: string; email?: string } | null
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'

const statusChip = (status: string) => {
  const s = status?.toLowerCase()

  if (s === 'lunas') return <Chip label='Lunas' color='success' size='small' variant='tonal' />
  if (s === 'dibatalkan') return <Chip label='Dibatalkan' color='warning' size='small' variant='tonal' />
  if (s === 'menunggu konfirmasi') return <Chip label='Menunggu Konfirmasi' color='info' size='small' variant='tonal' />

  return <Chip label='Belum Terbayar' color='error' size='small' variant='tonal' />
}

/** Satu baris label — nilai pada blok informasi. */
const Baris = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className='flex justify-between gap-4'>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <Typography variant='body2' fontWeight={500} className='text-right'>
      {value}
    </Typography>
  </div>
)

const BookingAsetDetailView = ({ bookingId }: { bookingId: string }) => {
  const router = useRouter()

  const [tagihan, setTagihan] = useState<TagihanBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [prosesKonfirmasi, setProsesKonfirmasi] = useState(false)

  // Penolakan wajib disertai alasan, jadi dikumpulkan lewat dialog terpisah
  const [dialogTolak, setDialogTolak] = useState(false)
  const [alasanBatal, setAlasanBatal] = useState('')

  const { snack, showSnack, closeSnack } = useSnackbar()

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true)

      const res = await apiFetchClient<{ data: TagihanBooking }>(`/api/booking/${bookingId}`, undefined, {
        redirectOn401: '/login'
      })

      setTagihan(res.data)
    } catch (err) {
      console.error('Fetch booking aset detail error:', err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  const menungguKonfirmasi = tagihan?.status === 'MENUNGGU KONFIRMASI'

  /** Setujui (lanjut bayar) atau tolak (batalkan) booking. */
  const handleKonfirmasi = async (setuju: boolean) => {
    setProsesKonfirmasi(true)

    try {
      const res = await apiFetchClient<{ message: string }>('/api/booking/aset/konfirmasi', {
        method: 'POST',
        body: JSON.stringify({ tagihanId: bookingId, setuju, alasan: setuju ? undefined : alasanBatal })
      })

      showSnack(res.message, setuju ? 'success' : 'info')
      setDialogTolak(false)
      setAlasanBatal('')
      fetchBooking()
    } catch (err: any) {
      showSnack(err.message || 'Gagal memproses konfirmasi', 'error')
    } finally {
      setProsesKonfirmasi(false)
    }
  }

  /** Buka percakapan dengan penyewa dari sisi usaha. */
  const handleChatPenyewa = async () => {
    if (!tagihan?.penyewa?.id) return

    try {
      const res = await apiFetchClient<{ data: { id: string } }>('/api/chat/conversations/usaha', {
        method: 'POST',
        body: JSON.stringify({ userId: tagihan.penyewa.id, asetId: tagihan.aset?.id })
      })

      router.push(`/chat/usaha?c=${res.data.id}`)
    } catch (err: any) {
      showSnack(err.message || 'Gagal membuka percakapan', 'error')
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center items-center' sx={{ minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (notFound || !tagihan) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>Booking tidak ditemukan.</Alert>
          <Button className='mt-4' variant='tonal' color='secondary' onClick={() => router.push('/booking/aset')}>
            Kembali
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader
              title='Detail Booking'
              subheader={tagihan.nomorTagihan || tagihan.id}
              avatar={
                <div className='flex flex-col items-center justify-center bg-primary rounded p-2'>
                  <i className='tabler-receipt text-white text-xl' />
                </div>
              }
              action={statusChip(tagihan.status)}
            />
            <Divider />
            <CardContent className='flex flex-col gap-6'>
              <div className='flex flex-col gap-3'>
                <Typography variant='h6'>Penyewa</Typography>
                <Baris label='Nama' value={tagihan.penyewa?.nama || '-'} />
                <Baris label='Email' value={tagihan.penyewa?.email || '-'} />
                <Baris label='Nomor Telepon' value={tagihan.penyewa?.nomorTelepon || '-'} />
              </div>

              <Divider />

              <div className='flex flex-col gap-3'>
                <Typography variant='h6'>Booking</Typography>
                <Baris label='Aset' value={tagihan.aset?.nama || '-'} />
                <Baris label='Item Aset' value={tagihan.itemAset?.nama || '-'} />
                <Baris
                  label='Periode Sewa'
                  value={<span className='capitalize'>{tagihan.periodeSewa || '-'}</span>}
                />
                <Baris label='Mulai Sewa' value={formatDate(tagihan.mulaiSewa)} />
                <Baris label='Selesai Sewa' value={formatDate(tagihan.selesaiSewa)} />
                {tagihan.lateDate && (
                  <Baris
                    label='Batas Telat (H+1)'
                    value={
                      <span className='inline-flex items-center gap-2'>
                        {formatDate(tagihan.lateDate)}
                        {isTelat(tagihan.lateDate) && tagihan.status !== 'LUNAS' && (
                          <Chip label='Telat' color='error' size='small' />
                        )}
                      </span>
                    }
                  />
                )}
                <Baris label='Keterangan' value={tagihan.keterangan} />
                {tagihan.orderId && <Baris label='Nomor Order' value={tagihan.orderId} />}
              </div>

              {tagihan.alasanBatal && (
                <Alert severity='warning'>
                  <Typography variant='body2' fontWeight={600}>
                    Alasan Pembatalan
                  </Typography>
                  <Typography variant='body2'>{tagihan.alasanBatal}</Typography>
                </Alert>
              )}

              <Divider />

              <div className='flex flex-col gap-3'>
                <Typography variant='h6'>Pembayaran</Typography>
                <Baris label='Nominal' value={formatCurrency(Number(tagihan.nominal))} />
                <Baris label='Biaya Layanan' value={formatCurrency(Number(tagihan.adminBooking ?? 0))} />
                <Baris label='Diterima Merchant' value={formatCurrency(Number(tagihan.hargaMerchant ?? 0))} />
                <Baris label='Tanggal Bayar' value={formatDate(tagihan.tanggalBayar)} />
                <Baris label='Metode Bayar' value={tagihan.metodeBayar || '-'} />
              </div>

              {tagihan.buktiPembayaran && (
                <>
                  <Divider />
                  <Button
                    variant='tonal'
                    color='secondary'
                    className='self-start'
                    startIcon={<i className='tabler-eye' />}
                    onClick={() => window.open(tagihan.buktiPembayaran!, '_blank')}
                  >
                    Lihat Bukti Pembayaran
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title={menungguKonfirmasi ? 'Konfirmasi Booking' : 'Tindakan'} />
            <Divider />
            <CardContent className='flex flex-col gap-3'>
              {menungguKonfirmasi ? (
                <>
                  <Typography variant='body2' color='text.secondary'>
                    Setujui booking ini? Jika ya, penyewa dapat melanjutkan pembayaran. Jika tidak, booking
                    dibatalkan.
                  </Typography>

                  <Button
                    fullWidth
                    variant='contained'
                    color='success'
                    startIcon={
                      prosesKonfirmasi ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-check' />
                    }
                    onClick={() => handleKonfirmasi(true)}
                    disabled={prosesKonfirmasi}
                  >
                    Ya, Setujui
                  </Button>
                  <Button
                    fullWidth
                    variant='tonal'
                    color='error'
                    startIcon={<i className='tabler-x' />}
                    onClick={() => setDialogTolak(true)}
                    disabled={prosesKonfirmasi}
                  >
                    Tidak, Batalkan
                  </Button>

                  <Divider />
                </>
              ) : (
                <Alert severity='info'>Booking ini tidak memerlukan konfirmasi.</Alert>
              )}

              <Button
                fullWidth
                variant='tonal'
                color='secondary'
                startIcon={<i className='tabler-message-circle' />}
                onClick={handleChatPenyewa}
                disabled={!tagihan.penyewa?.id}
              >
                Chat Penyewa
              </Button>

              <Button
                fullWidth
                variant='tonal'
                color='secondary'
                startIcon={<i className='tabler-arrow-left' />}
                onClick={() => router.push('/booking/aset')}
              >
                Kembali
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={dialogTolak} onClose={() => !prosesKonfirmasi && setDialogTolak(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Batalkan Booking</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' className='mbe-4'>
            Tulis alasan pembatalan. Alasan ini akan dikirim ke penyewa.
          </Typography>
          <CustomTextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label='Alasan Pembatalan *'
            placeholder='Contoh: unit sedang perbaikan pada tanggal tersebut'
            value={alasanBatal}
            onChange={e => setAlasanBatal(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant='tonal'
            color='secondary'
            onClick={() => setDialogTolak(false)}
            disabled={prosesKonfirmasi}
          >
            Batal
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={() => handleKonfirmasi(false)}
            disabled={prosesKonfirmasi || !alasanBatal.trim()}
            startIcon={
              prosesKonfirmasi ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-x' />
            }
          >
            Batalkan Booking
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default BookingAsetDetailView
