import Grid from '@mui/material/Grid2'

import TarikSaldoManagementDetailView from '@/src/views/apps/management-master/tarik-saldo/TarikSaldoManagementDetailView'

const TarikSaldoManagementDetailPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <TarikSaldoManagementDetailView />
      </Grid>
    </Grid>
  )
}

export default TarikSaldoManagementDetailPage
