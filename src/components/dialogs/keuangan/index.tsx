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
import type { KeuanganClient } from '@/src/types/apps/keuanganTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { useRouter } from 'next/navigation'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: KeuanganClient | null
  onSaved?: (data: KeuanganClient) => void
}

type FormValues = {
  id?: string
  jenis: string
  keterangan: string
  nominal: number
  asetId: string
  iconId: string
}

const JENIS_OPTIONS = [
  { label: 'Pilih Bangunan', value: '' },
  { label: 'Pemasukan', value: 'pemasukan' },
  { label: 'Pengeluaran', value: 'pengeluaran' },
]

type AsetOption = {
  id: string
  nama: string
  jenis: string
}

type IconOption = {
  id: string
  nama: string
  code: string
  jenis: string
}

const DEFAULTS: FormValues = {
  jenis: '',
  keterangan: '',
  nominal: 0.0,
  asetId: '',
  iconId: ''
}

export default function AddEditKeuangan({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })
  const [pendingSaved, setPendingSaved] = useState<KeuanganClient | null>(null)

  const [asetOptions, setAsetOptions] = useState<AsetOption[]>([])
  const [iconOptions, setIconOptions] = useState<IconOption[]>([])

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
    if (pendingSaved) {
      onSaved?.(pendingSaved)
      setPendingSaved(null)
      router.refresh()
    }
    setOpen(false) // tutup dialog setelah snackbar ditutup
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
          const iconResponse = await apiFetchClient<{ data: IconOption[] }>('/api/master-icon/dp')
          setIconOptions(iconResponse.data || [])
        } catch (iconError) {
          setIconOptions([
            { id: 'temp-1', nama: 'Kategori 1', code: 'tabler-home', jenis: 'pemasukan' },
            { id: 'temp-2', nama: 'Kategori 2', code: 'tabler-cash', jenis: 'pengeluaran' }
          ])
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
    if (!form.jenis) {
      // Don't clear iconOptions, just keep all options available
      return
    }

    const loadIconsByJenis = async () => {
      try {
        try {
          const iconResponse = await apiFetchClient<{ data: IconOption[] }>(`/api/master-icon/dp?jenis=${form.jenis}`)
          setIconOptions(iconResponse.data || [])
        } catch (apiError) {
          const filteredIcons = iconOptions.filter(icon =>
            !icon.jenis || icon.jenis === form.jenis
          )
          setIconOptions(filteredIcons)
        }

        if (form.iconId) {
          const iconExists = iconOptions.some(icon =>
            icon.id === form.iconId && (!icon.jenis || icon.jenis === form.jenis)
          )
          if (!iconExists) {
            setForm(prev => ({ ...prev, iconId: '' }))
          }
        }
      } catch (error) {
        console.error('Error loading icons by jenis:', error)
      }
    }

    loadIconsByJenis()
  }, [form.jenis])

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        jenis: initialData.jenis ?? '',
        keterangan: initialData.keterangan ?? '',
        nominal: initialData.nominal ?? 0.0,
        asetId: initialData.asetId ?? '',
        iconId: initialData.iconId ?? ''
      })
    } else {
      setForm(DEFAULTS)
    }
  }, [open, mode, initialData])

  const handleChange =
    (key: keyof FormValues) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (key === 'nominal') {
          // Remove all non-digit characters except decimal point
          const rawValue = e.target.value.replace(/[^\d.]/g, '')
          const numericValue = parseFloat(rawValue) || 0
          setForm(prev => ({ ...prev, [key]: numericValue }))
        } else {
          setForm(prev => ({ ...prev, [key]: e.target.value }))
        }
      }

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
    if (!form.jenis || !form.asetId || !form.iconId || form.nominal <= 0) {
      setSnack({ open: true, message: 'Mohon lengkapi semua field yang diperlukan', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: KeuanganClient; message?: string }>(`/api/keuangan/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            jenis: form.jenis,
            keterangan: form.keterangan,
            nominal: form.nominal,
            asetId: form.asetId,
            iconId: form.iconId
          })
        })
        setPendingSaved(json.data)
        setSnack({ open: true, message: json.message ?? 'Keuangan berhasil diupdate', severity: 'success' })
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        const json = await apiFetchClient<{ data: KeuanganClient; message?: string }>(`/api/keuangan`, {
          method: 'POST',
          body: JSON.stringify({
            jenis: form.jenis,
            keterangan: form.keterangan,
            nominal: form.nominal,
            asetId: form.asetId,
            iconId: form.iconId
          })
        })
        setPendingSaved(json.data)
        setSnack({ open: true, message: json.message ?? 'Keuangan berhasil ditambahkan', severity: 'success' })
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
              <Grid size={{ xs: 12 }}>
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
                  <MenuItem value="">
                    <em>Pilih Aset</em>
                  </MenuItem>
                  {asetOptions.map(aset => (
                    <MenuItem key={aset.id} value={aset.id}>
                      {aset.jenis} - {aset.nama}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Kategori Keuangan'
                  name='iconId'
                  variant='outlined'
                  value={form.iconId}
                  onChange={handleChange('iconId')}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Pilih Kategori</em>
                  </MenuItem>
                  {iconOptions.map(icon => (
                    <MenuItem key={icon.id} value={icon.id}>
                      <i className={icon.code} style={{ marginRight: 8 }} /> {icon.nama}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Keterangan'
                  name='keterangan'
                  variant='outlined'
                  placeholder='Keterangan'
                  value={form.keterangan}
                  onChange={handleChange('keterangan')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Nominal'
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
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={saving || !form.jenis || !form.nominal}>
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
