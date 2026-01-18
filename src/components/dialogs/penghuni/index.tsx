'use client'

import { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { PenghuniClient } from '@/src/types/apps/penghuniTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import AppReactDatepicker from '@/src/libs/styles/AppReactDatepicker'

import { useRouter } from 'next/navigation'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: PenghuniClient | null
  onSaved?: (data: PenghuniClient) => void
}

type FormValues = {
  id?: string
  nama: string
  email: string
  nomorTelepon: string
  status: string
  mulaiHuni: Date | null
  selesaiHuni: Date | null
  asetId: string
  ruanganId: string
}

const STATUS_OPTIONS = [
  { label: 'Pilih Status', value: '' },
  { label: 'Huni', value: 'huni' },
  { label: 'Tidak Huni', value: 'tidak dihuni' }
]

type AsetOption = {
  id: string
  nama: string
  jenis: string
}

type RuanganOption = {
  id: string
  nama: string
  asetId: string
}

const DEFAULTS: FormValues = {
  nama: '',
  email: '',
  nomorTelepon: '',
  status: 'belum bayar', // Auto-set to 'belum bayar'
  asetId: '',
  ruanganId: '',
  mulaiHuni: new Date(),
  selesaiHuni: new Date()
}

const Icon = styled('i')({})

export default function AddEditPenghuni({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })

  const [asetOptions, setAsetOptions] = useState<AsetOption[]>([])
  const [ruanganOptions, setRuanganOptions] = useState<RuanganOption[]>([])

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
  }

  // Load dropdown data saat dialog dibuka
  useEffect(() => {
    if (!open) return
    const loadDropdownData = async () => {
      setLoading(true)
      try {
        const asetResponse = await apiFetchClient<{ data: AsetOption[] }>('/api/aset/dp')
        setAsetOptions(asetResponse.data || [])

        try {
          const ruanganResponse = await apiFetchClient<{ data: RuanganOption[] }>('/api/ruangan/dp')
          setRuanganOptions(ruanganResponse.data || [])
        } catch (iconError) {
          setRuanganOptions([{ id: 'temp-1', nama: 'Ruangan 1', asetId: '1' }])
        }
      } catch (error) {
        console.error('Error loading dropdown data:', error)
        setSnack({ open: true, message: 'Gagal memuat data dropdown', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }

    loadDropdownData()
  }, [open])

  useEffect(() => {
    if (!form.asetId) {
      return
    }

    const loadRuangansByAset = async () => {
      try {
        try {
          const ruanganResponse = await apiFetchClient<{ data: RuanganOption[] }>(
            `/api/ruangan/dp?asetId=${form.asetId}`
          )
          setRuanganOptions(ruanganResponse.data || [])
        } catch (apiError) {
          const filteredRuangans = ruanganOptions.filter(ruangan => !ruangan.asetId || ruangan.asetId === form.asetId)
          setRuanganOptions(filteredRuangans)
        }

        if (form.ruanganId) {
          const iconExists = ruanganOptions.some(
            ruangan => ruangan.id === form.ruanganId && (!ruangan.asetId || ruangan.asetId === form.asetId)
          )
          if (!iconExists) {
            setForm(prev => ({ ...prev, iconId: '' }))
          }
        }
      } catch (error) {
        console.error('Error loading icons by jenis:', error)
      }
    }

    loadRuangansByAset()
  }, [form.asetId])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        nama: initialData.nama ?? '',
        email: initialData.email ?? '',
        nomorTelepon: initialData.nomorTelepon ?? '',
        status: initialData.status ?? '',
        mulaiHuni: initialData.mulaiHuni ? new Date(initialData.mulaiHuni) : new Date(),
        selesaiHuni: initialData.selesaiHuni ? new Date(initialData.selesaiHuni) : new Date(),
        asetId: initialData.asetId ?? '',
        ruanganId: initialData.ruanganId ?? ''
      })
    } else {
      setForm(DEFAULTS)
    }
  }, [open, mode, initialData])

  const handleSubmit = async () => {
    if (!form.nama || !form.asetId || !form.ruanganId || !form.mulaiHuni || !form.selesaiHuni) {
      setSnack({ open: true, message: 'Mohon lengkapi semua field yang diperlukan', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: PenghuniClient; message?: string }>(`/api/penghuni/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nama: form.nama,
            email: form.email,
            nomorTelepon: form.nomorTelepon,
            status: form.status,
            asetId: form.asetId,
            ruanganId: form.ruanganId,
            mulaiHuni: form.mulaiHuni.toISOString(),
            selesaiHuni: form.selesaiHuni.toISOString()
          })
        })

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Show success message
        setSnack({ open: true, message: json.message ?? 'Penghuni berhasil diupdate', severity: 'success' })

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
      } else {
        const json = await apiFetchClient<{ data: PenghuniClient; message?: string }>(`/api/penghuni`, {
          method: 'POST',
          body: JSON.stringify({
            nama: form.nama,
            email: form.email,
            nomorTelepon: form.nomorTelepon,
            status: form.status,
            asetId: form.asetId,
            ruanganId: form.ruanganId,
            mulaiHuni: form.mulaiHuni.toISOString(),
            selesaiHuni: form.selesaiHuni.toISOString()
          })
        })

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Show success message
        setSnack({ open: true, message: json.message ?? 'Penghuni berhasil ditambahkan', severity: 'success' })

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
      <Dialog
        open={open}
        maxWidth='md'
        scroll='body'
        closeAfterTransition={false}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          {mode === 'edit' ? 'Ubah Penghuni' : 'Tambah Penghuni'}
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
                  select
                  fullWidth
                  label='Pilih Aset'
                  name='asetId'
                  variant='outlined'
                  value={form.asetId}
                  onChange={handleChange('asetId')}
                  disabled={loading}
                >
                  <MenuItem value=''>
                    <em>Pilih Aset</em>
                  </MenuItem>
                  {asetOptions.map(aset => (
                    <MenuItem key={aset.id} value={aset.id}>
                      {aset.jenis} - {aset.nama}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Pilih Ruangan'
                  name='ruanganId'
                  variant='outlined'
                  value={form.ruanganId}
                  onChange={handleChange('ruanganId')}
                  disabled={loading}
                >
                  <MenuItem value=''>
                    <em>Pilih Ruangan</em>
                  </MenuItem>
                  {ruanganOptions.map(ruangan => (
                    <MenuItem key={ruangan.id} value={ruangan.id}>
                      <div className='flex items-center gap-2'>
                        <Typography className='capitalize' color='text.primary'>
                          {ruangan.nama}
                        </Typography>
                      </div>
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <AppReactDatepicker
                  selected={form.mulaiHuni}
                  onChange={(date: Date | null) => setForm(prev => ({ ...prev, mulaiHuni: date }))}
                  placeholderText='MM/DD/YYYY'
                  customInput={
                    <CustomTextField fullWidth label='Tanggal Mulai Huni' placeholder='MM-DD-YYYY' required />
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <AppReactDatepicker
                  selected={form.selesaiHuni}
                  onChange={(date: Date | null) => setForm(prev => ({ ...prev, selesaiHuni: date }))}
                  placeholderText='MM/DD/YYYY'
                  customInput={
                    <CustomTextField fullWidth label='Tanggal Selesai Huni' placeholder='MM-DD-YYYY' required />
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Nama'
                  name='nama'
                  variant='outlined'
                  placeholder='Nama'
                  value={form.nama}
                  onChange={handleChange('nama')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Email'
                  name='email'
                  type='email'
                  variant='outlined'
                  placeholder='Email'
                  value={form.email}
                  onChange={handleChange('email')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Nomor Telepon'
                  name='nomorTelepon'
                  variant='outlined'
                  placeholder='Nomor Telepon'
                  value={form.nomorTelepon}
                  onChange={handleChange('nomorTelepon')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              variant='contained'
              type='submit'
              disabled={saving || !form.nama || !form.asetId || !form.ruanganId}
            >
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
