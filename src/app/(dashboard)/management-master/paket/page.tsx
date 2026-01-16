import Grid from '@mui/material/Grid2'

import MasterPaketListTable from '@views/apps/master/paket/list/MasterPaketListTable'

const MasterPaketApp = async () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <MasterPaketListTable />
      </Grid>
    </Grid>
  )
}

export default MasterPaketApp
