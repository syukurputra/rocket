import Grid from '@mui/material/Grid2'

import PenyewaList from '@views/apps/penyewa/list'

const PenyewaApp = async () => {

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <PenyewaList />
      </Grid>
    </Grid>
  )
}

export default PenyewaApp
