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
import type { AsetClient } from '@/src/types/apps/asetTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { useRouter } from 'next/navigation'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: AsetClient | null
  onSaved?: (data: AsetClient) => void
}

type FormValues = {
  id?: string
  jenis: string
  nama: string
  alamat: string
  kota: string
  provinsi: string
  status: boolean
}

const JENIS_OPTIONS = [
  { label: 'Pilih Bangunan', value: '' },
  { label: 'Kost', value: 'kost' },
  { label: 'Rumah', value: 'rumah' },
  { label: 'Apartemen', value: 'apartemen' }
]

const DEFAULTS: FormValues = {
  jenis: '',
  nama: '',
  alamat: '',
  kota: '',
  provinsi: '',
  status: true
}

export default function AddEditRuang({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })
  const [pendingSaved, setPendingSaved] = useState<AsetClient | null>(null)

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
        jenis: initialData.jenis ?? '',
        nama: initialData.nama ?? '',
        alamat: initialData.alamat ?? '',
        kota: initialData.kota ?? '',
        provinsi: initialData.provinsi ?? '',
        status: Boolean(initialData.status)
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
    // validasi singkat
    if (!form.jenis || !form.nama) {
      setSnack({ open: true, message: 'Mohon lengkapi semua field yang diperlukan', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      if (mode === 'edit' && form.id) {
        // PUT /api/aset/[id]
        const json = await apiFetchClient<{ data: AsetClient; message?: string }>(`/api/aset/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            jenis: form.jenis,
            nama: form.nama,
            alamat: form.alamat,
            kota: form.kota,
            provinsi: form.provinsi,
            status: form.status
          })
        })
        setPendingSaved(json.data)
        setSnack({ open: true, message: json.message ?? 'Aset berhasil diupdate', severity: 'success' })
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        // POST /api/aset
        const json = await apiFetchClient<{ data: AsetClient; message?: string }>(`/api/aset`, {
          method: 'POST',
          body: JSON.stringify({
            jenis: form.jenis,
            nama: form.nama,
            alamat: form.alamat,
            kota: form.kota,
            provinsi: form.provinsi,
            status: form.status
          })
        })
        setPendingSaved(json.data)
        setSnack({ open: true, message: json.message ?? 'Aset berhasil ditambahkan', severity: 'success' })
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
          {mode === 'edit' ? 'Ubah Aset' : 'Tambah Aset'}
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
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Jenis Bangunan'
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
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Nama Bangunan'
                  name='nama'
                  variant='outlined'
                  placeholder='Nama Bangunan'
                  value={form.nama}
                  onChange={handleChange('nama')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Alamat'
                  name='alamat'
                  variant='outlined'
                  placeholder='Jl ...'
                  value={form.alamat}
                  onChange={handleChange('alamat')}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Provinsi'
                  name='provinsi'
                  variant='outlined'
                  placeholder='Nama Provinsi'
                  value={form.provinsi}
                  onChange={handleChange('provinsi')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Kota'
                  name='kota'
                  variant='outlined'
                  placeholder='Nama Kota'
                  value={form.kota}
                  onChange={handleChange('kota')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                  <Switch
                    checked={form.status}
                    onChange={(_, checked) => setForm(prev => ({ ...prev, status: checked }))}
                  />
                } label={form.status ? 'Aset Aktif' : 'Aset Nonaktif'}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={saving || !form.jenis || !form.nama}>
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
