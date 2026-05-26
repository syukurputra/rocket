'use client'

import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Types Imports
import type { CardStatsHorizontalWithBorderProps } from '@/src/types/pages/widgetTypes'
import HorizontalWithBorder from '@components/card-statistics/HorizontalWithBorder'

// Utils
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type DashboardStats = {
  totalAsetAktif: number
  totalRuanganHuni: number
  totalRuanganTidakHuni: number
  penyewaSelesaiHuni: number
}

const DashboardCard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await apiFetchClient<{ data: DashboardStats }>('/api/dashboard/stats')

        setStats(response.data)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
        setError('Gagal memuat statistik dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className='flex justify-center items-center p-10'>
        <CircularProgress />
      </div>
    )
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  if (!stats) {
    return <Alert severity='info'>Tidak ada data statistik</Alert>
  }

  const data: CardStatsHorizontalWithBorderProps[] = [
    {
      title: 'Aset Aktif',
      stats: stats.totalAsetAktif.toString(),
      icon: 'tabler-building',
      color: 'primary'
    },
    {
      title: 'Ruangan Huni',
      stats: stats.totalRuanganHuni.toString(),
      icon: 'tabler-home-check',
      color: 'success'
    },
    {
      title: 'Ruangan Tidak Huni',
      stats: stats.totalRuanganTidakHuni.toString(),
      icon: 'tabler-home-x',
      color: 'warning'
    },
    {
      title: 'Selesai Huni 1 Bulan',
      stats: stats.penyewaSelesaiHuni.toString(),
      icon: 'tabler-calendar-time',
      color: 'error'
    }
  ]

  return (
    <Grid container spacing={6}>
      {data.map((item, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
          <HorizontalWithBorder {...item} />
        </Grid>
      ))}
    </Grid>
  )
}

export default DashboardCard
