'use client'

import { Suspense } from 'react'

import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import CompanyEditView from '@/src/views/apps/setting/company/CompanyEditView'

const CompanyEditPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <Suspense
          fallback={
            <Box display='flex' justifyContent='center' alignItems='center' minHeight={300}>
              <CircularProgress />
            </Box>
          }
        >
          <CompanyEditView />
        </Suspense>
      </Grid>
    </Grid>
  )
}

export default CompanyEditPage
