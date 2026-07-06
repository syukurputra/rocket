'use client'

import { useState, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { apiFetchClient } from '@/src/utils/apiFetchClient'

type DashboardStats = {
  bookingAsetBulanIni: number
  bookingAsetTahunIni: number
}

type StatCardProps = {
  label: string
  value: number | null
  icon: string
  color: string
  loading: boolean
}

const StatCard = ({ label, value, icon, color, loading }: StatCardProps) => (
  <Card>
    <CardContent sx={{ p: '20px !important' }}>
      <Box display='flex' alignItems='center' gap={3}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}.main`,
            flexShrink: 0
          }}
        >
          <i className={`${icon} text-white text-2xl`} />
        </Box>
        <Box>
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            <Typography variant='h4' fontWeight={700} lineHeight={1.2}>
              {value ?? 0}
            </Typography>
          )}
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            {label}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const BookingStatsCard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    apiFetchClient<{ data: DashboardStats }>('/api/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <StatCard
        label='Total Booking Aset Bulan Ini'
        value={stats?.bookingAsetBulanIni ?? null}
        icon='tabler-calendar-stats'
        color='info'
        loading={loading}
      />
      <StatCard
        label='Total Booking Aset Tahun Ini'
        value={stats?.bookingAsetTahunIni ?? null}
        icon='tabler-chart-bar'
        color='secondary'
        loading={loading}
      />
    </>
  )
}

export default BookingStatsCard
