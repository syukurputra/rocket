import Grid from '@mui/material/Grid2'

import TarikSaldoDetailView from '@/src/views/apps/tarik-saldo/TarikSaldoDetailView'

const TarikSaldoDetailPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <TarikSaldoDetailView />
      </Grid>
    </Grid>
  )
}

export default TarikSaldoDetailPage
