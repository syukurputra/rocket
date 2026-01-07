'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Util Imports
import { apiFetchClient } from '@/src/utils/apiFetchClient'

// Type Imports
import type { CompanyClient } from '@/src/types/apps/companyTypes'

type AddEditCompanyDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  companyData?: CompanyClient | null
  mode: 'add' | 'edit'
}

const AddEditCompanyDialog = ({ open, onClose, onSuccess, companyData, mode }: AddEditCompanyDialogProps) => {
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    telepon: '',
    email: '',
    status: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === 'edit' && companyData) {
      setFormData({
        nama: companyData.nama || '',
        alamat: companyData.alamat || '',
        telepon: companyData.telepon || '',
        email: companyData.email || '',
        status: companyData.status ?? true
      })
    } else {
      setFormData({
        nama: '',
        alamat: '',
        telepon: '',
        email: '',
        status: true
      })
    }
    setErrors({})
  }, [mode, companyData, open])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama company harus diisi'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      if (mode === 'add') {
        await apiFetchClient('/api/company', {
          method: 'POST',
          body: JSON.stringify(formData)
        })
      } else if (mode === 'edit' && companyData) {
        await apiFetchClient(`/api/company/${companyData.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Submit error:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Terjadi kesalahan' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>{mode === 'add' ? 'Tambah Company' : 'Edit Company'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={4} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Nama Company'
              placeholder='Masukkan nama company'
              value={formData.nama}
              onChange={e => handleChange('nama', e.target.value)}
              error={!!errors.nama}
              helperText={errors.nama}
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Alamat'
              placeholder='Masukkan alamat'
              value={formData.alamat}
              onChange={e => handleChange('alamat', e.target.value)}
              multiline
              rows={3}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Telepon'
              placeholder='Masukkan nomor telepon'
              value={formData.telepon}
              onChange={e => handleChange('telepon', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Email'
              placeholder='Masukkan email'
              type='email'
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={<Switch checked={formData.status} onChange={e => handleChange('status', e.target.checked)} />}
              label='Status Aktif'
            />
          </Grid>
          {errors.submit && (
            <Grid size={{ xs: 12 }}>
              <div className='text-error'>{errors.submit}</div>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='tonal' color='secondary' disabled={loading}>
          Batal
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? <CircularProgress size={20} /> : mode === 'add' ? 'Tambah' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddEditCompanyDialog
