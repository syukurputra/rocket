'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import { apiFetchClient } from '@/src/utils/apiFetchClient'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'

const CompanyEditView = () => {
  const router = useRouter()
  const { snack, showSnack, closeSnack } = useSnackbar()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telepon: '',
    alamat: '',
    bankPenerima: '',
    nomorRekening: '',
    rekeningPenerima: ''
  })

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await apiFetchClient<{ data: any }>('/api/setting/company')
        const d = res.data

        setFormData({
          nama: d.nama || '',
          email: d.email || '',
          telepon: d.telepon || '',
          alamat: d.alamat || '',
          bankPenerima: d.bankPenerima || '',
          nomorRekening: d.nomorRekening || '',
          rekeningPenerima: d.rekeningPenerima || ''
        })
      } catch (error) {
        console.error('Failed to fetch company:', error)
        showSnack('Gagal memuat data perusahaan', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetchClient('/api/setting/company', {
        method: 'PUT',
        body: JSON.stringify(formData)
      })
      showSnack('Informasi usaha berhasil diperbarui')
      router.push('/setting/company')
    } catch (error: any) {
      console.error('Update company error:', error)
      showSnack(error?.message || 'Gagal memperbarui informasi usaha', 'error')
    } finally {
      setSaving(false)
    }
  }

  const set = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <>
      <Card>
        <CardHeader
          avatar={
            <Tooltip title='Kembali'>
              <IconButton size='small' onClick={() => router.push('/setting/company')}>
                <i className='tabler-arrow-left' />
              </IconButton>
            </Tooltip>
          }
          title='Ubah Informasi Usaha'
          titleTypographyProps={{ variant: 'h5' }}
        />
        <Divider />

        <CardContent>
          {loading ? (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight={240}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth required label='Nama Perusahaan' value={formData.nama} onChange={set('nama')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth type='email' label='Email' value={formData.email} onChange={set('email')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label='Telepon' value={formData.telepon} onChange={set('telepon')} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth multiline rows={3} label='Alamat' value={formData.alamat} onChange={set('alamat')} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant='h6' className='mbe-1'>Rekening Penerimaan</Typography>
                <Divider />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label='Bank Penerima' placeholder='mis. BCA, Mandiri, BNI' value={formData.bankPenerima} onChange={set('bankPenerima')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label='Nomor Rekening' value={formData.nomorRekening} onChange={set('nomorRekening')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label='Rekening Penerima' placeholder='Nama pemilik rekening' value={formData.rekeningPenerima} onChange={set('rekeningPenerima')} />
              </Grid>

              <Grid size={{ xs: 12 }} className='flex justify-end gap-3'>
                <Button color='secondary' onClick={() => router.push('/setting/company')} disabled={saving}>
                  Batal
                </Button>
                <Button variant='contained' onClick={handleSave} disabled={saving || !formData.nama}>
                  {saving ? <CircularProgress size={20} color='inherit' /> : 'Simpan'}
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default CompanyEditView
