import Grid from '@mui/material/Grid2'

import PenghuniWizard from '@/src/views/apps/penghuni/wizard/PenghuniWizard'

const PenghuniAddPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PenghuniWizard mode='create' />
      </Grid>
    </Grid>
  )
}

export default PenghuniAddPage
