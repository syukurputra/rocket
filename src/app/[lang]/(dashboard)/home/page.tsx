// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import EarningReportsWithTabs from '@views/apps/dashboards/EarningReportsWithTabs'
import MonthlyFinancialReport from '@views/apps/dashboards/MonthlyFinancialReport'

const Dashboard = async () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <EarningReportsWithTabs />
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <MonthlyFinancialReport />
      </Grid>
    </Grid>
  )
}

export default Dashboard
