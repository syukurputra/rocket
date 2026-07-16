import Grid from '@mui/material/Grid2'

import HistoryTarikSaldoView from '@/src/views/apps/tarik-saldo/HistoryTarikSaldoView'

const HistoryTarikSaldoPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <HistoryTarikSaldoView />
      </Grid>
    </Grid>
  )
}

export default HistoryTarikSaldoPage
