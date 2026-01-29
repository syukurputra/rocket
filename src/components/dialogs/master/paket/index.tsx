'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

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
import type { MasterPaketClient } from '@/src/types/apps/paketTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: MasterPaketClient | null
  onSaved?: (data: MasterPaketClient) => void
}

type FormValues = {
  id?: string
  nama: string
  deskripsi: string
  harga: string
  status: boolean
}

const DEFAULTS: FormValues = {
  nama: '',
  deskripsi: '',
  harga: '',
  status: true
}

export default function AddEditPaket({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
  }

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        nama: initialData.nama ?? '',
        deskripsi: initialData.deskripsi ?? '',
        harga: initialData.harga?.toString() ?? '',
        status: initialData.status ?? true
      })
    } else {
      setForm(DEFAULTS)
    }
  }, [open, mode, initialData])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, status: e.target.checked }))

  const handleSubmit = async () => {
    if (!form.nama) {
      setSnack({ open: true, message: 'Nama paket harus diisi', severity: 'error' })

      return
    }

    setSaving(true)

    try {
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: MasterPaketClient; message?: string }>(
          `/api/master/paket/${form.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              nama: form.nama,
              deskripsi: form.deskripsi || null,
              harga: parseFloat(form.harga),
              status: form.status
            })
          }
        )

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Show success message - REMOVED to avoid double toast with parent
        // setSnack({ open: true, message: json.message ?? 'Paket berhasil diupdate', severity: 'success' })

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
      } else {
        const json = await apiFetchClient<{ data: MasterPaketClient; message?: string }>(`/api/master/paket`, {
          method: 'POST',
          body: JSON.stringify({
            nama: form.nama,
            deskripsi: form.deskripsi || null,
            harga: parseFloat(form.harga),
            status: form.status
          })
        })

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Show success message - REMOVED to avoid double toast with parent
        // setSnack({ open: true, message: json.message ?? 'Paket berhasil ditambahkan', severity: 'success' })

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'

      setSnack({ open: true, message: msg, severity: 'error' })
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} maxWidth='md' scroll='body' sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
        <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          {mode === 'edit' ? 'Ubah Paket' : 'Tambah Paket'}
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
                  label='Nama Paket'
                  name='nama'
                  variant='outlined'
                  placeholder='Contoh: Paket Basic, Paket Premium'
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
                  placeholder='Deskripsi paket (optional)'
                  value={form.deskripsi}
                  onChange={handleChange('deskripsi')}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Harga'
                  name='harga'
                  type='number'
                  variant='outlined'
                  placeholder='0'
                  value={form.harga}
                  onChange={handleChange('harga')}
                  required
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={form.status} onChange={handleStatusChange} />}
                  label='Status Aktif'
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={saving || !form.nama || !form.harga}>
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
