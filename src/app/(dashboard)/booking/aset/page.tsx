import Grid from '@mui/material/Grid2'

import BookingAsetList from '@/src/views/apps/booking/aset'

const BookingAsetPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <BookingAsetList />
      </Grid>
    </Grid>
  )
}

export default BookingAsetPage
