import Link from 'next/link'

import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Breadcrumbs from '@mui/material/Breadcrumbs'

import type { TagihanClient } from '@/src/types/apps/tagihanTypes'
import type { PenyewaClient } from '@/src/types/apps/penyewaTypes'

import ViewTagihanListTable from '@views/apps/penyewa/view/ViewTagihanListTable'
import ViewPenyewaCard from '@views/apps/penyewa/view/ViewPenyewaCard'

interface PenyewaListProps {
  initialData?: TagihanClient[]
  penyewaData?: PenyewaClient
  penyewaId?: string
}

const PenyewaList = ({ initialData, penyewaData, penyewaId }: PenyewaListProps) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
          <Link href='/penyewa' style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color='text.primary' sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Pelanggan
            </Typography>
          </Link>
          <Typography color='text.primary'>Detail Penyewa</Typography>
        </Breadcrumbs>
        <Typography variant='h3'>Detail Penyewa</Typography>
        <Divider sx={{ mt: 2 }} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ViewPenyewaCard penyewaId={penyewaId} initialData={penyewaData} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h3'>Tagihan</Typography>
        <Divider sx={{ mt: 2 }} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ViewTagihanListTable asetId={penyewaId} initialData={initialData} />
      </Grid>
    </Grid>
  )
}

export default PenyewaList
