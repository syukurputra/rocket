import Grid from '@mui/material/Grid2'

import PenghuniList from '@views/apps/penghuni/list'

const PenghuniApp = async () => {

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <PenghuniList />
      </Grid>
    </Grid>
  )
}

export default PenghuniApp
