'use client'

import { useParams } from 'next/navigation'
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
import type { RuanganClient } from '@/src/types/apps/ruanganTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { useRouter } from 'next/navigation'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: RuanganClient | null
  asetId?: string
  onSaved?: (data: RuanganClient) => void
}

type FormValues = {
  id?: string
  nama: string
  nominal: number
  status: boolean
}

const DEFAULTS: FormValues = {
  nama: '',
  nominal: 0.0,
  status: true
}

export default function AddEditRuang({ open, setOpen, mode = 'create', initialData, asetId, onSaved }: Props) {
  const params = useParams()
  const finalAsetId = asetId || (params?.id as string)

  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })
  const [pendingSaved, setPendingSaved] = useState<RuanganClient | null>(null)

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
        nominal: initialData.nominal ?? 0.0,
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

  const formatNumber = (num: number): string => {
    if (!num) return ''
    return num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[^\d,]/g, '') // Keep comma for decimal
    rawValue = rawValue.replace(',', '.') // Convert comma to dot
    const numericValue = parseFloat(rawValue) || 0
    setForm(prev => ({ ...prev, nominal: numericValue }))
  }

  const handleSubmit = async () => {
    if (!form.nama || !form.nominal) {
      setSnack({ open: true, message: 'Mohon lengkapi semua field yang diperlukan', severity: 'error' })
      return
    }

    if (mode === 'create' && !finalAsetId) {
      setSnack({ open: true, message: 'Asset ID diperlukan untuk membuat ruangan baru', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      const requestBody: any = {
        nama: form.nama,
        nominal: form.nominal,
        status: form.status
      }

      if (finalAsetId && finalAsetId.trim() !== '') {
        requestBody.asetId = finalAsetId
      }

      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: RuanganClient; message?: string }>(`/api/ruangan/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(requestBody)
        })
        setPendingSaved(json.data)
        setSnack({ open: true, message: json.message ?? 'Ruangan berhasil diupdate', severity: 'success' })
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        const json = await apiFetchClient<{ data: RuanganClient; message?: string }>(`/api/ruangan`, {
          method: 'POST',
          body: JSON.stringify(requestBody)
        })
        setPendingSaved(json.data)
        setSnack({ open: true, message: json.message ?? 'Ruangan berhasil ditambahkan', severity: 'success' })
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
          {mode === 'edit' ? 'Ubah Ruangan' : 'Tambah Ruangan'}
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
                  label='Nama Ruangan'
                  name='nama'
                  variant='outlined'
                  placeholder='Nama Ruangan'
                  value={form.nama}
                  onChange={handleChange('nama')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Nominal Sewa'
                  placeholder='10.000.000'
                  value={formatNumber(form.nominal)}
                  onChange={handleNominalChange}
                  disabled={loading}
                  inputProps={{
                    inputMode: 'decimal',
                    pattern: '[0-9.,]*'
                  }}
                  helperText="Contoh: 10.000.000"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                  <Switch
                    checked={form.status}
                    onChange={(_, checked) => setForm(prev => ({ ...prev, status: checked }))}
                  />
                } label={form.status ? 'Ruangan Aktif' : 'Ruangan Nonaktif'}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={saving || !form.nama || !form.nominal}>
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
