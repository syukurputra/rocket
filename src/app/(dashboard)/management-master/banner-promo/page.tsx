import Grid from '@mui/material/Grid2'
import BannerPromoListTable from '@/src/views/apps/banner-promo/list/BannerPromoListTable'

const BannerPromoPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <BannerPromoListTable />
      </Grid>
    </Grid>
  )
}

export default BannerPromoPage
