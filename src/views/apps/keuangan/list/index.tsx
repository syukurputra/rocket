import Grid from '@mui/material/Grid2'

import type { KeuanganClient } from '@/src/types/apps/keuanganTypes'

import KeuanganListTable from './KeuanganListTable'
import AsetCard from './KeuanganCard'

interface KeuanganListProps {
  initialData?: KeuanganClient[]
}

const AsetList = ({ initialData }: KeuanganListProps) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <AsetCard />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <KeuanganListTable initialData={initialData} />
      </Grid>
    </Grid>
  )
}

export default AsetList
