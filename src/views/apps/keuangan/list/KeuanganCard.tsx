'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

// Utils
import { apiFetchClient } from '@/src/utils/apiFetchClient'

interface SummaryData {
  totalTransaksi: number
  totalPemasukan: number
  totalPengeluaran: number
  saldo: number
}

interface KeuanganCardProps {
  filters?: any
}

const KeuanganCard = ({ filters }: KeuanganCardProps) => {
  // State
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  // Fetch summary data
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)

        const params = new URLSearchParams()
        if (filters) {
          if (filters.searchQuery) params.append('search', filters.searchQuery)
          if (filters.startDate) params.append('startDate', filters.startDate)
          if (filters.endDate) params.append('endDate', filters.endDate)
          if (filters.jenis) params.append('jenis', filters.jenis)
          if (filters.asetId) params.append('asetId', filters.asetId)
          if (filters.categoryKeuanganId) params.append('categoryKeuanganId', filters.categoryKeuanganId)
        }

        const qs = params.toString()
        const url = qs ? `/api/keuangan/summary?${qs}` : '/api/keuangan/summary'

        const result = await apiFetchClient<{ data: SummaryData; message?: string }>(url)

        if (result && result.data) {
          setSummary(result.data)
        }
      } catch (error) {
        console.error('Error fetching summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [JSON.stringify(filters)])

  // Format number to Rupiah
  const formatRupiah = (num: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  // Get current month and year in Indonesian
  const getCurrentMonthYear = (): string => {
    const now = new Date()

    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ]

    const month = months[now.getMonth()]
    const year = now.getFullYear()

    return `${month} ${year}`
  }

  // Data array with dynamic values
  const data = summary
    ? [
        {
          title: summary.totalTransaksi,
          subtitle: 'Total Transaksi',
          icon: 'tabler-file-invoice'
        },
        {
          title: formatRupiah(summary.totalPemasukan),
          subtitle: 'Pemasukan',
          icon: 'tabler-trending-up',
          color: 'success.main'
        },
        {
          title: formatRupiah(summary.totalPengeluaran),
          subtitle: 'Pengeluaran',
          icon: 'tabler-trending-down',
          color: 'error.main'
        },
        {
          title: formatRupiah(summary.saldo),
          subtitle: 'Saldo',
          icon: 'tabler-wallet',
          color: summary.saldo >= 0 ? 'success.main' : 'error.main'
        }
      ]
    : []

  if (loading) {
    return (
      <Card>
        <CardContent className='flex justify-center items-center' style={{ minHeight: '150px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' className='mbe-4' sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
          {getCurrentMonthYear()}
        </Typography>
        <Grid container spacing={6}>
          {data.map((item, index) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
              key={index}
              className={classnames({
                '[&:nth-of-type(odd)>div]:pie-6 [&:nth-of-type(odd)>div]:border-ie':
                  isBelowMdScreen && !isBelowSmScreen,
                '[&:not(:last-child)>div]:pie-6 [&:not(:last-child)>div]:border-ie': !isBelowMdScreen
              })}
            >
              <div className='flex justify-between items-center'>
                <div className='flex flex-col'>
                  <Typography variant='h4'>{item.title}</Typography>
                  <Typography>{item.subtitle}</Typography>
                </div>
                <Avatar variant='rounded' className='is-[42px] bs-[42px]'>
                  <i className={classnames(item.icon, 'text-[26px]')} />
                </Avatar>
              </div>
              {isBelowMdScreen && !isBelowSmScreen && index < data.length - 2 && (
                <Divider
                  className={classnames('mbs-6', {
                    'mie-6': index % 2 === 0
                  })}
                />
              )}
              {isBelowSmScreen && index < data.length - 1 && <Divider className='mbs-6' />}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default KeuanganCard


