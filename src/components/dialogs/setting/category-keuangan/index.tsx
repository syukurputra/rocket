'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import IconSearchAutocomplete from '@/src/components/IconSearchAutocomplete'
import type { IconOption } from '@/src/components/IconSearchAutocomplete'
import type { CategoryKeuanganClient } from '@/src/types/apps/categoryKeuanganTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: CategoryKeuanganClient | null
  onSaved?: (data: CategoryKeuanganClient) => void
}

type FormValues = {
  id?: string
  nama: string
  jenis: string
  deskripsi: string
  iconId: string
  color: string
  status: boolean
}

const DEFAULTS: FormValues = {
  nama: '',
  jenis: 'Pengeluaran',
  deskripsi: '',
  iconId: '',
  color: '#000000',
  status: true
}

export default function AddEditCategoryKeuangan({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()
  const [selectedIcon, setSelectedIcon] = useState<IconOption | null>(null)

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        nama: initialData.nama ?? '',
        jenis: initialData.jenis ?? 'Pengeluaran',
        deskripsi: initialData.deskripsi ?? '',
        iconId: initialData.iconId ?? '',
        color: initialData.color ?? '#000000',
        status: initialData.status ?? true
      })
      // Set selected icon untuk mode edit
      if (initialData.iconId && (initialData as any).icon) {
        setSelectedIcon((initialData as any).icon)
      } else if (initialData.iconId) {
        setSelectedIcon({ id: initialData.iconId, nama: '', code: '' })
      } else {
        setSelectedIcon(null)
      }
    } else {
      setForm(DEFAULTS)
      setSelectedIcon(null)
    }
  }, [open, mode, initialData])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, status: e.target.checked }))

  const handleSubmit = async () => {
    if (!form.nama) {
      showSnack('Nama kategori harus diisi', 'error')

      return
    }

    setSaving(true)

    try {
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: CategoryKeuanganClient; message?: string }>(
          `/api/setting/category-keuangan/${form.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              nama: form.nama,
              jenis: form.jenis,
              deskripsi: form.deskripsi || null,
              iconId: form.iconId || null,
              color: form.color || null,
              status: form.status
            })
          }
        )

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        showSnack(json.message ?? 'Category berhasil diupdate')

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
      } else {
        const json = await apiFetchClient<{ data: CategoryKeuanganClient; message?: string }>(
          `/api/setting/category-keuangan`,
          {
            method: 'POST',
            body: JSON.stringify({
              nama: form.nama,
              jenis: form.jenis,
              deskripsi: form.deskripsi || null,
              iconId: form.iconId || null,
              color: form.color || null,
              status: form.status
            })
          }
        )

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        showSnack(json.message ?? 'Category berhasil ditambahkan')

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'

      showSnack(msg, 'error')
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} maxWidth='md' scroll='body' sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
        <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          {mode === 'edit' ? 'Ubah Category Keuangan' : 'Tambah Category Keuangan'}
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
                  label='Nama Category'
                  name='nama'
                  variant='outlined'
                  placeholder='Contoh: Makanan, Transport, Utilitas'
                  value={form.nama}
                  onChange={handleChange('nama')}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Jenis'
                  name='jenis'
                  variant='outlined'
                  value={form.jenis}
                  onChange={handleChange('jenis')}
                  required
                >
                  <MenuItem value='Pengeluaran'>Pengeluaran</MenuItem>
                  <MenuItem value='Pemasukan'>Pemasukan</MenuItem>
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Deskripsi'
                  name='deskripsi'
                  variant='outlined'
                  placeholder='Deskripsi category (optional)'
                  value={form.deskripsi}
                  onChange={handleChange('deskripsi')}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconSearchAutocomplete
                  value={selectedIcon}
                  onChange={icon => {
                    setSelectedIcon(icon)
                    setForm(prev => ({ ...prev, iconId: icon?.id || '' }))
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Color'
                  name='color'
                  type='color'
                  variant='outlined'
                  value={form.color}
                  onChange={handleChange('color')}
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
            <Button variant='contained' type='submit' disabled={saving || !form.nama}>
              {mode === 'edit' ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}
