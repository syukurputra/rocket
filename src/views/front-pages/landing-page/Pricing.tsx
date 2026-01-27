'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Switch from '@mui/material/Switch'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import InputLabel from '@mui/material/InputLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import styles from './styles.module.css'

type PaketMenu = {
  menu: {
    id: string
    nama: string
    keterangan: string | null
    icon: string | null
  }
}

type PricingPlan = {
  id: string
  nama: string
  deskripsi: string | null
  harga: number
  hargaBulanan?: number
  hargaTahunan?: number
  durasi: number
  status: boolean
  paketMenus: PaketMenu[]
}

const PricingPlan = () => {
  // States
  const [pricingPlan, setPricingPlan] = useState<'monthly' | 'annually'>('annually')
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch pricing data from API
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

  const handleChange = (e: ChangeEvent<{ checked: boolean }>) => {
    if (e.target.checked) {
      setPricingPlan('annually')
    } else {
      setPricingPlan('monthly')
    }
  }

  // Get icon based on package name
  const getPackageIcon = (nama: string) => {
    const name = nama.toLowerCase()

    if (name.includes('basic') || name.includes('dasar')) {
      return '/images/front-pages/landing-page/pricing-basic.png'
    } else if (name.includes('team') || name.includes('standard') || name.includes('standar')) {
      return '/images/front-pages/landing-page/pricing-team.png'
    } else if (name.includes('enterprise') || name.includes('bisnis')) {
      return '/images/front-pages/landing-page/pricing-enterprise.png'
    }

    return '/images/front-pages/landing-page/pricing-basic.png'
  }

  // Calculate price
  const getPrice = (plan: PricingPlan) => {
    if (pricingPlan === 'annually') {
      return {
        monthly: plan.hargaTahunan ? plan.hargaTahunan / 12 : plan.harga,
        yearly: plan.hargaTahunan || plan.harga * 12
      }
    }

    return {
      monthly: plan.hargaBulanan || plan.harga,
      yearly: (plan.hargaBulanan || plan.harga) * 12
    }
  }

  return (
    <section
      id='pricing-plans'
      className={classnames(
        'flex flex-col gap-8 lg:gap-12 plb-[100px] bg-backgroundDefault rounded-[60px]',
        styles.sectionStartRadius
      )}
    >
      <div className={classnames('is-full', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center'>
          <Chip size='small' variant='tonal' color='primary' label='Pricing Plans' />
          <div className='flex flex-col items-center gap-y-1 justify-center flex-wrap'>
            <div className='flex items-center gap-x-2'>
              <Typography color='text.primary' variant='h4' className='text-center'>
                <span className='relative z-[1] font-extrabold'>
                  Tailored pricing plans
                  <img
                    src='/images/front-pages/landing-page/bg-shape.png'
                    alt='bg-shape'
                    className='absolute block-end-0 z-[1] bs-[40%] is-[125%] sm:is-[132%] -inline-start-[10%] sm:inline-start-[-19%] block-start-[17px]'
                  />
                </span>{' '}
                designed for you
              </Typography>
            </div>
            <Typography className='text-center'>
              All plans include 40+ advanced tools and features to boost your product.
              <br />
              Choose the best plan to fit your needs.
            </Typography>
          </div>
        </div>
        <div className='flex justify-center items-center max-sm:mlb-3 mbe-6'>
          <InputLabel htmlFor='pricing-switch' className='cursor-pointer'>
            Pay Monthly
          </InputLabel>
          <Switch id='pricing-switch' onChange={handleChange} checked={pricingPlan === 'annually'} />
          <InputLabel htmlFor='pricing-switch' className='cursor-pointer'>
            Pay Annually
          </InputLabel>
          <div className='flex gap-x-1 items-start max-sm:hidden mis-2 mbe-5'>
            <img src='/images/front-pages/landing-page/pricing-arrow.png' width='50' alt='arrow' />
            <Typography className='font-medium'>Save 25%</Typography>
          </div>
        </div>

        {loading ? (
          <Box className='flex justify-center items-center py-20'>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={6}>
            {pricingPlans.map((plan, index) => {
              const price = getPrice(plan)
              const isCurrent = index === 1 // Middle card is popular

              return (
                <Grid key={plan.id} size={{ xs: 12, lg: 4 }}>
                  <Card className={`${isCurrent && 'border-2 border-[var(--mui-palette-primary-main)] shadow-xl'}`}>
                    <CardContent className='flex flex-col gap-8 p-8'>
                      <div className='is-full flex flex-col items-center gap-3'>
                        <img
                          src={getPackageIcon(plan.nama)}
                          alt={plan.nama}
                          height='88'
                          width='86'
                          className='text-center'
                        />
                      </div>
                      <div className='flex flex-col items-center gap-y-[2px] relative'>
                        <Typography className='text-center' variant='h4'>
                          {plan.nama}
                        </Typography>
                        <div className='flex items-baseline gap-x-1'>
                          <Typography variant='h2' color='primary.main' className='font-extrabold'>
                            ${Math.floor(price.monthly / 1000)}
                          </Typography>
                          <Typography color='text.disabled' className='font-medium'>
                            /mo
                          </Typography>
                        </div>
                        {pricingPlan === 'annually' && (
                          <Typography color='text.disabled' className='absolute block-start-[100%]'>
                            ${Math.floor(price.yearly / 1000)} / year
                          </Typography>
                        )}
                      </div>
                      <div>
                        <div className='flex flex-col gap-3 mbs-3'>
                          {plan.paketMenus && plan.paketMenus.length > 0 ? (
                            plan.paketMenus.slice(0, 6).map(pm => (
                              <div key={pm.menu.id} className='flex items-center gap-[12px]'>
                                <CustomAvatar color='primary' skin={isCurrent ? 'filled' : 'light'} size={20}>
                                  <i className='tabler-check text-sm' />
                                </CustomAvatar>
                                <Typography variant='h6'>{pm.menu.keterangan || pm.menu.nama}</Typography>
                              </div>
                            ))
                          ) : (
                            <>
                              <div className='flex items-center gap-[12px]'>
                                <CustomAvatar color='primary' skin={isCurrent ? 'filled' : 'light'} size={20}>
                                  <i className='tabler-check text-sm' />
                                </CustomAvatar>
                                <Typography variant='h6'>Timeline</Typography>
                              </div>
                              <div className='flex items-center gap-[12px]'>
                                <CustomAvatar color='primary' skin={isCurrent ? 'filled' : 'light'} size={20}>
                                  <i className='tabler-check text-sm' />
                                </CustomAvatar>
                                <Typography variant='h6'>Basic search</Typography>
                              </div>
                              <div className='flex items-center gap-[12px]'>
                                <CustomAvatar color='primary' skin={isCurrent ? 'filled' : 'light'} size={20}>
                                  <i className='tabler-check text-sm' />
                                </CustomAvatar>
                                <Typography variant='h6'>Live chat widget</Typography>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <Button component={Link} href='/front-pages/payment' variant={isCurrent ? 'contained' : 'tonal'}>
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}
      </div>
    </section>
  )
}

export default PricingPlan
