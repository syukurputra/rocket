import Grid from '@mui/material/Grid2'

import CategoryKeuanganListTable from '@views/apps/setting/category-keuangan/list/CategoryKeuanganListTable'

const CategoryKeuanganApp = async () => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <CategoryKeuanganListTable />
      </Grid>
    </Grid>
  )
}

export default CategoryKeuanganApp
