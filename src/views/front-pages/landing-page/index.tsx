'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import HeroSection from '@views/front-pages/landing-page/HeroSection'
import UsefulFeature from '@views/front-pages/landing-page/UsefulFeature'
import CustomerReviews from '@views/front-pages/landing-page/CustomerReviews'
import OurTeam from '@views/front-pages/landing-page/OurTeam'
import Pricing from '@views/front-pages/landing-page/Pricing'
import ProductStat from '@views/front-pages/landing-page/ProductStat'
import Faqs from '@views/front-pages/landing-page/Faqs'
import GetStarted from '@views/front-pages/landing-page/GetStarted'
import ContactUs from '@views/front-pages/landing-page/ContactUs'
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
    <div className='bg-backgroundPaper'>
      <HeroSection mode={mode} />
      <UsefulFeature />
      {/* <CustomerReviews /> */}
      {/* <OurTeam /> */}
      <Pricing />
      {/* <ProductStat /> */}
      <Faqs />
      {/* <GetStarted mode={mode} /> */}
      <ContactUs />
    </div>
  )
}

export default LandingPageWrapper
