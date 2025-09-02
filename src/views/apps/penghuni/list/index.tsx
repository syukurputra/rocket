import Grid from '@mui/material/Grid2'

import type { PenghuniClient } from '@/src/types/apps/penghuniTypes'

import PenghuniListTable from '@views/apps/penghuni/list/PenghuniListTable'
import PenghuniCard from '@views/apps/penghuni/list/PenghuniCard'

interface PenghuniListProps {
  initialData?: PenghuniClient[]
}

const PenghuniList = ({ initialData }: PenghuniListProps) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PenghuniCard />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <PenghuniListTable initialData={initialData} />
      </Grid>
    </Grid>
  )
}

export default PenghuniList
