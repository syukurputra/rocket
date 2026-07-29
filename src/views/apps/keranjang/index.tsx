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
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { apiFetchClient } from '@/src/utils/apiFetchClient'
import { JENIS_LABEL, formatCurrency, formatTanggal, type KeranjangItem, type KeranjangResponse, type KeranjangSummary } from './types'

const KOSONG: KeranjangSummary = { jumlahItem: 0, subtotal: 0, totalBayar: 0 }

const KeranjangView = () => {
  const router = useRouter()

  const [items, setItems] = useState<KeranjangItem[]>([])
  const [summary, setSummary] = useState<KeranjangSummary>(KOSONG)
  const [loading, setLoading] = useState(true)
  const [hapusId, setHapusId] = useState('')
  const [error, setError] = useState('')

  const fetchKeranjang = useCallback(async () => {
    try {
      const res = await apiFetchClient<KeranjangResponse>('/api/keranjang', undefined, { redirectOn401: '/login' })

      setItems(res.data)
      setSummary(res.summary)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat keranjang')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeranjang()
  }, [fetchKeranjang])

  const handleHapus = async (id: string) => {
    setHapusId(id)
    setError('')

    try {
      await apiFetchClient(`/api/keranjang/${id}`, { method: 'DELETE' }, { redirectOn401: '/login' })
      window.dispatchEvent(new Event('keranjang:updated'))
      await fetchKeranjang()
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus item')
    } finally {
      setHapusId('')
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
        <CardContent className='flex flex-col items-center gap-4 plb-12'>
          <i className='tabler-shopping-cart-off text-[64px] text-textDisabled' />
          <Typography variant='h5'>Keranjang Masih Kosong</Typography>
          <Typography color='text.secondary' className='text-center'>
            Cari sewa yang kamu butuhkan, lalu tambahkan ke keranjang untuk dibayar sekaligus.
          </Typography>
          <Button variant='contained' startIcon={<i className='tabler-search' />} onClick={() => router.push('/home')}>
            Cari Sewa
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Semua item pasti dari aset yang sama — dijaga sejak penambahan ke keranjang
  const aset = items[0]

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader
            title='Keranjang'
            subheader={`${summary.jumlahItem} booking — ${aset.asetNama}`}
            avatar={
              <div className='flex flex-col items-center justify-center bg-primary rounded p-2'>
                <i className='tabler-shopping-cart text-white text-xl' />
              </div>
            }
          />
          <Divider />
          <CardContent className='flex flex-col gap-4'>
            {error && <Alert severity='error'>{error}</Alert>}

            {items.map(item => (
              <div key={item.id} className='flex items-start gap-4 border rounded p-4'>
                <div className='flex-1 flex flex-col gap-2'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <Typography variant='h6'>{item.itemAsetNama}</Typography>
                    <Chip size='small' variant='tonal' color='primary' label={JENIS_LABEL[item.jenisHarga] || item.jenisHarga} />
                  </div>

                  <div className='flex items-center gap-2 text-textSecondary'>
                    <i className='tabler-clock text-base' />
                    <Typography variant='body2' color='text.secondary'>
                      {formatTanggal(item.mulaiSewa, item.jenisHarga)} — {formatTanggal(item.selesaiSewa, item.jenisHarga)}
                    </Typography>
                  </div>

                  <Typography variant='body2' color='text.secondary'>
                    {formatCurrency(item.hargaSatuan)} × {item.durasi} {JENIS_LABEL[item.jenisHarga] || ''}
                  </Typography>

                  {item.catatan && (
                    <Typography variant='body2' color='text.secondary'>
                      Catatan: {item.catatan}
                    </Typography>
                  )}
                </div>

                <div className='flex flex-col items-end gap-2'>
                  <Typography fontWeight={600}>{formatCurrency(item.total)}</Typography>
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() => handleHapus(item.id)}
                    disabled={hapusId === item.id}
                  >
                    {hapusId === item.id ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-trash' />}
                  </IconButton>
                </div>
              </div>
            ))}

            <Button
              variant='tonal'
              color='secondary'
              startIcon={<i className='tabler-shopping-cart-plus' />}
              onClick={() => router.push(`/publish/${aset.asetId}`)}
            >
              Tambah Booking Lain di Aset Ini
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardHeader title='Ringkasan' />
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

            <div className='flex justify-between items-center'>
              <Typography variant='h6'>Total Bayar</Typography>
              <Typography variant='h5' color='primary.main' fontWeight={700}>
                {formatCurrency(summary.totalBayar)}
              </Typography>
            </div>

            <div className='flex flex-col gap-3 mt-6'>
              <Button
                fullWidth
                variant='contained'
                startIcon={<i className='tabler-credit-card' />}
                onClick={() => router.push('/keranjang/konfirmasi')}
              >
                Bayar
              </Button>
              <Button fullWidth variant='tonal' color='secondary' onClick={() => router.push('/home')}>
                Lanjut Cari Sewa
              </Button>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default KeranjangView
