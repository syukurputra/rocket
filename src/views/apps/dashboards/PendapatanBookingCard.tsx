'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import classnames from 'classnames'

import CustomAvatar from '@core/components/mui/Avatar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

/**
 * Ringkasan pendapatan booking di dashboard. Angkanya diambil dari sumber yang
 * sama dengan kartu di halaman Informasi Usaha supaya tidak pernah berbeda.
 */
const PendapatanBookingCard = () => {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [jumlahTransaksi, setJumlahTransaksi] = useState(0)
  const [saldoBelumDitarik, setSaldoBelumDitarik] = useState(0)
  const [saldoSudahDitarik, setSaldoSudahDitarik] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transaksi, eligible, history] = await Promise.all([
          apiFetchClient<{ data: { jumlahTransaksi: number } }>('/api/booking/transaksi-summary'),
          apiFetchClient<{ total: { jumlahNominal: number } }>('/api/tarik-saldo/eligible'),
          apiFetchClient<{ data: { jumlahNominal: number }[] }>('/api/tarik-saldo')
        ])

        setJumlahTransaksi(transaksi.data?.jumlahTransaksi ?? 0)
        setSaldoBelumDitarik(eligible.total?.jumlahNominal ?? 0)
        setSaldoSudahDitarik((history.data ?? []).reduce((s, r) => s + Number(r.jumlahNominal ?? 0), 0))
      } catch (error) {
        console.error('Failed to fetch pendapatan booking:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const items = [
    {
      label: 'Total Transaksi',
      value: `${jumlahTransaksi} Transaksi`,
      icon: 'tabler-receipt',
      color: 'primary' as const,
      terisi: jumlahTransaksi > 0
    },
    {
      label: 'Saldo Belum Ditarik',
      value: formatRupiah(saldoBelumDitarik),
      icon: 'tabler-wallet',
      color: 'info' as const,
      terisi: saldoBelumDitarik > 0
    },
    {
      label: 'Saldo Sudah Ditarik',
      value: formatRupiah(saldoSudahDitarik),
      icon: 'tabler-cash-banknote',
      color: 'error' as const,
      terisi: saldoSudahDitarik > 0
    }
  ]

  return (
    <Card>
      <CardHeader
        title='Laporan Pendapatan Booking'
        subheader='Ringkasan transaksi lunas & saldo Anda'
      />
      <Divider />
      <CardContent className='flex flex-col gap-5'>
        {loading ? (
          <Box display='flex' justifyContent='center' py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <div className='flex flex-col gap-5'>
              {items.map(item => (
                <div key={item.label} className='flex flex-col gap-2'>
                  <div className='flex items-center gap-2'>
                    <CustomAvatar skin='light' variant='rounded' color={item.color} size={26}>
                      <i className={classnames(item.icon, 'text-lg')} />
                    </CustomAvatar>
                    <Typography variant='h6' className='leading-6 font-normal'>
                      {item.label}
                    </Typography>
                  </div>
                  <Typography variant='h5'>{item.value}</Typography>
                  <LinearProgress
                    value={item.terisi ? 100 : 0}
                    variant='determinate'
                    color={item.color}
                    className='max-bs-1'
                  />
                </div>
              ))}
            </div>

            <div className='flex flex-col gap-2'>
              <Button
                fullWidth
                variant='contained'
                startIcon={<i className='tabler-cash-banknote' />}
                onClick={() => router.push('/tarik-saldo')}
              >
                Tarik Saldo
              </Button>
              <Button
                fullWidth
                variant='tonal'
                color='secondary'
                startIcon={<i className='tabler-history' />}
                onClick={() => router.push('/tarik-saldo/history')}
              >
                History Tarik Saldo
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PendapatanBookingCard
