'use client'

// Next Imports
import { useSearchParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import PublishedAsetList from './PublishedAsetList'
import PromoSection from '@/src/views/front-pages/landing/PromoSection'

const HomeView = () => {
  const searchParams = useSearchParams()
  const searchValue = searchParams.get('search') || ''

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PromoSection embedded />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <PublishedAsetList searchValue={searchValue} />
      </Grid>
    </Grid>
  )
}

export default HomeView
