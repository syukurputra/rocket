'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

import CustomTextField from '@core/components/mui/TextField'

interface HargaItem {
  id: string
  jenisHarga: string
  harga: number
}

interface BookingDialogProps {
  open: boolean
  onClose: () => void
  ruangan: {
    id: string
    nama: string
    hargaItemAset: HargaItem[]
  }
  asetNama: string
}

const JENIS_LABEL: Record<string, string> = {
  JAM: 'Jam',
  HARIAN: 'Hari',
  BULANAN: 'Bulan',
  TAHUNAN: 'Tahun'
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const addDuration = (date: Date, durasi: number, jenis: string): Date => {
  const d = new Date(date)

  if (jenis === 'JAM') d.setHours(d.getHours() + durasi)
  else if (jenis === 'HARIAN') d.setDate(d.getDate() + durasi)
  else if (jenis === 'BULANAN') d.setMonth(d.getMonth() + durasi)
  else if (jenis === 'TAHUNAN') d.setFullYear(d.getFullYear() + durasi)

  return d
}

const BookingDialog = ({ open, onClose, ruangan, asetNama }: BookingDialogProps) => {
  const router = useRouter()
  const [namaPemesan, setNamaPemesan] = useState('')
  const [email, setEmail] = useState('')
  const [telepon, setTelepon] = useState('')
  const [jenisHarga, setJenisHarga] = useState(ruangan.hargaItemAset[0]?.jenisHarga || '')
  const [mulaiSewa, setMulaiSewa] = useState('')
  const [durasi, setDurasi] = useState(1)
  const [catatan, setCatatan] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [nomorBooking, setNomorBooking] = useState('')
  const [loggedInUser, setLoggedInUser] = useState<{ id?: string; username?: string; email?: string; nomorTelepon?: string } | null>(null)

  const selectedHarga = ruangan.hargaItemAset.find(h => h.jenisHarga === jenisHarga)
  const hargaSatuan = selectedHarga?.harga || 0
  const total = hargaSatuan * durasi

  const selesaiSewa = mulaiSewa ? addDuration(new Date(mulaiSewa), durasi, jenisHarga) : null

  // Load user from localStorage if logged in, fetch fresh data if nomorTelepon missing
  useEffect(() => {
    const userData = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')

    if (!userData || !accessToken) return

    try {
      const parsed = JSON.parse(userData)

      if (parsed.nomorTelepon !== undefined) {
        // Data already has nomorTelepon
        setLoggedInUser(parsed)
        setNamaPemesan(parsed.username || parsed.nama || '')
        setEmail(parsed.email || '')
        setTelepon(parsed.nomorTelepon || '')
      } else {
        // Fetch fresh data to get nomorTelepon
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
          .then(r => r.json())
          .then(data => {
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user))
              setLoggedInUser(data.user)
              setNamaPemesan(data.user.username || '')
              setEmail(data.user.email || '')
              setTelepon(data.user.nomorTelepon || '')
            }
          })
          .catch(() => {
            setLoggedInUser(parsed)
            setNamaPemesan(parsed.username || '')
            setEmail(parsed.email || '')
          })
      }
    } catch {}
  }, [open])

  useEffect(() => {
    if (ruangan.hargaItemAset.length > 0) {
      setJenisHarga(ruangan.hargaItemAset[0].jenisHarga)
    }
  }, [ruangan])

  const handleClose = () => {
    if (isLoading) return
    setNamaPemesan('')
    setEmail('')
    setTelepon('')
    setJenisHarga(ruangan.hargaItemAset[0]?.jenisHarga || '')
    setMulaiSewa('')
    setDurasi(1)
    setCatatan('')
    setSuccess(false)
    setError('')
    setLoggedInUser(null)
    onClose()
  }

  const handleSubmit = async () => {
    const missing = []

    if (!namaPemesan) missing.push('Nama Lengkap')
    if (!telepon) missing.push('No. WhatsApp / Telepon')
    if (!jenisHarga) missing.push('Jenis Harga')
    if (!mulaiSewa) missing.push('Tanggal Mulai')

    if (missing.length > 0) {
      setError(`Mohon lengkapi field berikut: ${missing.join(', ')}.`)

      return
    }

    setIsLoading(true)
    setError('')

    try {
      const userId = loggedInUser ? (loggedInUser as any).id || null : null

      const res = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruanganId: ruangan.id,
          namaPemesan,
          email,
          telepon,
          jenisHarga,
          mulaiSewa,
          selesaiSewa: selesaiSewa?.toISOString(),
          durasi,
          hargaSatuan,
          total,
          catatan,
          userId
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Gagal membuat booking')
      setNomorBooking(data.data.nomorBooking || `BK-${data.data.tagihan?.id?.slice(-8).toUpperCase()}`)
      setSuccess(true)
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
                {asetNama} — {ruangan.nama}
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
              Permintaan booking Anda telah diterima. Tim kami akan segera menghubungi Anda untuk konfirmasi.
            </Typography>
            <Chip label={`Nomor Booking: ${nomorBooking}`} color='primary' variant='tonal' />
            <Button variant='contained' onClick={() => { handleClose(); router.push('/booking') }} sx={{ mt: 2 }}>
              Tutup
            </Button>
          </div>
        ) : (
          <Grid container spacing={6}>
            {/* Left: Form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <div className='flex flex-col gap-5'>
                <div>
                  <Typography variant='h6' className='mbe-4'>
                    <i className='tabler-user mie-2' />
                    Informasi Pemesan
                  </Typography>
                  <div className='flex flex-col gap-4'>
                    <CustomTextField
                      fullWidth
                      label='Nama Lengkap *'
                      placeholder='Masukkan nama lengkap'
                      value={namaPemesan}
                      onChange={e => setNamaPemesan(e.target.value)}
                      disabled={!!loggedInUser}
                      InputProps={loggedInUser ? { endAdornment: <i className='tabler-lock text-textDisabled' /> } : undefined}
                    />
                    <CustomTextField
                      fullWidth
                      label='No. WhatsApp / Telepon *'
                      placeholder='Contoh: 08123456789'
                      value={telepon}
                      onChange={e => setTelepon(e.target.value)}
                      disabled={!!loggedInUser}
                      InputProps={loggedInUser ? { endAdornment: <i className='tabler-lock text-textDisabled' /> } : undefined}
                    />
                    <CustomTextField
                      fullWidth
                      label='Email'
                      placeholder='email@example.com'
                      type='email'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={!!loggedInUser}
                      InputProps={loggedInUser ? { endAdornment: <i className='tabler-lock text-textDisabled' /> } : undefined}
                    />
                  </div>
                </div>

                <Divider />

                <div>
                  <Typography variant='h6' className='mbe-4'>
                    <i className='tabler-calendar mie-2' />
                    Detail Sewa
                  </Typography>
                  <div className='flex flex-col gap-4'>
                    <CustomTextField
                      select
                      fullWidth
                      label='Jenis Harga *'
                      value={jenisHarga}
                      onChange={e => { setJenisHarga(e.target.value); setDurasi(1) }}
                    >
                      {ruangan.hargaItemAset.map(h => (
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
                  </div>
                </div>

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
                    <Typography color='text.secondary'>Ruangan</Typography>
                    <Typography fontWeight={500}>{ruangan.nama}</Typography>
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

                <div className='flex flex-col gap-2 mbs-auto'>
                  <Typography variant='caption' color='text.secondary'>
                    * Harga di atas tidak termasuk biaya layanan pembayaran.
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
                  onClick={handleSubmit}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-send' />}
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Booking'}
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
