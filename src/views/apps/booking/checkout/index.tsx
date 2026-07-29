'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import CustomTextField from '@core/components/mui/TextField'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import ScheduleDialog from '@/src/views/front-pages/publish/ScheduleDialog'
import type { TarifBiayaLayanan } from '@/src/libs/biayaLayanan'

interface HargaItem {
  id: string
  jenisHarga: string
  harga: number
}

interface ItemAset {
  id: string
  nama: string
  status: string
  companyId: string
  asetId: string
  asetNama: string
  tarifBiayaLayanan: TarifBiayaLayanan
  hargaItemAset: HargaItem[]
}

const JENIS_LABEL: Record<string, string> = {
  JAM: 'Jam',
  HARIAN: 'Hari',
  BULANAN: 'Bulan',
  TAHUNAN: 'Tahun'
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

/** Sewa per jam memakai datetime-local, jenis lain cukup tanggal. */
const pakaiJam = (jenis: string) => jenis === 'JAM'

/** `YYYY-MM-DD` waktu lokal — bukan toISOString() yang memakai UTC. */
const toLocalDateValue = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Pilihan jam mulai 00:00 – 23:00. Menit selalu 00, jadi tidak perlu dipilih. */
const JAM_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

const formatTanggal = (d: Date, withTime: boolean) =>
  d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  })

const addDuration = (date: Date, durasi: number, jenis: string): Date => {
  const d = new Date(date)

  if (jenis === 'JAM') d.setHours(d.getHours() + durasi)
  else if (jenis === 'HARIAN') d.setDate(d.getDate() + durasi)
  else if (jenis === 'BULANAN') d.setMonth(d.getMonth() + durasi)
  else if (jenis === 'TAHUNAN') d.setFullYear(d.getFullYear() + durasi)

  return d
}

