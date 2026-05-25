'use client'

import { useRouter } from 'next/navigation'

import { Card, CardContent, Typography, Button } from '@mui/material'

import CustomAvatar from '@core/components/mui/Avatar'

import type { MasterPaketClient } from '@/src/types/apps/paketTypes'

interface PaketPricingCardProps {
  paket: MasterPaketClient
  isPopular?: boolean
  isActive?: boolean
  billingCycle: 'monthly' | 'annually'
  buttonLabel?: string
}

const PaketPricingCard = ({ paket, isPopular = false, isActive = false, billingCycle, buttonLabel }: PaketPricingCardProps) => {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push(`/paket/checkout/${paket.id}?cycle=${billingCycle}`)
  }
  const formatPrice = (value: number | string): string =>
    Math.floor(Number(value))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  const monthlyPrice = paket.hargaBulanan
  const yearlyPrice = paket.hargaTahunan

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
              Rp.{formatPrice(monthlyPrice)}
            </Typography>
            <Typography color='text.disabled' className='font-medium'>
              /bulan
            </Typography>
          </div>
          {billingCycle === 'annually' && (
            <Typography color='text.disabled' className='absolute block-start-[100%]'>
              Rp.{formatPrice(yearlyPrice)} / tahun
            </Typography>
          )}
        </div>

        {/* Features List */}
        <div>
          <div className='flex flex-col gap-3 mbs-3'>
            {paket.paketMenus && paket.paketMenus.filter(pm => pm.tampilkan).length > 0 ? (
              paket.paketMenus
                .filter(pm => pm.tampilkan)
                .slice(0, 6)
                .map(pm => (
                <div key={pm.menu.id} className='flex items-center gap-[12px]'>
                  <CustomAvatar color='primary' skin={isPopular ? 'filled' : 'light'} size={20}>
                    <i className='tabler-check text-sm' />
                  </CustomAvatar>
                  <Typography variant='h6'>{pm.deskripsi || pm.menu.keterangan || pm.menu.nama}</Typography>
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
        <Button
          variant={isActive ? 'contained' : 'tonal'}
          fullWidth
          onClick={handleGetStarted}
        >
          {buttonLabel ?? (isActive ? 'Perpanjang Paket' : 'Ubah Paket')}
        </Button>
      </CardContent>
    </Card>
  )
}

export default PaketPricingCard
