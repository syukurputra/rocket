import Grid from '@mui/material/Grid2'

import TarikSaldoManagementView from '@/src/views/apps/management-master/tarik-saldo/TarikSaldoManagementView'

const TarikSaldoManagementPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <TarikSaldoManagementView />
      </Grid>
    </Grid>
  )
}

export default TarikSaldoManagementPage
