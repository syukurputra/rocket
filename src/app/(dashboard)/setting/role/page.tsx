import Grid from '@mui/material/Grid2'

import RoleListTable from '@views/apps/role/list/RoleListTable'

const RoleApp = async () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <RoleListTable />
      </Grid>
    </Grid>
  )
}

export default RoleApp
