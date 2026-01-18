import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from 'next/link'

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
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
          <Link href='/aset' style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color='text.primary' sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Aset
            </Typography>
          </Link>
          <Typography color='text.primary'>Detail Aset</Typography>
        </Breadcrumbs>
        <Typography variant='h3'>Detail Aset</Typography>
        <Divider sx={{ mt: 2 }} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ViewAsetCard assetId={assetId} initialData={assetDetailData} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ViewRuanganListTable asetId={assetId} initialData={initialData} />
      </Grid>
    </Grid>
  )
}

export default AsetList
