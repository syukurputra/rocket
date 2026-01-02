'use client'

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { UserClient } from '@/src/types/apps/userTypes'
import type { RoleClient } from '@/src/types/apps/roleTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: UserClient | null
  onSaved?: (data: UserClient) => void
}

type FormValues = {
  id?: string
  username: string
  email: string
  password: string
  roleId: string
  verifikasi: boolean
}

const DEFAULTS: FormValues = {
  username: '',
  email: '',
  password: '',
  roleId: '',
  verifikasi: false
}

export default function AddEditUser({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })
  const [roles, setRoles] = useState<RoleClient[]>([])

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
    setOpen(false)
  }

  // Fetch roles
  useEffect(() => {
    if (!open) return

    const fetchRoles = async () => {
      try {
        const result = await apiFetchClient<{ data: RoleClient[] }>('/api/role')

        setRoles(result.data || [])
      } catch (error) {
        console.error('Failed to fetch roles:', error)
      }
    }

    fetchRoles()
  }, [open])

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        username: initialData.username ?? '',
        email: initialData.email ?? '',
        password: '', // Don't show password in edit mode
        roleId: initialData.roleId ?? '',
        verifikasi: Boolean(initialData.verifikasi)
      })
    } else {
      setForm(DEFAULTS)
    }
  }, [open, mode, initialData])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.username || !form.email) {
      setSnack({ open: true, message: 'Username dan email harus diisi', severity: 'error' })

      return
    }

    if (mode === 'create' && !form.password) {
      setSnack({ open: true, message: 'Password harus diisi', severity: 'error' })

      return
    }

    setSaving(true)

    try {
      if (mode === 'edit' && form.id) {
        // For edit, we need a separate endpoint (to be created)
        setSnack({ open: true, message: 'Edit user belum diimplementasikan', severity: 'error' })
      } else {
        const json = await apiFetchClient<{ data: UserClient; message?: string }>(`/api/user`, {
          method: 'POST',
          body: JSON.stringify({
            username: form.username,
            email: form.email,
            password: form.password,
            roleId: form.roleId || undefined,
            verifikasi: form.verifikasi
          })
        })

        setSnack({ open: true, message: json.message ?? 'User berhasil ditambahkan', severity: 'success' })
        onSaved?.(json.data)
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'

      setSnack({ open: true, message: msg, severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} maxWidth='md' scroll='body' sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
        <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          {mode === 'edit' ? 'Ubah User' : 'Tambah User'}
        </DialogTitle>
        <form
          onSubmit={e => {
            e.preventDefault()
            if (!saving) handleSubmit()
          }}
        >
          <DialogContent className='pbs-0 sm:pli-16'>
            <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
              <i className='tabler-x' />
            </DialogCloseButton>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Username'
                  name='username'
                  variant='outlined'
                  placeholder='Username'
                  value={form.username}
                  onChange={handleChange('username')}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Email'
                  name='email'
                  type='email'
                  variant='outlined'
                  placeholder='user@example.com'
                  value={form.email}
                  onChange={handleChange('email')}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label={mode === 'edit' ? 'Password (kosongkan jika tidak diubah)' : 'Password'}
                  name='password'
                  type='password'
                  variant='outlined'
                  placeholder='••••••••'
                  value={form.password}
                  onChange={handleChange('password')}
                  required={mode === 'create'}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Role'
                  name='roleId'
                  variant='outlined'
                  value={form.roleId}
                  onChange={handleChange('roleId')}
                >
                  <MenuItem value=''>Pilih Role</MenuItem>
                  {roles.map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.nama}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.verifikasi}
                      onChange={(_, checked) => setForm(prev => ({ ...prev, verifikasi: checked }))}
                    />
                  }
                  label='Verified'
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={saving || !form.username || !form.email}>
              {mode === 'edit' ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: theme => theme.zIndex.snackbar + 1 }}
      >
        <Alert onClose={handleSnackClose} severity={snack.severity} variant='filled' sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  )
}
