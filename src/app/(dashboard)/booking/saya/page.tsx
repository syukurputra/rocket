import Grid from '@mui/material/Grid2'

import BookingList from '@/src/views/apps/booking/list'

const BookingSayaPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <BookingList />
      </Grid>
    </Grid>
  )
}

export default BookingSayaPage
