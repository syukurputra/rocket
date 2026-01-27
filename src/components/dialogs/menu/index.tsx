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
import type { MenuClient } from '@/src/types/apps/menuTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: MenuClient | null
  onSaved?: (data: MenuClient) => void
}

type FormValues = {
  id?: string
  nama: string
  keterangan: string
  path: string
  icon: string
  urutan: number
  parentId: string
  status: boolean
}

const DEFAULTS: FormValues = {
  nama: '',
  keterangan: '',
  path: '',
  icon: '',
  urutan: 0,
  parentId: '',
  status: true
}

export default function AddEditMenu({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })
  const [parentMenus, setParentMenus] = useState<MenuClient[]>([])

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
    setOpen(false)
  }

  // Fetch parent menus
  useEffect(() => {
    if (!open) return

    const fetchParentMenus = async () => {
      try {
        const result = await apiFetchClient<{ data: MenuClient[] }>('/api/menu')

        setParentMenus(result.data || [])
      } catch (error) {
        console.error('Failed to fetch parent menus:', error)
      }
    }

    fetchParentMenus()
  }, [open])

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        nama: initialData.nama ?? '',
        keterangan: initialData.keterangan ?? '',
        path: initialData.path ?? '',
        icon: initialData.icon ?? '',
        urutan: initialData.urutan ?? 0,
        parentId: initialData.parentId ?? '',
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
      setSnack({ open: true, message: 'Nama menu harus diisi', severity: 'error' })

      return
    }

    setSaving(true)

    try {
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: MenuClient; message?: string }>(`/api/menu/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nama: form.nama,
            keterangan: form.keterangan || null,
            path: form.path || null,
            icon: form.icon || null,
            urutan: Number(form.urutan),
            parentId: form.parentId || null,
            status: form.status
          })
        })

        setSnack({ open: true, message: json.message ?? 'Menu berhasil diupdate', severity: 'success' })
        onSaved?.(json.data)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const json = await apiFetchClient<{ data: MenuClient; message?: string }>(`/api/menu`, {
          method: 'POST',
          body: JSON.stringify({
            nama: form.nama,
            keterangan: form.keterangan || null,
            path: form.path || null,
            icon: form.icon || null,
            urutan: Number(form.urutan),
            parentId: form.parentId || null,
            status: form.status
          })
        })

        setSnack({ open: true, message: json.message ?? 'Menu berhasil ditambahkan', severity: 'success' })
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
          {mode === 'edit' ? 'Ubah Menu' : 'Tambah Menu'}
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
                  label='Nama Menu'
                  name='nama'
                  variant='outlined'
                  placeholder='Nama Menu'
                  value={form.nama}
                  onChange={handleChange('nama')}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Keterangan'
                  name='keterangan'
                  variant='outlined'
                  placeholder='Deskripsi fitur untuk tampilan paket'
                  value={form.keterangan}
                  onChange={handleChange('keterangan')}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Path'
                  name='path'
                  variant='outlined'
                  placeholder='/path/to/page'
                  value={form.path}
                  onChange={handleChange('path')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Icon'
                  name='icon'
                  variant='outlined'
                  placeholder='tabler-icon-name'
                  value={form.icon}
                  onChange={handleChange('icon')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Urutan'
                  name='urutan'
                  type='number'
                  variant='outlined'
                  placeholder='0'
                  value={form.urutan}
                  onChange={handleChange('urutan')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Parent Menu'
                  name='parentId'
                  variant='outlined'
                  value={form.parentId}
                  onChange={handleChange('parentId')}
                >
                  <MenuItem value=''>Tidak ada parent (Root menu)</MenuItem>
                  {parentMenus.map(menu => (
                    <MenuItem key={menu.id} value={menu.id}>
                      {menu.nama}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.status}
                      onChange={(_, checked) => setForm(prev => ({ ...prev, status: checked }))}
                    />
                  }
                  label={form.status ? 'Menu Aktif' : 'Menu Nonaktif'}
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
