import Grid from '@mui/material/Grid2'

import NotifikasiList from '@views/apps/notifikasi'

const NotifikasiPage = () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <NotifikasiList />
      </Grid>
    </Grid>
  )
}

export default NotifikasiPage
