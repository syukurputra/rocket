import Grid from '@mui/material/Grid2'

import CompanySettings from '@views/apps/setting/company/CompanySettings'

const CompanyPage = async () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <CompanySettings />
      </Grid>
    </Grid>
  )
}

export default CompanyPage
