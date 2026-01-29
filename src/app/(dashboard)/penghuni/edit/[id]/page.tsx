'use client'

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'

import PenghuniWizard from '@views/apps/penghuni/wizard/PenghuniWizard'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import type { PenghuniClient } from '@/src/types/apps/penghuniTypes'

const PenghuniEditPage = () => {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<PenghuniClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const result = await apiFetchClient<{ data: PenghuniClient }>(`/api/penghuni/${id}`)

        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch penghuni data')
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
        <Alert severity='error'>{error || 'Penghuni tidak ditemukan'}</Alert>
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PenghuniWizard
          mode='edit'
          initialData={{
            ...data,
            email: data.email ?? undefined,
            nomorTelepon: data.nomorTelepon ?? undefined,
            periodeSewa: data.periodeSewa ?? undefined,
            mulaiHuni: data.mulaiHuni ? new Date(data.mulaiHuni) : undefined,
            selesaiHuni: data.selesaiHuni ? new Date(data.selesaiHuni) : undefined
          }}
        />
      </Grid>
    </Grid>
  )
}

export default PenghuniEditPage
