import Grid from '@mui/material/Grid2'

import type { AsetClient } from '@/src/types/apps/asetTypes'

import AsetListTable from './AsetListTable'
import AsetCard from './AsetCard'

interface AsetListProps {
  initialData?: AsetClient[]
}

const AsetList = ({ initialData }: AsetListProps) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <AsetCard />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <AsetListTable initialData={initialData} />
      </Grid>
    </Grid>
  )
}

export default AsetList
