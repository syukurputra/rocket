'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

import CustomTextField from '@core/components/mui/TextField'
import { hitungSelesaiSewa } from '@/src/libs/periodeSewa'

interface HargaItem {
  id: string
  jenisHarga: string
  harga: number
}

interface BookingDialogProps {
  open: boolean
  onClose: () => void
  itemAset: {
    id: string
    nama: string
    hargaItemAset: HargaItem[]
  }
  asetNama: string
  adminBooking?: number
  // pre-filled dari pendingBooking (setelah redirect login)
  initialData?: {
    jenisHarga?: string
    mulaiSewa?: string
    durasi?: number
    catatan?: string
    errorMessage?: string
  }
}

const JENIS_LABEL: Record<string, string> = {
  JAM: 'Jam',
  HARIAN: 'Hari',
  BULANAN: 'Bulan',
  TAHUNAN: 'Tahun'
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)


const BookingDialog = ({ open, onClose, itemAset, asetNama, adminBooking = 0, initialData }: BookingDialogProps) => {
  const router = useRouter()
  const pathname = usePathname()

  const [jenisHarga, setJenisHarga] = useState(initialData?.jenisHarga || itemAset.hargaItemAset[0]?.jenisHarga || '')
  const [mulaiSewa, setMulaiSewa] = useState(initialData?.mulaiSewa || '')
  const [durasi, setDurasi] = useState(initialData?.durasi || 1)
  const [catatan, setCatatan] = useState(initialData?.catatan || '')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(initialData?.errorMessage || '')
  const [nomorBooking, setNomorBooking] = useState('')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [loggedInUser, setLoggedInUser] = useState<{ id?: string; username?: string; email?: string; nomorTelepon?: string } | null>(null)

  const selectedHarga = itemAset.hargaItemAset.find(h => h.jenisHarga === jenisHarga)
  const hargaSatuan = selectedHarga?.harga || 0
  const total = hargaSatuan * durasi
  const grandTotal = total + adminBooking
  const selesaiSewa = mulaiSewa ? hitungSelesaiSewa(new Date(mulaiSewa), durasi, jenisHarga) : null

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')

    if (!userData || !accessToken) return

    try {
      const parsed = JSON.parse(userData)

      if (parsed.nomorTelepon !== undefined) {
        setLoggedInUser(parsed)
      } else {
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
          .then(r => r.json())
          .then(data => {
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user))
              setLoggedInUser(data.user)
            }
          })
          .catch(() => setLoggedInUser(parsed))
      }
    } catch {}
  }, [open])

  useEffect(() => {
    if (itemAset.hargaItemAset.length > 0 && !initialData?.jenisHarga) {
      setJenisHarga(itemAset.hargaItemAset[0].jenisHarga)
    }
  }, [itemAset])

  const handleClose = () => {
    if (isLoading) return
    setJenisHarga(itemAset.hargaItemAset[0]?.jenisHarga || '')
    setMulaiSewa('')
    setDurasi(1)
    setCatatan('')
    setSuccess(false)
    setError('')
    setNomorBooking('')
    setPaymentUrl(null)
    setLoggedInUser(null)
    onClose()
  }

  const handleBooking = async () => {
    if (!jenisHarga) { setError('Pilih Jenis Harga terlebih dahulu.'); return }
    if (!mulaiSewa) { setError('Pilih Tanggal Mulai terlebih dahulu.'); return }

    // Belum login → simpan ke localStorage lalu redirect ke login
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) {
      const pendingBooking = {
        ruanganId: itemAset.id,
        itemAsetNama: itemAset.nama,
        asetNama,
        jenisHarga,
        mulaiSewa,
        durasi,
        catatan,
        hargaSatuan,
        total,
        adminBooking,
        selesaiSewa: selesaiSewa?.toISOString(),
        returnTo: pathname
      }

      localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking))
      router.push('/login')

      return
    }

    // Sudah login → proses booking
    const user = loggedInUser

    if (!user) { setError('Data pengguna tidak ditemukan. Coba refresh halaman.'); return }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruanganId: itemAset.id,
          namaPemesan: (user as any).name || (user as any).nama || (user as any).username || '',
          email: (user as any).email || '',
          telepon: (user as any).nomorTelepon || '',
          jenisHarga,
          mulaiSewa,
          selesaiSewa: selesaiSewa?.toISOString(),
          durasi,
          hargaSatuan,
          total,
          adminBooking,
          catatan,
          userId: (user as any).id || null
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Gagal membuat booking')

      localStorage.removeItem('pendingBooking')
      router.push('/booking/saya')
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan, coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex flex-col items-center justify-center bg-primary rounded p-2'>
              <i className='tabler-calendar-check text-white text-xl' />
            </div>
            <div>
              <Typography variant='h5'>Form Booking</Typography>
              <Typography variant='caption' color='text.secondary'>
                {asetNama} — {itemAset.nama}
              </Typography>
            </div>
          </div>
          <IconButton onClick={handleClose} disabled={isLoading}>
            <i className='tabler-x' />
          </IconButton>
        </div>
      </DialogTitle>

      <Divider sx={{ mt: 3 }} />

      <DialogContent sx={{ pt: 4 }}>
        {success ? (
          <div className='flex flex-col items-center gap-4 py-8'>
            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-success/10'>
              <i className='tabler-circle-check text-success text-5xl' />
            </div>
            <Typography variant='h5' color='success.main'>Booking Berhasil!</Typography>
            <Typography color='text.secondary' align='center'>
              Permintaan booking Anda telah diterima. Silakan lanjutkan ke pembayaran.
            </Typography>
            <Chip label={`Nomor Booking: ${nomorBooking}`} color='primary' variant='tonal' />
            <div className='flex gap-3 mt-2'>
              {paymentUrl && (
                <Button
                  variant='contained'
                  color='success'
                  startIcon={<i className='tabler-credit-card' />}
                  onClick={() => window.open(paymentUrl, '_blank')}
                >
                  Bayar Sekarang
                </Button>
              )}
              <Button variant='tonal' color='secondary' onClick={() => { handleClose(); router.push('/booking') }}>
                Lihat Booking
              </Button>
            </div>
          </div>
        ) : (
          <Grid container spacing={6}>
            {/* Left: Form Detail Sewa */}
            <Grid size={{ xs: 12, md: 7 }}>
              <div className='flex flex-col gap-4'>
                <Typography variant='h6'>
                  <i className='tabler-calendar mie-2' />
                  Detail Sewa
                </Typography>

                <CustomTextField
                  select
                  fullWidth
                  label='Jenis Harga *'
                  value={jenisHarga}
                  onChange={e => { setJenisHarga(e.target.value); setDurasi(1) }}
                >
                  {itemAset.hargaItemAset.map(h => (
                    <MenuItem key={h.id} value={h.jenisHarga}>
                      {JENIS_LABEL[h.jenisHarga] || h.jenisHarga} — {formatCurrency(h.harga)}
                    </MenuItem>
                  ))}
                </CustomTextField>

                <CustomTextField
                  fullWidth
                  label='Tanggal Mulai *'
                  type={jenisHarga === 'JAM' ? 'datetime-local' : 'date'}
                  value={mulaiSewa}
                  onChange={e => setMulaiSewa(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                />

                <CustomTextField
                  fullWidth
                  label={`Durasi (${JENIS_LABEL[jenisHarga] || jenisHarga}) *`}
                  type='number'
                  value={durasi}
                  onChange={e => setDurasi(Math.max(1, Number(e.target.value)))}
                  inputProps={{ min: 1 }}
                />

                <CustomTextField
                  fullWidth
                  label='Catatan (Opsional)'
                  placeholder='Permintaan khusus atau keterangan lainnya'
                  multiline
                  rows={3}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                />

                {!loggedInUser && (
                  <Alert severity='info' icon={<i className='tabler-info-circle' />}>
                    Anda perlu <strong>login</strong> untuk menyelesaikan booking. Data Anda akan disimpan sementara.
                  </Alert>
                )}

                {error && <Alert severity='error'>{error}</Alert>}
              </div>
            </Grid>

            {/* Right: Summary */}
            <Grid size={{ xs: 12, md: 5 }}>
              <div className='flex flex-col gap-4 p-5 rounded-lg bg-actionHover h-full'>
                <Typography variant='h6'>Ringkasan Booking</Typography>
                <Divider />

                <div className='flex flex-col gap-3'>
                  <div className='flex justify-between'>
                    <Typography color='text.secondary'>Item Aset</Typography>
                    <Typography fontWeight={500}>{itemAset.nama}</Typography>
                  </div>
                  <div className='flex justify-between'>
                    <Typography color='text.secondary'>Jenis Sewa</Typography>
                    <Typography fontWeight={500}>{JENIS_LABEL[jenisHarga] || '-'}</Typography>
                  </div>
                  <div className='flex justify-between'>
                    <Typography color='text.secondary'>Harga / {JENIS_LABEL[jenisHarga] || 'Satuan'}</Typography>
                    <Typography fontWeight={500}>{hargaSatuan ? formatCurrency(hargaSatuan) : '-'}</Typography>
                  </div>
                  <div className='flex justify-between'>
                    <Typography color='text.secondary'>Durasi</Typography>
                    <Typography fontWeight={500}>{durasi} {JENIS_LABEL[jenisHarga] || ''}</Typography>
                  </div>
                  {mulaiSewa && (
                    <div className='flex justify-between'>
                      <Typography color='text.secondary'>Mulai</Typography>
                      <Typography fontWeight={500}>
                        {new Date(mulaiSewa).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </div>
                  )}
                  {selesaiSewa && (
                    <div className='flex justify-between'>
                      <Typography color='text.secondary'>Selesai</Typography>
                      <Typography fontWeight={500}>
                        {selesaiSewa.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </div>
                  )}
                </div>

                <Divider />

                <div className='flex justify-between items-center'>
                  <Typography variant='h6'>Total</Typography>
                  <Typography variant='h5' color='primary.main' fontWeight={700}>
                    {total ? formatCurrency(total) : 'Rp 0'}
                  </Typography>
                </div>

              </div>
            </Grid>

            {/* Actions */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ mb: 3 }} />
              <div className='flex justify-end gap-3'>
                <Button variant='tonal' color='secondary' onClick={handleClose} disabled={isLoading}>
                  Batal
                </Button>
                <Button
                  variant='contained'
                  onClick={handleBooking}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-calendar-check' />}
                >
                  {isLoading ? 'Memproses...' : loggedInUser ? 'Booking' : 'Login & Booking'}
                </Button>
              </div>
            </Grid>
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default BookingDialog
