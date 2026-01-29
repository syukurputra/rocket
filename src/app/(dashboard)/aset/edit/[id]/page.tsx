'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import AsetWizard from '@views/apps/aset/wizard/AsetWizard'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import type { AsetClient } from '@/src/types/apps/asetTypes'

const AsetEditPage = () => {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<AsetClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        setLoading(true)
        const result = await apiFetchClient<{ data: AsetClient }>(`/api/aset/${id}`)
        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch asset data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 20 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 6 }}>
        <Alert severity='error'>{error || 'Aset tidak ditemukan'}</Alert>
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <AsetWizard mode='edit' initialData={data} />
      </Grid>
    </Grid>
  )
}

export default AsetEditPage
