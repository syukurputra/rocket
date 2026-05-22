'use client'

import { useState, useEffect } from 'react'

import { useSearchParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { MasterPaketClient } from '@/src/types/apps/paketTypes'

// Component Imports
import CheckoutCard from './CheckoutCard'
import CheckoutActions from './CheckoutActions'

// Utils
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import { useAuth } from '@/src/hooks/useAuth'

interface CheckoutViewProps {
  paketId: string
}

const CheckoutView = ({ paketId }: CheckoutViewProps) => {
  const [paket, setPaket] = useState<MasterPaketClient | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const searchParams = useSearchParams()
  const billingCycle = (searchParams.get('cycle') as 'monthly' | 'annually') || 'annually'

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => {
    const fetchPaket = async () => {
      try {
        setLoading(true)
        const response = await apiFetchClient<{ data: MasterPaketClient }>(
          `/api/master/paket/${paketId}`,
          undefined,
          { redirectOn401: '/login' }
        )

        setPaket(response.data)
      } catch (err) {
        console.error('Failed to fetch paket:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPaket()
  }, [paketId])

  if (loading) {
    return (
      <Box className='flex justify-center items-center' sx={{ minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs className='mb-6'>
        <Link href='/paket/pricing' color='inherit' underline='hover'>
          <Typography color='text.secondary'>Paket</Typography>
        </Link>
        <Typography color='text.primary'>Checkout</Typography>
      </Breadcrumbs>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 9 }}>
          <CheckoutCard
            paket={paket}
            loading={loading}
            billingCycle={billingCycle}
            company={user?.company}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <CheckoutActions paketId={paketId} billingCycle={billingCycle} onPrint={handlePrint} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default CheckoutView
