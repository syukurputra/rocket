'use client'

import { useState, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type LastInvoice = {
  id: string
  nomorInvoice: string
  billingCycle: string
  subtotal: number
  pajak: number
  total: number
  tanggalBayar: string | null
  tanggalInvoice: string
  paket: {
    id: string
    nama: string
    deskripsi: string | null
    hargaBulanan: number
    hargaTahunan: number
  } | null
}

type Company = {
  id: string
  nama: string
  alamat: string | null
  telepon: string | null
  email: string | null
  status: boolean
  paketId: string | null
  paketStartDate: string | null
  paketEndDate: string | null
  paket?: { id: string; nama: string; deskripsi: string | null } | null
  lastInvoice?: LastInvoice | null
}

const CompanySettings = () => {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    telepon: '',
    email: ''
  })

  const fetchCompany = async () => {
    try {
      setLoading(true)
      const response = await apiFetchClient<{ data: Company }>('/api/setting/company')

      setCompany(response.data)
      setFormData({
        nama: response.data.nama,
        alamat: response.data.alamat || '',
        telepon: response.data.telepon || '',
        email: response.data.email || ''
      })
    } catch (error) {
      console.error('Failed to fetch company:', error)
      showSnack('Gagal memuat data perusahaan', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompany()
  }, [])

  const handleEditClick = () => {
    if (company) {
      setFormData({
        nama: company.nama,
        alamat: company.alamat || '',
        telepon: company.telepon || '',
        email: company.email || ''
      })
      setEditDialogOpen(true)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await apiFetchClient<{ data: Company }>('/api/setting/company', {
        method: 'PUT',
        body: JSON.stringify(formData)
      })

      setCompany(response.data)
      setEditDialogOpen(false)
      showSnack('Data perusahaan berhasil diperbarui')
    } catch (error) {
      console.error('Failed to update company:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui data perusahaan'

      showSnack(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'

    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className='flex justify-center items-center p-10'>
            <CircularProgress />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!company) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>Data perusahaan tidak ditemukan</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Grid container spacing={6}>
        {/* Company Information Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <div className='flex justify-between items-center mb-6'>
                <Typography variant='h5'>Informasi Perusahaan</Typography>
                <Button variant='contained' onClick={handleEditClick} startIcon={<i className='tabler-edit' />}>
                  Ubah
                </Button>
              </div>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Nama Perusahaan
                  </Typography>
                  <Typography variant='body1' fontWeight={600} className='mt-1'>
                    {company.nama}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Email
                  </Typography>
                  <Typography variant='body1' className='mt-1'>
                    {company.email || '-'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Telepon
                  </Typography>
                  <Typography variant='body1' className='mt-1'>
                    {company.telepon || '-'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Status
                  </Typography>
                  <div className='mt-1'>
                    {company.status ? (
                      <Chip label='Aktif' color='success' size='small' variant='tonal' />
                    ) : (
                      <Chip label='Nonaktif' color='error' size='small' variant='tonal' />
                    )}
                  </div>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Alamat
                  </Typography>
                  <Typography variant='body1' className='mt-1'>
                    {company.alamat || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Package Information Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant='h5' className='mb-6'>
                Informasi Paket
              </Typography>

              {company.lastInvoice ? (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='caption' color='text.secondary'>
                      Paket Aktif
                    </Typography>
                    <Typography variant='h6' className='mt-1'>
                      {company.lastInvoice.paket?.nama || company.paket?.nama || '-'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant='caption' color='text.secondary'>
                      Siklus Pembayaran
                    </Typography>
                    <Typography variant='body1' fontWeight={600} className='mt-1'>
                      {company.lastInvoice.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant='caption' color='text.secondary'>
                      Total Pembayaran Terakhir
                    </Typography>
                    <Typography variant='body1' fontWeight={600} color='primary.main' className='mt-1'>
                      {formatCurrency(Number(company.lastInvoice.total))}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant='caption' color='text.secondary'>
                      No. Invoice
                    </Typography>
                    <Typography variant='body2' className='mt-1'>
                      {company.lastInvoice.nomorInvoice}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant='caption' color='text.secondary'>
                      Periode Aktif
                    </Typography>
                    <Typography variant='body2' className='mt-1'>
                      {formatDate(company.paketStartDate)} - {formatDate(company.paketEndDate)}
                    </Typography>
                  </Grid>
                </Grid>
              ) : company.paket ? (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='caption' color='text.secondary'>
                      Paket Aktif
                    </Typography>
                    <Typography variant='h6' className='mt-1'>
                      {company.paket.nama}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='caption' color='text.secondary'>
                      Periode Aktif
                    </Typography>
                    <Typography variant='body2' className='mt-1'>
                      {formatDate(company.paketStartDate)} - {formatDate(company.paketEndDate)}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity='info'>Tidak ada paket aktif</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => !saving && setEditDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Ubah Informasi Perusahaan</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mt-1'>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Nama Perusahaan'
                value={formData.nama}
                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Telepon'
                value={formData.telepon}
                onChange={e => setFormData({ ...formData, telepon: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Alamat'
                multiline
                rows={3}
                value={formData.alamat}
                onChange={e => setFormData({ ...formData, alamat: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSave} variant='contained' disabled={saving || !formData.nama}>
            {saving ? <CircularProgress size={20} /> : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default CompanySettings
