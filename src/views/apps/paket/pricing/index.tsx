'use client'

import { useState, useEffect } from 'react'

import { Card, CardContent, Typography, Switch, CircularProgress, Alert, Box, InputLabel, Chip } from '@mui/material'
import Grid from '@mui/material/Grid2'

import type { MasterPaketClient } from '@/src/types/apps/paketTypes'
import PaketPricingCard from '@/src/components/pricing/PaketPricingCard'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import { useAuth } from '@/src/hooks/useAuth'

const PaketPricingPlans = () => {
  const [data, setData] = useState<MasterPaketClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually')
  const { user } = useAuth()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiFetchClient<{ data: MasterPaketClient[] }>('/api/master/paket')

      // Filter only active packages and sort by price
      const activePackages = (response.data || []).filter(paket => paket.status)

      setData(activePackages)
    } catch (err) {
      console.error('Failed to fetch pakets:', err)
      setError('Gagal memuat data paket')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingCycle(e.target.checked ? 'annually' : 'monthly')
  }

  // Determine which package should be marked as popular (middle one or second one)
  const getPopularIndex = () => {
    if (data.length === 3) return 1 // Middle card for 3 packages
    if (data.length === 2) return 1 // Second card for 2 packages

    return -1 // No popular badge for other cases
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 6, md: 12 },
        px: { xs: 2, sm: 3, md: 4 }
      }}
    >
      {/* Header Section */}
      <Box className='flex flex-col gap-y-4 items-center justify-center mb-8'>
        <Chip size='small' variant='tonal' color='primary' label='Pricing Plans' />
        <Box className='flex flex-col items-center gap-y-1 justify-center flex-wrap'>
          <Box className='flex items-center gap-x-2'>
            <Typography color='text.primary' variant='h4' className='text-center'>
              <span className='relative z-[1] font-extrabold'>
                Paket harga terbaik
                <img
                  src='/images/front-pages/landing-page/bg-shape.png'
                  alt='bg-shape'
                  className='absolute block-end-0 z-[1] bs-[40%] is-[125%] sm:is-[132%] -inline-start-[10%] sm:inline-start-[-19%] block-start-[17px]'
                />
              </span>{' '}
              dirancang untuk Anda
            </Typography>
          </Box>
          <Typography className='text-center' color='text.secondary'>
            Semua paket mencakup 40+ fitur canggih untuk meningkatkan bisnis properti Anda.
            <br />
            Pilih paket terbaik yang sesuai dengan kebutuhan Anda.
          </Typography>
        </Box>
      </Box>

      {/* Billing Cycle Toggle */}
      <Box className='flex justify-center items-center max-sm:mlb-3 mbe-6'>
        <InputLabel htmlFor='pricing-switch' className='cursor-pointer'>
          Bayar Bulanan
        </InputLabel>
        <Switch id='pricing-switch' onChange={handleChange} checked={billingCycle === 'annually'} />
        <InputLabel htmlFor='pricing-switch' className='cursor-pointer'>
          Bayar Tahunan
        </InputLabel>
        {/* <Box className='flex gap-x-1 items-start max-sm:hidden mis-2 mbe-5'>
          <img src='/images/front-pages/landing-page/pricing-arrow.png' width='50' alt='arrow' />
          <Typography className='font-medium'>Save 25%</Typography>
        </Box> */}
      </Box>

      {/* Loading State */}
      {loading && (
        <Box className='flex justify-center items-center py-20'>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity='error' sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && data.length === 0 && (
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent className='text-center py-20'>
            <Typography variant='h6' color='text.secondary'>
              Belum ada paket yang tersedia
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards Grid */}
      {!loading && !error && data.length > 0 && (
        <Grid container spacing={6} justifyContent='center'>
          {data.map((paket, index) => (
            <Grid key={paket.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <PaketPricingCard
                paket={paket}
                isPopular={index === getPopularIndex()}
                isActive={paket.id === user?.company?.paketId}
                billingCycle={billingCycle}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default PaketPricingPlans
