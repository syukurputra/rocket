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
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { IconClient } from '@/src/types/apps/iconTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { styled } from '@mui/material/styles'
import { useRouter } from 'next/navigation'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: IconClient | null
  onSaved?: (data: IconClient) => void
}

type FormValues = {
  id?: string
  nama: string
  jenis: string
  code: string
  color: string
}

const JENIS_OPTIONS = [
  { label: 'Jenis Keuangan', value: '' },
  { label: 'Pemasukan', value: 'pemasukan' },
  { label: 'Pengeluaran', value: 'pengeluaran' },
]

const COLOR_OPTIONS = [
  { value: 'primary-light' },
  { value: 'primary-main' },
  { value: 'primary-dark' },
  { value: 'secondary-light' },
  { value: 'secondary-main' },
  { value: 'secondary-dark' },
  { value: 'error-light' },
  { value: 'error-main' },
  { value: 'error-dark' },
  { value: 'warning-light' },
  { value: 'warning-main' },
  { value: 'warning-dark' },
  { value: 'info-light' },
  { value: 'info-main' },
  { value: 'info-dark' },
  { value: 'success-light' },
  { value: 'success-main' },
  { value: 'success-dark' },
  { value: 'primary-lighterOpacity' },
  { value: 'primary-lightOpacity' },
  { value: 'primary-mainOpacity' },
  { value: 'primary-darkOpacity' },
  { value: 'primary-darkerOpacity' },
  { value: 'secondary-lighterOpacity' },
  { value: 'secondary-lightOpacity' },
  { value: 'secondary-mainOpacity' },
  { value: 'secondary-darkOpacity' },
  { value: 'secondary-darkerOpacity' },
  { value: 'error-lighterOpacity' },
  { value: 'error-lightOpacity' },
  { value: 'error-mainOpacity' },
  { value: 'error-darkOpacity' },
  { value: 'error-darkerOpacity' },
  { value: 'warning-lighterOpacity' },
  { value: 'warning-lightOpacity' },
  { value: 'warning-mainOpacity' },
  { value: 'warning-darkOpacity' },
  { value: 'warning-darkerOpacity' },
  { value: 'info-lighterOpacity' },
  { value: 'info-lightOpacity' },
  { value: 'info-mainOpacity' },
  { value: 'info-darkOpacity' },
  { value: 'info-darkerOpacity' },
  { value: 'success-lighterOpacity' },
  { value: 'success-lightOpacity' },
  { value: 'success-mainOpacity' },
  { value: 'success-darkOpacity' },
  { value: 'success-darkerOpacity' },
]

const DEFAULTS: FormValues = {
  nama: '',
  jenis: '',
  code: '',
  color: ''
}

const Icon = styled('i')({})

export default function AddEditIcon({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })
  const [pendingSaved, setPendingSaved] = useState<IconClient | null>(null)

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
    if (pendingSaved) {
      onSaved?.(pendingSaved)
      setPendingSaved(null)
      router.refresh()
    }
    setOpen(false) // tutup dialog setelah snackbar ditutup
  }

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        nama: initialData.nama ?? '',
        jenis: initialData.jenis ?? '',
        code: initialData.code ?? '',
        color: initialData.color ?? ''
      })
    } else {
      setForm(DEFAULTS)
    }
  }, [open, mode, initialData])

  const handleChange =
    (key: keyof FormValues) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.nama || !form.jenis || !form.code || !form.color) {
      setSnack({ open: true, message: 'Mohon lengkapi semua field yang diperlukan', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: IconClient; message?: string }>(`/api/master/icon/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nama: form.nama,
            jenis: form.jenis,
            code: form.code,
            color: form.color
          })
        })
        setPendingSaved(json.data)
        setSnack({ open: true, message: json.message ?? 'Icon berhasil diupdate', severity: 'success' })
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        const json = await apiFetchClient<{ data: IconClient; message?: string }>(`/api/master/icon`, {
          method: 'POST',
          body: JSON.stringify({
            nama: form.nama,
            jenis: form.jenis,
            code: form.code,
            color: form.color
          })
        })
        setPendingSaved(json.data)
        setSnack({ open: true, message: json.message ?? 'Icon berhasil ditambahkan', severity: 'success' })
        setTimeout(() => {
          window.location.reload()
        }, 3000)
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
      <Dialog
        open={open}
        maxWidth='md'
        scroll='body'
        closeAfterTransition={false}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          {mode === 'edit' ? 'Ubah Icon' : 'Tambah Icon'}
        </DialogTitle>
        <form onSubmit={(e) => {
          e.preventDefault()
          if (!saving) handleSubmit()
        }}>
          <DialogContent className='pbs-0 sm:pli-16'>
            <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
              <i className='tabler-x' />
            </DialogCloseButton>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Nama Icon'
                  name='nama'
                  variant='outlined'
                  placeholder='Nama Icon'
                  value={form.nama}
                  onChange={handleChange('nama')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Jenis Keuangan'
                  name='jenis'
                  variant='outlined'
                  value={form.jenis}
                  onChange={handleChange('jenis')}
                >
                  {JENIS_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Code Icon'
                  name='code'
                  variant='outlined'
                  placeholder='Code Icon'
                  value={form.code}
                  onChange={handleChange('code')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Warna'
                  name='color'
                  variant='outlined'
                  value={form.color}
                  onChange={handleChange('color')}
                >
                  {COLOR_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon
                          className='tabler-circle-filled'
                          sx={{ color: `var(--mui-palette-${opt.value})` }}
                        />
                      </div>
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className="justify-center pbs-0 sm:pbe-16 sm:pli-16">
            <Button variant="text" onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant="contained" type="submit" disabled={saving || !form.jenis || !form.nama}>
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
