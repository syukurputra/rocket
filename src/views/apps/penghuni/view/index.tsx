import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

import type { TagihanClient } from '@/src/types/apps/tagihanTypes'
import type { PenghuniClient } from '@/src/types/apps/penghuniTypes'

import ViewTagihanListTable from '@views/apps/penghuni/view/ViewTagihanListTable'
import ViewPenghuniCard from '@views/apps/penghuni/view/ViewPenghuniCard'

interface PenghuniListProps {
  initialData?: TagihanClient[]
  penghuniData?: PenghuniClient
  penghuniId?: string
}

const PenghuniList = ({ initialData, penghuniData, penghuniId }: PenghuniListProps) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h3'>Detail Penghuni</Typography>
        <Divider />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ViewPenghuniCard
          penghuniId={penghuniId}
          initialData={penghuniData}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ViewTagihanListTable
          asetId={penghuniId}
          initialData={initialData}
        />
      </Grid>
    </Grid>
  )
}

export default PenghuniList

