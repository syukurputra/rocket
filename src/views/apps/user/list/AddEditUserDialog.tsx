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
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Util Imports
import { apiFetchClient } from '@/src/utils/apiFetchClient'

// Type Imports
import type { UserClient } from '@/src/types/apps/userTypes'

type RoleOption = {
  id: string
  nama: string
}

type CompanyOption = {
  id: string
  nama: string
}

type AddEditUserDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  userData?: UserClient | null
  mode: 'add' | 'edit' | 'invite'
}

const AddEditUserDialog = ({ open, onClose, onSuccess, userData, mode }: AddEditUserDialogProps) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    roleId: '',
    companyId: '',
    verifikasi: false,
    status: true
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Fetch roles and companies
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true)

      try {
        // For invite mode, only fetch roles (company is auto-set from logged-in user)
        if (mode === 'invite') {
          const rolesResult = await apiFetchClient<{ data: RoleOption[] }>('/api/role')

          setRoles(rolesResult.data || [])
        } else {
          // For add/edit mode, fetch both roles and companies
          const [rolesResult, companiesResult] = await Promise.all([
            apiFetchClient<{ data: RoleOption[] }>('/api/role'),
            apiFetchClient<{ data: CompanyOption[] }>('/api/company')
          ])

          setRoles(rolesResult.data || [])
          setCompanies(companiesResult.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch options:', error)
      } finally {
        setLoadingOptions(false)
      }
    }

    if (open) {
      fetchOptions()
    }
  }, [open, mode])

  useEffect(() => {
    if (mode === 'edit' && userData) {
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        password: '',
        roleId: userData.roleId || '',
        companyId: userData.companyId || '',
        verifikasi: userData.verifikasi ?? false,
        status: userData.status ?? true
      })
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        roleId: '',
        companyId: '',
        verifikasi: false,
        status: true
      })
    }

    setErrors({})
    setShowPassword(false)
  }, [mode, userData, open])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // For invite mode, only validate email and role
    if (mode === 'invite') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email harus diisi'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format email tidak valid'
      }

      if (!formData.roleId) {
        newErrors.roleId = 'Role harus dipilih'
      }
    } else {
      // For add/edit mode, validate all fields
      if (!formData.username.trim()) {
        newErrors.username = 'Username harus diisi'
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email harus diisi'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format email tidak valid'
      }

      if (mode === 'add' && !formData.password) {
        newErrors.password = 'Password harus diisi'
      }

      if (mode === 'add' && formData.password && formData.password.length < 6) {
        newErrors.password = 'Password minimal 6 karakter'
      }
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      if (mode === 'invite') {
        // For invite mode, only send email and roleId
        await apiFetchClient('/api/user/invite', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            roleId: formData.roleId
          })
        })
      } else {
        // For add/edit mode, send full user data
        const submitData: any = {
          username: formData.username,
          email: formData.email,
          roleId: formData.roleId || null,
          companyId: formData.companyId || null,
          verifikasi: formData.verifikasi,
          status: formData.status
        }

        // Only include password if it's provided
        if (formData.password) {
          submitData.password = formData.password
        }

        if (mode === 'add') {
          await apiFetchClient('/api/user', {
            method: 'POST',
            body: JSON.stringify(submitData)
          })
        } else if (mode === 'edit' && userData) {
          await apiFetchClient(`/api/user/${userData.id}`, {
            method: 'PUT',
            body: JSON.stringify(submitData)
          })
        }
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
      <DialogTitle>{mode === 'add' ? 'Tambah User' : mode === 'invite' ? 'Undang User' : 'Ubah User'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={4} sx={{ mt: 0.5 }}>
          {mode !== 'invite' && (
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Username'
                placeholder='Masukkan username'
                value={formData.username}
                onChange={e => handleChange('username', e.target.value)}
                error={!!errors.username}
                helperText={errors.username}
                required
              />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Email'
              placeholder='Masukkan email'
              type='email'
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Grid>
          {mode !== 'invite' && (
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={mode === 'add' ? 'Password' : 'Password (kosongkan jika tidak diubah)'}
                placeholder='Masukkan password'
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => handleChange('password', e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                required={mode === 'add'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton edge='end' onClick={() => setShowPassword(!showPassword)}>
                        <i className={showPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          )}
          <Grid size={{ xs: mode === 'invite' ? 12 : 12, sm: mode === 'invite' ? 12 : 6 }}>
            <CustomTextField
              select
              fullWidth
              label='Role'
              value={formData.roleId}
              onChange={e => handleChange('roleId', e.target.value)}
              disabled={loadingOptions}
              error={!!errors.roleId}
              helperText={errors.roleId || (loadingOptions ? 'Memuat role...' : '')}
              required={mode === 'invite'}
            >
              {loadingOptions ? (
                <MenuItem value='' disabled>
                  <em>Memuat role...</em>
                </MenuItem>
              ) : roles.length === 0 ? (
                <MenuItem value='' disabled>
                  <em>Tidak ada role tersedia</em>
                </MenuItem>
              ) : (
                [
                  <MenuItem key='empty' value=''>
                    <em>Pilih Role</em>
                  </MenuItem>,
                  ...roles.map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.nama}
                    </MenuItem>
                  ))
                ]
              )}
            </CustomTextField>
          </Grid>
          {mode !== 'invite' && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label='Company'
                value={formData.companyId}
                onChange={e => handleChange('companyId', e.target.value)}
                disabled={loadingOptions}
              >
                <MenuItem value=''>
                  <em>Pilih Company</em>
                </MenuItem>
                {companies.map(company => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.nama}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
          )}
          {mode !== 'invite' && (
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch checked={formData.verifikasi} onChange={e => handleChange('verifikasi', e.target.checked)} />
                }
                label='Verifikasi User'
              />
            </Grid>
          )}
          {mode !== 'invite' && (
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Switch checked={formData.status} onChange={e => handleChange('status', e.target.checked)} />}
                label='Status Aktif'
              />
            </Grid>
          )}
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
        <Button onClick={handleSubmit} variant='contained' disabled={loading || loadingOptions}>
          {loading ? (
            <div className='flex items-center gap-2'>
              <CircularProgress size={20} />
              {mode === 'invite' && <span>Mengirim...</span>}
            </div>
          ) : mode === 'add' ? (
            'Tambah'
          ) : mode === 'invite' ? (
            'Kirim Undangan'
          ) : (
            'Simpan'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddEditUserDialog
