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
import type { PenghuniClient } from '@/src/types/apps/penghuniTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import dayjs from "dayjs"

type PenghuniClientWithAction = PenghuniClient & { action?: string }

interface ViewPenghuniCardProps {
  penghuniId?: string
  initialData?: PenghuniClient
}

const ViewPenghuniCard = ({ penghuniId, initialData }: ViewPenghuniCardProps) => {
  const params = useParams()
  const id = penghuniId || (params?.id as string)

  const [penghuniData, setPenghuniData] = useState<PenghuniClient | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {

    if (initialData && penghuniId === id) {
      setPenghuniData(initialData)
      setLoading(false)
      return
    }

    const fetchPenghuniData = async () => {
      if (!id) {
        setError('Penghuni ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const result = await apiFetchClient<{data: PenghuniClient, total: number}>(
        `/api/penghuni/${id}`,
        undefined, {
          redirectOn401: '/id/login'
        })

        if (result && result.data) {
          setPenghuniData(result.data)
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

    fetchPenghuniData()
  }, [id, initialData, penghuniId])

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
              Memuat data penghuni...
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

  if (!penghuniData) {
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
              label='Nama Penghuni'
              name='nama'
              variant='outlined'
              disabled
              value={penghuniData.nama}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Status'
              name='status'
              variant='outlined'
              disabled
              value={penghuniData.status}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Nama Aset'
              name='namaAset'
              variant='outlined'
              disabled
              value={penghuniData.aset?.nama}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Nama Ruangan'
              name='namaRuangan'
              variant='outlined'
              disabled
              value={penghuniData.ruangan?.nama}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Mulai Huni'
              name='mulaiHuni'
              variant='outlined'
              disabled
              value={dayjs(penghuniData.mulaiHuni).format("DD-MM-YYYY")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Selesai Huni'
              name='selesaiHuni'
              variant='outlined'
              disabled
              value={dayjs(penghuniData.mulaiHuni).format("DD-MM-YYYY")}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ViewPenghuniCard
