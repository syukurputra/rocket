import Grid from '@mui/material/Grid2'

import PenyewaWizard from '@/src/views/apps/penyewa/wizard/PenyewaWizard'

const PenyewaAddPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PenyewaWizard mode='create' />
      </Grid>
    </Grid>
  )
}

export default PenyewaAddPage
