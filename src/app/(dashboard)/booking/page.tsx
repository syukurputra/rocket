import Grid from '@mui/material/Grid2'

import BookingList from '@/src/views/apps/booking/list'

const BookingPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <BookingList />
      </Grid>
    </Grid>
  )
}

export default BookingPage
