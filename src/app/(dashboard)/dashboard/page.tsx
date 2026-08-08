// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import MonthlyFinancialReport from '@views/apps/dashboards/MonthlyFinancialReport'
import CategoryKeuangan from '@/src/views/apps/dashboards/CategoryKeuangan'
import DashboardCard from '@/src/views/apps/dashboards/DashboardCard'
import BookingTransactionChart from '@/src/views/apps/dashboards/BookingTransactionChart'
import PendapatanBookingCard from '@/src/views/apps/dashboards/PendapatanBookingCard'

const Dashboard = async () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <DashboardCard />
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <MonthlyFinancialReport />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <BookingTransactionChart />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <CategoryKeuangan />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <PendapatanBookingCard />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default Dashboard
