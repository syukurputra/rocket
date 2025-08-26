import Grid from '@mui/material/Grid2'

import AsetList from '@views/apps/aset/list'

const AsetApp = async () => {

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <AsetList />
      </Grid>
    </Grid>
  )
}

export default AsetApp
