'use client'

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { RoleClient } from '@/src/types/apps/roleTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: RoleClient | null
  onSaved?: (data: RoleClient) => void
}

type FormValues = {
  id?: string
  nama: string
  deskripsi: string
  status: boolean
}

const DEFAULTS: FormValues = {
  nama: '',
  deskripsi: '',
  status: true
}

export default function AddEditRole({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        nama: initialData.nama ?? '',
        deskripsi: initialData.deskripsi ?? '',
        status: Boolean(initialData.status)
      })
    } else {
      setForm(DEFAULTS)
    }
  }, [open, mode, initialData])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.nama) {
      setSnack({ open: true, message: 'Nama role harus diisi', severity: 'error' })

      return
    }

    setSaving(true)

    try {
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: RoleClient; message?: string }>(`/api/role/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nama: form.nama,
            deskripsi: form.deskripsi,
            status: form.status
          })
        })

        setSnack({ open: true, message: json.message ?? 'Role berhasil diupdate', severity: 'success' })
        onSaved?.(json.data)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const json = await apiFetchClient<{ data: RoleClient; message?: string }>(`/api/role`, {
          method: 'POST',
          body: JSON.stringify({
            nama: form.nama,
            deskripsi: form.deskripsi,
            status: form.status
          })
        })

        setSnack({ open: true, message: json.message ?? 'Role berhasil ditambahkan', severity: 'success' })
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
          {mode === 'edit' ? 'Ubah Role' : 'Tambah Role'}
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
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Nama Role'
                  name='nama'
                  variant='outlined'
                  placeholder='Nama Role'
                  value={form.nama}
                  onChange={handleChange('nama')}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Deskripsi'
                  name='deskripsi'
                  variant='outlined'
                  placeholder='Deskripsi role'
                  value={form.deskripsi}
                  onChange={handleChange('deskripsi')}
                  multiline
                  minRows={3}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.status}
                      onChange={(_, checked) => setForm(prev => ({ ...prev, status: checked }))}
                    />
                  }
                  label={form.status ? 'Role Aktif' : 'Role Nonaktif'}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={saving || !form.nama}>
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
