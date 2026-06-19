'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { FaqType } from '@/src/types/pages/faqTypes'

// Component Imports
import FaqHeader from './FaqHeader'
import Faqs from './Faqs'
import FaqFooter from './FaqFooter'

const FAQ = ({ data }: { data: FaqType[] }) => {
  const [searchValue, setSearchValue] = useState('')

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <FaqHeader searchValue={searchValue} setSearchValue={setSearchValue} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Faqs faqData={data} searchValue={searchValue} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FaqFooter />
      </Grid>
    </Grid>
  )
}

export default FAQ
