// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import MonthlyFinancialReport from '@views/apps/dashboards/MonthlyFinancialReport'
import CategoryKeuangan from '@/src/views/apps/dashboards/CategoryKeuangan'
import DashboardCard from '@/src/views/apps/dashboards/DashboardCard'
import BookingStatsCard from '@/src/views/apps/dashboards/BookingStatsCard'

const Dashboard = async () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <DashboardCard />
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <MonthlyFinancialReport />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Grid container spacing={6} direction='column'>
          <Grid size={{ xs: 12 }}>
            <CategoryKeuangan />
          </Grid>
          <BookingStatsCard />
        </Grid>
      </Grid>
    </Grid>
  )
}

export default Dashboard
