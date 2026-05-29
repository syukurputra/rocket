'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Switch from '@mui/material/Switch'
import Chip from '@mui/material/Chip'
import InputLabel from '@mui/material/InputLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import PaketPricingCard from '@/src/components/pricing/PaketPricingCard'

// Type Imports
import type { MasterPaketClient } from '@/src/types/apps/paketTypes'

// Hook Imports
import { useAuth } from '@/src/hooks/useAuth'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import styles from './styles.module.css'

const PricingPlan = () => {
  const [pricingPlan, setPricingPlan] = useState<'monthly' | 'annually'>('annually')
  const [pricingPlans, setPricingPlans] = useState<MasterPaketClient[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const activePaketId = user?.company?.paketId ?? null

  const getButtonLabel = (paketId: string): string => {
    if (!user) return 'Mulai Sekarang'

    return paketId === activePaketId ? 'Perpanjang Paket' : 'Ubah Paket'
  }

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/public/paket')
        const data = await response.json()

        setPricingPlans(data.data || [])
      } catch (error) {
        console.error('Failed to fetch pricing:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPricing()
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPricingPlan(e.target.checked ? 'annually' : 'monthly')
  }

  const getPopularIndex = () => {
    if (pricingPlans.length === 3) return 1
    if (pricingPlans.length === 2) return 1

    return -1
  }

  return (
    <section
      id='pricing-plans'
      className={classnames(
        'flex flex-col gap-8 lg:gap-12 plb-[100px] bg-backgroundDefault',
        styles.sectionStartRadius
      )}
    >
      <div className={classnames('is-full', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center'>
          <Chip size='small' variant='tonal' color='primary' label='Paket Harga' />
          <div className='flex flex-col items-center gap-y-1 justify-center flex-wrap'>
            <div className='flex items-center gap-x-2'>
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
            </div>
            <Typography className='text-center'>
              Semua paket mencakup 20+ fitur canggih untuk meningkatkan bisnis properti Anda.
              <br />
              Pilih paket terbaik yang sesuai dengan kebutuhan Anda.
            </Typography>
          </div>
        </div>

        <div className='flex justify-center items-center max-sm:mlb-3 mbe-6'>
          <InputLabel htmlFor='pricing-switch' className='cursor-pointer'>
            Bayar Bulanan
          </InputLabel>
          <Switch id='pricing-switch' onChange={handleChange} checked={pricingPlan === 'annually'} />
          <InputLabel htmlFor='pricing-switch' className='cursor-pointer'>
            Bayar Tahunan
          </InputLabel>
        </div>

        {loading ? (
          <Box className='flex justify-center items-center py-20'>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={6} justifyContent='center'>
            {pricingPlans.map((plan, index) => (
              <Grid key={plan.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <PaketPricingCard
                  paket={plan}
                  isPopular={index === getPopularIndex()}
                  isActive={plan.id === activePaketId}
                  billingCycle={pricingPlan}
                  buttonLabel={getButtonLabel(plan.id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </div>
    </section>
  )
}

export default PricingPlan
