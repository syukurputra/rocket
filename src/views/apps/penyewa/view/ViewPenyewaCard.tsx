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
import type { PenyewaClient } from '@/src/types/apps/penyewaTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import dayjs from 'dayjs'

type PenyewaClientWithAction = PenyewaClient & { action?: string }

interface ViewPenyewaCardProps {
  penyewaId?: string
  initialData?: PenyewaClient
}

const ViewPenyewaCard = ({ penyewaId, initialData }: ViewPenyewaCardProps) => {
  const params = useParams()
  const id = penyewaId || (params?.id as string)

  const [penyewaData, setPenyewaData] = useState<PenyewaClient | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData && penyewaId === id) {
      setPenyewaData(initialData)
      setLoading(false)
      return
    }

    const fetchPenyewaData = async () => {
      if (!id) {
        setError('Penyewa ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const result = await apiFetchClient<{ data: PenyewaClient; total: number }>(`/api/penyewa/${id}`, undefined, {
          redirectOn401: '/login'
        })

        if (result && result.data) {
          setPenyewaData(result.data)
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

    fetchPenyewaData()
  }, [id, initialData, penyewaId])

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            minHeight='400px'
            flexDirection='column'
            gap={2}
          >
            <CircularProgress size={60} />
            <Typography variant='body1' color='textSecondary'>
              Memuat data penyewa...
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
          <Alert severity='error'>{error}</Alert>
        </CardContent>
      </Card>
    )
  }

  if (!penyewaData) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>{error}</Alert>
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
              label='Nama Penyewa'
              name='nama'
              variant='outlined'
              disabled
              value={penyewaData.nama}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Status'
              name='status'
              variant='outlined'
              disabled
              value={penyewaData.status}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Nama Aset'
              name='namaAset'
              variant='outlined'
              disabled
              value={penyewaData.aset?.nama}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Nama Ruangan'
              name='namaRuangan'
              variant='outlined'
              disabled
              value={penyewaData.ruangan?.nama}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Periode Sewa'
              name='periodeSewa'
              variant='outlined'
              disabled
              value={
                penyewaData.periodeSewa
                  ? penyewaData.periodeSewa.charAt(0).toUpperCase() + penyewaData.periodeSewa.slice(1)
                  : '-'
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Mulai Sewa'
              name='mulaiSewa'
              variant='outlined'
              disabled
              value={dayjs(penyewaData.mulaiSewa).format('DD-MM-YYYY')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Selesai Sewa'
              name='selesaiSewa'
              variant='outlined'
              disabled
              value={dayjs(penyewaData.selesaiSewa).format('DD-MM-YYYY')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Email'
              name='email'
              variant='outlined'
              disabled
              value={penyewaData.email || '-'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Nomor Telepon'
              name='nomorTelepon'
              variant='outlined'
              disabled
              value={penyewaData.nomorTelepon || '-'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Nomor KTP'
              name='nomorKtp'
              variant='outlined'
              disabled
              value={penyewaData.nomorKtp || '-'}
            />
          </Grid>

          {/* Address Section */}
          <Grid size={{ xs: 12 }}>
            <Typography variant='h6' sx={{ mt: 2 }}>
              Alamat Penyewa
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Alamat'
              name='alamat'
              variant='outlined'
              disabled
              multiline
              rows={2}
              value={penyewaData.alamat || '-'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Provinsi'
              name='provinsi'
              variant='outlined'
              disabled
              value={penyewaData.provinsi || '-'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Kota/Kabupaten'
              name='kota'
              variant='outlined'
              disabled
              value={penyewaData.kota || '-'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Kecamatan'
              name='kecamatan'
              variant='outlined'
              disabled
              value={penyewaData.kecamatan || '-'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Kelurahan'
              name='kelurahan'
              variant='outlined'
              disabled
              value={penyewaData.kelurahan || '-'}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ViewPenyewaCard
