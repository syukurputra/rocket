'use client'

import { Card, CardContent, Typography, Button } from '@mui/material'

import CustomAvatar from '@core/components/mui/Avatar'

import type { MasterPaketClient } from '@/src/types/apps/paketTypes'

interface PaketPricingCardProps {
  paket: MasterPaketClient
  isPopular?: boolean
  isActive?: boolean
  billingCycle: 'monthly' | 'annually'
}

const PaketPricingCard = ({ paket, isPopular = false, isActive = false, billingCycle }: PaketPricingCardProps) => {
  // Calculate price based on billing cycle
  const calculatePrice = () => {
    const basePrice = typeof paket.harga === 'string' ? parseFloat(paket.harga) : paket.harga
    const duration = paket.durasi || 1

    if (billingCycle === 'annually') {
      // Annual price with 10% discount
      return basePrice * duration * 12 * 0.9
    }

    return basePrice
  }

  const displayPrice = calculatePrice()
  const monthlyPrice = billingCycle === 'annually' ? displayPrice / 12 : displayPrice
  const yearlyPrice = billingCycle === 'annually' ? displayPrice : displayPrice * 12

  // Get icon based on package name
  const getPackageIcon = () => {
    const name = paket.nama.toLowerCase()

    if (name.includes('basic') || name.includes('dasar')) {
      return '/images/front-pages/landing-page/pricing-basic.png'
    } else if (name.includes('team') || name.includes('standard') || name.includes('standar')) {
      return '/images/front-pages/landing-page/pricing-team.png'
    } else if (name.includes('enterprise') || name.includes('bisnis')) {
      return '/images/front-pages/landing-page/pricing-enterprise.png'
    }

    return '/images/front-pages/landing-page/pricing-basic.png'
  }

  return (
    <Card
      className={`${isPopular && 'border-2 border-[var(--mui-palette-primary-main)] shadow-xl'}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent className='flex flex-col gap-8 p-8'>
        {/* Icon */}
        <div className='is-full flex flex-col items-center gap-3'>
          <img src={getPackageIcon()} alt={paket.nama} height='88' width='86' className='text-center' />
        </div>

        {/* Package Name & Price */}
        <div className='flex flex-col items-center gap-y-[2px] relative'>
          <Typography className='text-center' variant='h4'>
            {paket.nama}
          </Typography>
          <div className='flex items-baseline gap-x-1'>
            <Typography variant='h2' color='primary.main' className='font-extrabold'>
              Rp.{Math.floor(monthlyPrice / 1000)}
            </Typography>
            <Typography color='text.disabled' className='font-medium'>
              /bulan
            </Typography>
          </div>
          {billingCycle === 'annually' && (
            <Typography color='text.disabled' className='absolute block-start-[100%]'>
              Rp.{Math.floor(yearlyPrice / 1000)} / tahun
            </Typography>
          )}
        </div>

        {/* Features List */}
        <div>
          <div className='flex flex-col gap-3 mbs-3'>
            {paket.paketMenus && paket.paketMenus.length > 0 ? (
              paket.paketMenus.slice(0, 6).map(pm => (
                <div key={pm.menu.id} className='flex items-center gap-[12px]'>
                  <CustomAvatar color='primary' skin={isPopular ? 'filled' : 'light'} size={20}>
                    <i className='tabler-check text-sm' />
                  </CustomAvatar>
                  <Typography variant='h6'>{pm.menu.keterangan || pm.menu.nama}</Typography>
                </div>
              ))
            ) : (
              <>
                <div className='flex items-center gap-[12px]'>
                  <CustomAvatar color='primary' skin={isPopular ? 'filled' : 'light'} size={20}>
                    <i className='tabler-check text-sm' />
                  </CustomAvatar>
                  <Typography variant='h6'>Timeline</Typography>
                </div>
                <div className='flex items-center gap-[12px]'>
                  <CustomAvatar color='primary' skin={isPopular ? 'filled' : 'light'} size={20}>
                    <i className='tabler-check text-sm' />
                  </CustomAvatar>
                  <Typography variant='h6'>Basic search</Typography>
                </div>
                <div className='flex items-center gap-[12px]'>
                  <CustomAvatar color='primary' skin={isPopular ? 'filled' : 'light'} size={20}>
                    <i className='tabler-check text-sm' />
                  </CustomAvatar>
                  <Typography variant='h6'>Live chat widget</Typography>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button variant={isPopular ? 'contained' : 'tonal'} fullWidth disabled={isActive}>
          {isActive ? 'Aktif' : 'Get Started'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default PaketPricingCard
