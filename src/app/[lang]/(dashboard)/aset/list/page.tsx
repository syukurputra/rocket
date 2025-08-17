import Grid from '@mui/material/Grid2'

import AsetList from '@views/apps/aset/list'

import { getAsetData } from '@/src/app/server/actions'

/* const getInvoiceData = async () => {
  // Vars
  const res = await fetch(`${process.env.API_URL}/apps/invoice`)

  if (!res.ok) {
    throw new Error('Failed to fetch invoice data')
  }

  return res.json()
} */

const AsetApp = async () => {
  // Vars
  const data = await getAsetData()

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <AsetList asetData={data} />
      </Grid>
    </Grid>
  )
}

export default AsetApp
