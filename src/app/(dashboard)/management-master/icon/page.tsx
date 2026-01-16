import Grid from '@mui/material/Grid2'

import IconList from '@views/apps/master/icon/list'

const MasterIconApp = async () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <IconList />
      </Grid>
    </Grid>
  )
}

export default MasterIconApp
