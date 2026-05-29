'use client'

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'

import PenyewaWizard from '@views/apps/penyewa/wizard/PenyewaWizard'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import type { PenyewaClient } from '@/src/types/apps/penyewaTypes'

const PenyewaEditPage = () => {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<PenyewaClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const result = await apiFetchClient<{ data: PenyewaClient }>(`/api/penyewa/${id}`)

        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch penyewa data')
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
        <Alert severity='error'>{error || 'Penyewa tidak ditemukan'}</Alert>
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PenyewaWizard
          mode='edit'
          initialData={{
            ...data,
            email: data.email ?? undefined,
            nomorTelepon: data.nomorTelepon ?? undefined,
            periodeSewa: data.periodeSewa ?? undefined,
            mulaiSewa: data.mulaiSewa ? new Date(data.mulaiSewa) : undefined,
            selesaiSewa: data.selesaiSewa ? new Date(data.selesaiSewa) : undefined,
            alamat: data.alamat ?? undefined,
            provinsi: data.provinsi ?? undefined,
            kota: data.kota ?? undefined,
            kecamatan: data.kecamatan ?? undefined,
            kelurahan: data.kelurahan ?? undefined,
            latitude: data.latitude ?? undefined,
            longitude: data.longitude ?? undefined
          }}
        />
      </Grid>
    </Grid>
  )
}

export default PenyewaEditPage
