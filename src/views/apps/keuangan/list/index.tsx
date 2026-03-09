'use client'

import { useState } from 'react'
import Grid from '@mui/material/Grid2'

import type { KeuanganClient } from '@/src/types/apps/keuanganTypes'

import KeuanganListTable from '@views/apps/keuangan/list/KeuanganListTable'
import AsetCard from '@views/apps/keuangan/list/KeuanganCard'

interface KeuanganListProps {
  initialData?: KeuanganClient[]
}

const AsetList = ({ initialData }: KeuanganListProps) => {
  const [filters, setFilters] = useState<any>(null)

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <AsetCard filters={filters} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <KeuanganListTable initialData={initialData} onFiltersChange={setFilters} />
      </Grid>
    </Grid>
  )
}

export default AsetList


