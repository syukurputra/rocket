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
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { CompanyClient } from '@/src/types/apps/companyTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: CompanyClient | null
  onSaved?: (data: CompanyClient) => void
}

type FormValues = {
  id?: string
  nama: string
  alamat: string
  telepon: string
  email: string
  status: boolean
}

const DEFAULTS: FormValues = {
  nama: '',
  alamat: '',
  telepon: '',
  email: '',
  status: true
}

export default function AddEditCompany({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  const handleSnackClose = () => {
    closeSnack()
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        nama: initialData.nama ?? '',
        alamat: initialData.alamat ?? '',
        telepon: initialData.telepon ?? '',
        email: initialData.email ?? '',
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
      showSnack('Nama company harus diisi', 'error')

      return
    }

    setSaving(true)

    try {
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: CompanyClient; message?: string }>(`/api/company/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nama: form.nama,
            alamat: form.alamat,
            telepon: form.telepon,
            email: form.email,
            status: form.status
          })
        })

        showSnack(json.message ?? 'Company berhasil diupdate')
        onSaved?.(json.data)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const json = await apiFetchClient<{ data: CompanyClient; message?: string }>(`/api/company`, {
          method: 'POST',
          body: JSON.stringify({
            nama: form.nama,
            alamat: form.alamat,
            telepon: form.telepon,
            email: form.email,
            status: form.status
          })
        })

        showSnack(json.message ?? 'Company berhasil ditambahkan')
        onSaved?.(json.data)
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'

      showSnack(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} maxWidth='md' scroll='body' sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
        <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          {mode === 'edit' ? 'Ubah Company' : 'Tambah Company'}
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
                  label='Nama Company'
                  name='nama'
                  variant='outlined'
                  placeholder='Nama Company'
                  value={form.nama}
                  onChange={handleChange('nama')}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Alamat'
                  name='alamat'
                  variant='outlined'
                  placeholder='Alamat lengkap'
                  value={form.alamat}
                  onChange={handleChange('alamat')}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Telepon'
                  name='telepon'
                  variant='outlined'
                  placeholder='08xx xxxx xxxx'
                  value={form.telepon}
                  onChange={handleChange('telepon')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Email'
                  name='email'
                  type='email'
                  variant='outlined'
                  placeholder='email@company.com'
                  value={form.email}
                  onChange={handleChange('email')}
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
                  label={form.status ? 'Company Aktif' : 'Company Nonaktif'}
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
      <AppSnackbar snack={snack} onClose={handleSnackClose} />
    </>
  )
}
