import Grid from '@mui/material/Grid2'

import KonfirmasiPembayaranTable from '@views/apps/invoice/konfirmasi/KonfirmasiPembayaranTable'
import KonfirmasiTagihanBookingTable from '@views/apps/invoice/konfirmasi/KonfirmasiTagihanBookingTable'

const KonfirmasiPembayaranPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <KonfirmasiPembayaranTable />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <KonfirmasiTagihanBookingTable />
      </Grid>
    </Grid>
  )
}

export default KonfirmasiPembayaranPage
