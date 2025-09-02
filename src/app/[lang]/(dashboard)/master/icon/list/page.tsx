import Grid from '@mui/material/Grid2'

import AsetList from '@views/apps/master/icon/list'

const MasterIconApp = async () => {

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <AsetList />
      </Grid>
    </Grid>
  )
}

export default MasterIconApp
