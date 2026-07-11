'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import HeroSection from '@/src/views/front-pages/landing/HeroSection'
import PromoSection from '@/src/views/front-pages/landing/PromoSection'
import UsefulFeature from '@/src/views/front-pages/landing/UsefulFeature'
import CustomerReviews from '@/src/views/front-pages/landing/CustomerReviews'
import OurTeam from '@/src/views/front-pages/landing/OurTeam'
import Pricing from '@/src/views/front-pages/landing/Pricing'
import ProductStat from '@/src/views/front-pages/landing/ProductStat'
import GetStarted from '@/src/views/front-pages/landing/GetStarted'
import { useSettings } from '@core/hooks/useSettings'

const LandingPageWrapper = ({ mode }: { mode: SystemMode }) => {
  // Hooks
  const { updatePageSettings } = useSettings()

  // For Page specific settings
  useEffect(() => {
    return updatePageSettings({
      skin: 'default'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='bg-backgroundDefault'>
      <HeroSection mode={mode} />
      <PromoSection />
      <UsefulFeature />
      {/* <CustomerReviews /> */}
      {/* <OurTeam /> */}
      <Pricing />
      {/* <ProductStat /> */}
      {/* <GetStarted mode={mode} /> */}
    </div>
  )
}

export default LandingPageWrapper