const BookingCheckoutView = ({ itemId }: { itemId: string }) => {
  const router = useRouter()

  const [item, setItem] = useState<ItemAset | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [jenisHarga, setJenisHarga] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [jamMulai, setJamMulai] = useState('00')
  const [durasi, setDurasi] = useState(1)
  const [catatan, setCatatan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [openSchedule, setOpenSchedule] = useState(false)

  // Keranjang hanya boleh berisi satu aset — kalau berbeda, user diminta memilih
  const [konfirmasiGantiAset, setKonfirmasiGantiAset] = useState('')

  const [user, setUser] = useState<any>(null)

  // Bersihkan penanda pending (jika datang dari alur login)
  useEffect(() => {
    localStorage.removeItem('pendingBooking')
  }, [])

  // Fetch item aset
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true)
        const res = await apiFetchClient<{ data: ItemAset }>(`/api/public/item-aset/${itemId}`, undefined, {
          redirectOn401: '/login'
        })

        setItem(res.data)
        setJenisHarga(res.data.hargaItemAset[0]?.jenisHarga || '')
      } catch (err) {
        console.error('Fetch item aset error:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [itemId])

  // Fetch user login (untuk data pemesan)
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) return

    try {
      const raw = localStorage.getItem('user')

      if (raw) setUser(JSON.parse(raw))
    } catch {
      /* ignore */
    }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
          setUser(data.user)
        }
      })
      .catch(() => {})
  }, [])

  const selectedHarga = item?.hargaItemAset.find(h => h.jenisHarga === jenisHarga)
  const hargaSatuan = selectedHarga?.harga || 0
  const total = hargaSatuan * durasi

  // Tanggal & jam disimpan terpisah lalu digabung — menit dikunci 00
  const mulaiSewa = tanggalMulai ? (pakaiJam(jenisHarga) ? `${tanggalMulai}T${jamMulai}:00` : tanggalMulai) : ''
  const selesaiSewa = mulaiSewa ? addDuration(new Date(mulaiSewa), durasi, jenisHarga) : null

  /**
   * Booking tidak langsung jadi tagihan — masuk keranjang dulu supaya beberapa
   * booking pada aset yang sama bisa dibayar sekaligus.
   *
   * @param kosongkanDulu isi keranjang dari aset lain dibuang lebih dahulu
   */
  const tambahKeKeranjang = async (kosongkanDulu = false) => {
    if (!item) return
    if (!jenisHarga) { setError('Pilih Jenis Harga terlebih dahulu.'); return }
    if (!mulaiSewa) { setError('Pilih Tanggal Mulai terlebih dahulu.'); return }
    if (!user) { setError('Data pengguna tidak ditemukan. Coba refresh halaman.'); return }

    setSubmitting(true)
    setError('')
    setKonfirmasiGantiAset('')

    try {
      if (kosongkanDulu) {
        await apiFetchClient('/api/keranjang', { method: 'DELETE' }, { redirectOn401: '/login' })
      }

      const res = await fetch('/api/keranjang', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`
        },
        body: JSON.stringify({
          itemAsetId: item.id,
          jenisHarga,
          mulaiSewa,
          selesaiSewa: selesaiSewa?.toISOString(),
          durasi,
          hargaSatuan,
          total,
          catatan
        })
      })

      const data = await res.json()

      if (res.status === 409 && data.code === 'ASET_BERBEDA') {
        setKonfirmasiGantiAset(data.message)

        return
      }

      if (!res.ok) throw new Error(data.message || 'Gagal menambahkan ke keranjang')

      // Badge keranjang di header ikut menyesuaikan
      window.dispatchEvent(new Event('keranjang:updated'))
      router.push('/keranjang')
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan, coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center items-center' sx={{ minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (notFound || !item) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>Item aset tidak ditemukan.</Alert>
          <Button className='mt-4' variant='tonal' color='secondary' onClick={() => router.back()}>
            Kembali
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Grid container spacing={6}>
      {/* Form Detail Sewa */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Card>
          <CardHeader
            title='Form Booking'
            subheader={`${item.asetNama} — ${item.nama}`}
            avatar={
              <div className='flex flex-col items-center justify-center bg-primary rounded p-2'>
                <i className='tabler-calendar-check text-white text-xl' />
              </div>
            }
            action={
              <Button
                variant='outlined'
                color='secondary'
                startIcon={<i className='tabler-calendar' />}
                onClick={() => setOpenSchedule(true)}
              >
                Schedule
              </Button>
            }
          />
          <Divider />
          <CardContent>
            <div className='flex flex-col gap-4'>
              <CustomTextField
                select
                fullWidth
                label='Jenis Harga *'
                value={jenisHarga}
                onChange={e => { setJenisHarga(e.target.value); setDurasi(1) }}
              >
                {item.hargaItemAset.map(h => (
                  <MenuItem key={h.id} value={h.jenisHarga}>
                    {JENIS_LABEL[h.jenisHarga] || h.jenisHarga} — {formatCurrency(h.harga)}
                  </MenuItem>
                ))}
              </CustomTextField>

              {/* Tanggal & jam dipisah supaya picker menit bawaan browser tidak muncul */}
              <div className='flex flex-col sm:flex-row gap-4'>
                <CustomTextField
                  fullWidth
                  label='Tanggal Mulai *'
                  type='date'
                  value={tanggalMulai}
                  onChange={e => setTanggalMulai(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: toLocalDateValue(new Date()) }}
                />

                {pakaiJam(jenisHarga) && (
                  <CustomTextField
                    select
                    label='Jam Mulai *'
                    value={jamMulai}
                    onChange={e => setJamMulai(e.target.value)}
                    className='sm:is-[160px] shrink-0'
                  >
                    {JAM_OPTIONS.map(j => (
                      <MenuItem key={j} value={j}>
                        {j}:00
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              </div>

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

              {error && <Alert severity='error'>{error}</Alert>}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Ringkasan */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Card>
          <CardHeader title='Ringkasan Booking' />
          <Divider />
          <CardContent>
            <div className='flex flex-col gap-3'>
              <div className='flex justify-between'>
                <Typography color='text.secondary'>Item Aset</Typography>
                <Typography fontWeight={500}>{item.nama}</Typography>
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
                    {formatTanggal(new Date(mulaiSewa), pakaiJam(jenisHarga))}
                  </Typography>
                </div>
              )}
              {selesaiSewa && (
                <div className='flex justify-between'>
                  <Typography color='text.secondary'>Selesai</Typography>
                  <Typography fontWeight={500}>{formatTanggal(selesaiSewa, pakaiJam(jenisHarga))}</Typography>
                </div>
              )}
            </div>

            <Divider className='my-4' />

            <div className='flex justify-between items-center'>
              <Typography variant='h6'>Total</Typography>
              <Typography variant='h5' color='primary.main' fontWeight={700}>
                {total ? formatCurrency(total) : 'Rp 0'}
              </Typography>
            </div>

            <div className='flex flex-col gap-3 mt-6'>
              <Button
                fullWidth
                variant='contained'
                onClick={() => tambahKeKeranjang()}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-shopping-cart-plus' />}
              >
                {submitting ? 'Memproses...' : 'Tambah ke Keranjang'}
              </Button>
              <Button fullWidth variant='tonal' color='secondary' onClick={() => router.back()} disabled={submitting}>
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    <ScheduleDialog
      open={openSchedule}
      onClose={() => setOpenSchedule(false)}
      itemAsetId={item.id}
      itemAsetNama={item.nama}
    />

    <Dialog open={!!konfirmasiGantiAset} onClose={() => setKonfirmasiGantiAset('')} maxWidth='xs' fullWidth>
      <DialogTitle>Ganti Isi Keranjang?</DialogTitle>
      <DialogContent>
        <Typography color='text.secondary'>{konfirmasiGantiAset}</Typography>
        <Typography color='text.secondary' className='mt-3'>
          Lanjutkan untuk mengosongkan keranjang lalu menambahkan booking ini.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={() => setKonfirmasiGantiAset('')} disabled={submitting}>
          Batal
        </Button>
        <Button variant='contained' onClick={() => tambahKeKeranjang(true)} disabled={submitting}>
          Kosongkan & Tambahkan
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}

export default BookingCheckoutView
