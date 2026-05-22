'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import HomeHeader from './HomeHeader'
import PublishedAsetList from './PublishedAsetList'

const HomeView = () => {
  // States
  const [searchValue, setSearchValue] = useState('')

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <HomeHeader searchValue={searchValue} setSearchValue={setSearchValue} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <PublishedAsetList searchValue={searchValue} />
      </Grid>
    </Grid>
  )
}

export default HomeView
