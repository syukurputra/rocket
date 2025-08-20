import Grid from '@mui/material/Grid2'

import KeuanganList from '@views/apps/keuangan/list'

const KeuanganApp = async () => {

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <KeuanganList />
      </Grid>
    </Grid>
  )
}

export default KeuanganApp