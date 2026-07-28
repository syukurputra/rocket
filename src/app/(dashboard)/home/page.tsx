'use client'

import { Suspense } from 'react'

// Component Imports
import HomeView from '@views/apps/home'

const HomePage = () => {
  return (
    <Suspense fallback={null}>
      <HomeView />
    </Suspense>
  )
}

export default HomePage
