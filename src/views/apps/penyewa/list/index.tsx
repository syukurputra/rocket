import Grid from '@mui/material/Grid2'

import type { PenyewaClient } from '@/src/types/apps/penyewaTypes'

import PenyewaListTable from '@views/apps/penyewa/list/PenyewaListTable'
import PenyewaCard from '@views/apps/penyewa/list/PenyewaCard'

interface PenyewaListProps {
  initialData?: PenyewaClient[]
}

const PenyewaList = ({ initialData }: PenyewaListProps) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PenyewaCard />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <PenyewaListTable initialData={initialData} />
      </Grid>
    </Grid>
  )
}

export default PenyewaList


