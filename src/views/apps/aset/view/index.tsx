import { useParams } from 'next/navigation'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

import type { RuanganClient } from '@/src/types/apps/ruanganTypes'
import type { DetailAsetClient } from '@/src/types/apps/detailAsetTypes'

import ViewRuanganListTable from '@views/apps/aset/view/ViewRuanganListTable'
import ViewAsetCard from '@views/apps/aset/view/ViewAsetCard'

interface AsetListProps {
  initialData?: RuanganClient[]
  assetDetailData?: DetailAsetClient
  assetId?: string
}

const AsetList = ({ initialData, assetDetailData, assetId }: AsetListProps) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h3'>Detail Aset</Typography>
        <Divider />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ViewAsetCard
          assetId={assetId}
          initialData={assetDetailData}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ViewRuanganListTable
          ruanganId={assetId}
          initialData={initialData}
        />
      </Grid>
    </Grid>
  )
}

export default AsetList
