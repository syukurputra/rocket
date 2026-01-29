import Grid from '@mui/material/Grid2'

import AsetWizard from '@views/apps/aset/wizard/AsetWizard'

const AsetAddPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <AsetWizard mode='create' />
      </Grid>
    </Grid>
  )
}

export default AsetAddPage
