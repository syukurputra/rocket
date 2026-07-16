import Grid from '@mui/material/Grid2'

import TarikSaldoView from '@/src/views/apps/tarik-saldo/TarikSaldoView'

const TarikSaldoPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <TarikSaldoView />
      </Grid>
    </Grid>
  )
}

export default TarikSaldoPage
