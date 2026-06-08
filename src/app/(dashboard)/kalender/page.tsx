import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'

import KalenderView from '@views/apps/kalender/KalenderView'

const KalenderPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Kalender Booking</Typography>
        <Typography variant='body2' color='text.secondary'>
          Jadwal booking item aset berdasarkan bulan berjalan
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <KalenderView />
      </Grid>
    </Grid>
  )
}

export default KalenderPage
