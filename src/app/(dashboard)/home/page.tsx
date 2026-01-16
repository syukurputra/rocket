// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import MonthlyFinancialReport from '@views/apps/dashboards/MonthlyFinancialReport'
import CategoryKeuangan from '@/src/views/apps/dashboards/CategoryKeuangan'

const Dashboard = async () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <MonthlyFinancialReport />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <CategoryKeuangan />
      </Grid>
    </Grid>
  )
}

export default Dashboard
