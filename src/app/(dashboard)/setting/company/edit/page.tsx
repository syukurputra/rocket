import Grid from '@mui/material/Grid2'

import CompanyEditView from '@/src/views/apps/setting/company/CompanyEditView'

const CompanyEditPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <CompanyEditView />
      </Grid>
    </Grid>
  )
}

export default CompanyEditPage
