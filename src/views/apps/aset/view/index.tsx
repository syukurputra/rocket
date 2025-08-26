import { useParams } from 'next/navigation'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

import type { AsetClient } from '@/src/types/apps/asetTypes'
import type { DetailAsetClient } from '@/src/types/apps/detailAsetTypes'

import ViewAsetListTable from '@views/apps/aset/view/ViewAsetListTable'
import ViewAsetCard from '@views/apps/aset/view/ViewAsetCard'

interface AsetListProps {
  initialData?: AsetClient[]
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
        <ViewAsetListTable initialData={initialData} />
      </Grid>
    </Grid>
  )
}

export default AsetList
