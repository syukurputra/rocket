'use client'

import { useEffect, useState } from 'react'

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

import CustomTextField from '@core/components/mui/TextField'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import {
  JENIS_LABEL,
  formatCurrency,
  formatTanggal,
  type AlamatPemesanStatus,
  type KeranjangItem,
  type KeranjangResponse,
  type KeranjangSummary
} from '../types'

const KOSONG: KeranjangSummary = { jumlahItem: 0, subtotal: 0, totalBayar: 0 }
const ALAMAT_AWAL: AlamatPemesanStatus = { wajib: false, lengkap: true, alamat: '' }

/** Tab "Informasi Alamat" pada halaman profil */
const PROFIL_ALAMAT_URL = '/my-profile?step=1'

const KonfirmasiBayarView = () => {
  const router = useRouter()

  const [items, setItems] = useState<KeranjangItem[]>([])
  const [summary, setSummary] = useState<KeranjangSummary>(KOSONG)
  const [alamatPemesan, setAlamatPemesan] = useState<AlamatPemesanStatus>(ALAMAT_AWAL)
  const [perluKonfirmasi, setPerluKonfirmasi] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [telepon, setTelepon] = useState('')

  useEffect(() => {
    apiFetchClient<KeranjangResponse>('/api/keranjang', undefined, { redirectOn401: '/login' })
      .then(res => {
        setItems(res.data)
        setSummary(res.summary)
        setAlamatPemesan(res.alamatPemesan ?? ALAMAT_AWAL)
        setPerluKonfirmasi(res.perluKonfirmasi ?? false)
      })
      .catch(err => setError(err.message || 'Gagal memuat keranjang'))
      .finally(() => setLoading(false))
  }, [])

  // Data pemesan diambil dari profil, tetap bisa disesuaikan sebelum bayar
  useEffect(() => {
    apiFetchClient<{ user: any }>('/api/auth/me', undefined, { redirectOn401: '/login' })
      .then(({ user }) => {
        if (!user) return

        setNama(user.name || user.username || '')
        setEmail(user.email || '')
        setTelepon(user.nomorTelepon || '')
      })
      .catch(() => {})
  }, [])

  const handleBayar = async () => {
    if (!telepon.trim()) {
      setError('Nomor telepon harus diisi.')

      return
    }

    // Aset ini mewajibkan alamat pemesan — arahkan ke profil sampai lengkap
    if (alamatPemesan.wajib && !alamatPemesan.lengkap) {
      router.push(PROFIL_ALAMAT_URL)

      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await apiFetchClient<{ data: { paymentUrl: string | null; perluKonfirmasi: boolean } }>(
        '/api/keranjang/checkout',
        {
          method: 'POST',
          body: JSON.stringify({ namaPemesan: nama, email, telepon })
        },
        { redirectOn401: '/login' }
      )

      window.dispatchEvent(new Event('keranjang:updated'))

      // Booking yang perlu persetujuan pemilik belum punya link pembayaran
      if (res.data.perluKonfirmasi || !res.data.paymentUrl) {
        router.push('/booking/saya')

        return
      }

      // Diarahkan ke halaman pembayaran iPaymu
      window.location.href = res.data.paymentUrl
    } catch (err: any) {
      setError(err.message || 'Gagal membuat pembayaran, coba lagi.')
      setSubmitting(false)

      // Alamat bisa saja jadi tidak lengkap lagi setelah halaman dibuka
      if (String(err.message).toLowerCase().includes('alamat')) {
        setAlamatPemesan(prev => ({ ...prev, wajib: true, lengkap: false }))
      }
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center items-center' sx={{ minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity='info'>Keranjang masih kosong.</Alert>
          <Button className='mt-4' variant='tonal' color='secondary' onClick={() => router.push('/home')}>
            Cari Sewa
          </Button>
        </CardContent>
      </Card>
    )
  }

  const aset = items[0]

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card>
          <CardHeader
            title='Konfirmasi Pembayaran'
            subheader={`${summary.jumlahItem} booking — ${aset.asetNama}`}
            avatar={
              <div className='flex flex-col items-center justify-center bg-primary rounded p-2'>
                <i className='tabler-credit-card text-white text-xl' />
              </div>
            }
          />
          <Divider />
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h6'>Data Pemesan</Typography>

            <CustomTextField
              fullWidth
              label='Nama Pemesan'
              value={nama}
              onChange={e => setNama(e.target.value)}
            />
            <CustomTextField fullWidth label='Email' value={email} onChange={e => setEmail(e.target.value)} />
            <CustomTextField
              fullWidth
              label='Nomor Telepon *'
              value={telepon}
              onChange={e => setTelepon(e.target.value)}
              placeholder='08xxxxxxxxxx'
            />

            {alamatPemesan.wajib && (
              <>
                <Divider />

                <Typography variant='h6'>Alamat Pemesan</Typography>

                {alamatPemesan.lengkap ? (
                  <Typography color='text.secondary'>{alamatPemesan.alamat}</Typography>
                ) : (
                  <Alert
                    severity='warning'
                    action={
                      <Button size='small' color='warning' onClick={() => router.push(PROFIL_ALAMAT_URL)}>
                        Lengkapi Alamat
                      </Button>
                    }
                  >
                    Harus lengkapi alamat terlebih dahulu sebelum melanjutkan pembayaran.
                  </Alert>
                )}
              </>
            )}

            <Divider />

            <Typography variant='h6'>Rincian Booking</Typography>

            {items.map(item => (
              <div key={item.id} className='flex justify-between items-start gap-4 border rounded p-4'>
                <div className='flex flex-col gap-1'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <Typography fontWeight={600}>{item.itemAsetNama}</Typography>
                    <Chip size='small' variant='tonal' color='primary' label={JENIS_LABEL[item.jenisHarga] || item.jenisHarga} />
                  </div>
                  <Typography variant='body2' color='text.secondary'>
                    {formatTanggal(item.mulaiSewa, item.jenisHarga)} — {formatTanggal(item.selesaiSewa, item.jenisHarga)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {formatCurrency(item.hargaSatuan)} × {item.durasi} {JENIS_LABEL[item.jenisHarga] || ''}
                  </Typography>
                </div>
                <Typography fontWeight={600}>{formatCurrency(item.total)}</Typography>
              </div>
            ))}

            {error && <Alert severity='error'>{error}</Alert>}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Card>
          <CardHeader title='Total Pembayaran' />
          <Divider />
          <CardContent>
            <div className='flex flex-col gap-3'>
              <div className='flex justify-between'>
                <Typography color='text.secondary'>Aset</Typography>
                <Typography fontWeight={500} className='text-right'>{aset.asetNama}</Typography>
              </div>
              <div className='flex justify-between'>
                <Typography color='text.secondary'>Jumlah Booking</Typography>
                <Typography fontWeight={500}>{summary.jumlahItem}</Typography>
              </div>
              <div className='flex justify-between'>
                <Typography color='text.secondary'>Subtotal</Typography>
                <Typography fontWeight={500}>{formatCurrency(summary.subtotal)}</Typography>
              </div>
            </div>

            <Divider className='my-4' />

            {perluKonfirmasi && (
              <Alert severity='info' className='mbe-4'>
                Booking ini menunggu persetujuan pemilik. Pembayaran baru bisa dilakukan setelah disetujui.
              </Alert>
            )}

            <div className='flex justify-between items-center'>
              <Typography variant='h6'>Total Bayar</Typography>
              <Typography variant='h5' color='primary.main' fontWeight={700}>
                {formatCurrency(summary.totalBayar)}
              </Typography>
            </div>

            <div className='flex flex-col gap-3 mt-6'>
              {alamatPemesan.wajib && !alamatPemesan.lengkap ? (
                <Button
                  fullWidth
                  variant='contained'
                  color='warning'
                  startIcon={<i className='tabler-map-pin' />}
                  onClick={() => router.push(PROFIL_ALAMAT_URL)}
                >
                  Lengkapi Alamat
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant='contained'
                  onClick={handleBayar}
                  disabled={submitting}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={18} color='inherit' />
                    ) : (
                      <i className={perluKonfirmasi ? 'tabler-send' : 'tabler-credit-card'} />
                    )
                  }
                >
                  {submitting ? 'Memproses...' : perluKonfirmasi ? 'Kirim Booking' : 'Bayar Sekarang'}
                </Button>
              )}
              <Button
                fullWidth
                variant='tonal'
                color='secondary'
                onClick={() => router.push('/keranjang')}
                disabled={submitting}
              >
                Kembali ke Keranjang
              </Button>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default KonfirmasiBayarView
