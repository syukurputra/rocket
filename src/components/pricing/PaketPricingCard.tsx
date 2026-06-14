'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, Typography, Button, CircularProgress } from '@mui/material'

import CustomAvatar from '@core/components/mui/Avatar'

import type { MasterPaketClient } from '@/src/types/apps/paketTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

const DEFAULT_PAKET_ID = 'cmkzpagu800015k6czrtvc7f4'

interface PaketPricingCardProps {
  paket: MasterPaketClient
  isPopular?: boolean
  isActive?: boolean
  billingCycle: 'monthly' | 'annually'
  buttonLabel?: string
  isTrial?: boolean
  onTrialActivated?: () => void
}

const PaketPricingCard = ({ paket, isPopular = false, isActive = false, billingCycle, buttonLabel, isTrial = false, onTrialActivated }: PaketPricingCardProps) => {
  const router = useRouter()
  const [trialLoading, setTrialLoading] = useState(false)

  const showTrialButton = !isTrial && paket.id !== DEFAULT_PAKET_ID

  const handleGetStarted = () => {
    router.push(`/paket/checkout/${paket.id}?cycle=${billingCycle}`)
  }

  const handleTrial = async () => {
    setTrialLoading(true)
    try {
      await apiFetchClient('/api/paket/trial', {
        method: 'POST',
        body: JSON.stringify({ paketId: paket.id })
      })
      onTrialActivated?.()
    } catch {
      // silently fail — parent handles refresh
    } finally {
      setTrialLoading(false)
    }
  }
  const formatPrice = (value: number | string): string =>
    Math.floor(Number(value))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  const monthlyPrice = paket.hargaBulanan
  const yearlyPrice = paket.hargaTahunan

  // Get icon: use uploaded icon if available, otherwise fallback to default
  const getPackageIcon = () => {
    if (paket.iconUrl) {
      return paket.iconUrl
    }

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
        {isActive && paket.id === DEFAULT_PAKET_ID ? null : showTrialButton ? (
          <div className='flex flex-col gap-2'>
            <Button
              variant='contained'
              color='success'
              fullWidth
              onClick={handleTrial}
              disabled={trialLoading}
              startIcon={trialLoading ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-rocket' />}
            >
              {trialLoading ? 'Mengaktifkan...' : 'Coba Gratis'}
            </Button>
            <Button variant='tonal' fullWidth onClick={handleGetStarted} size='small'>
              Beli Sekarang
            </Button>
          </div>
        ) : (
          <Button
            variant={isActive ? 'contained' : 'tonal'}
            fullWidth
            onClick={handleGetStarted}
          >
            {buttonLabel ?? (isActive ? 'Perpanjang Paket' : 'Ubah Paket')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default PaketPricingCard
