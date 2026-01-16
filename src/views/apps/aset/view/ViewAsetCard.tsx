'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import CustomTextField from '@core/components/mui/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Third-party Imports
import type { DetailAsetClient } from '@/src/types/apps/detailAsetTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type AsetClientWithAction = DetailAsetClient & { action?: string }

interface ViewAsetCardProps {
  assetId?: string
  initialData?: DetailAsetClient
}

const ViewAsetCard = ({ assetId, initialData }: ViewAsetCardProps) => {
  const params = useParams()
  const id = assetId || (params?.id as string)

  const [assetData, setAssetData] = useState<DetailAsetClient | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {

    if (initialData && assetId === id) {
      setAssetData(initialData)
      setLoading(false)
      return
    }

    const fetchAssetData = async () => {
      if (!id) {
        setError('Asset ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const result = await apiFetchClient<{data: DetailAsetClient, total: number}>(
        `/api/aset/${id}`,
        undefined, {
          redirectOn401: '/login'
        })

        if (result && result.data) {
          setAssetData(result.data)
        } else {
          setError('No data received from server')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching asset:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssetData()
  }, [id, initialData, assetId])

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
            flexDirection="column"
            gap={2}
          >
            <CircularProgress size={60} />
            <Typography variant="body1" color="textSecondary">
              Memuat data aset...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!assetData) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Jenis Bangunan'
              name='jenis'
              variant='outlined'
              disabled
              value={assetData.jenis}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Nama Bangunan'
              name='nama'
              variant='outlined'
              disabled
              value={assetData.nama}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Alamat'
              name='alamat'
              variant='outlined'
              disabled
              value={assetData.alamat}
              multiline
              minRows={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Provinsi'
              name='provinsi'
              variant='outlined'
              disabled
              value={assetData.provinsi}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Kota'
              name='kota'
              variant='outlined'
              disabled
              value={assetData.kota}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={assetData.status}
                  disabled
                />
              } label={assetData.status ? 'Aset Aktif' : 'Aset Nonaktif'}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ViewAsetCard


