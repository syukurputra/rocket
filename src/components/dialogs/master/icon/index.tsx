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

import { styled } from '@mui/material/styles'

import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { IconClient } from '@/src/types/apps/iconTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

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
  code: string
}

const DEFAULTS: FormValues = {
  nama: '',
  code: ''
}

const Icon = styled('i')({})

export default function AddEditIcon({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        nama: initialData.nama ?? '',
        code: initialData.code ?? ''
      })
    } else {
      setForm(DEFAULTS)
    }
  }, [open, mode, initialData])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.nama || !form.code) {
      showSnack('Nama dan Code Icon harus diisi', 'error')

      return
    }

    setSaving(true)

    try {
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: IconClient; message?: string }>(`/api/master/icon/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nama: form.nama,
            code: form.code
          })
        })

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        showSnack(json.message ?? 'Icon berhasil diupdate')

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
      } else {
        const json = await apiFetchClient<{ data: IconClient; message?: string }>(`/api/master/icon`, {
          method: 'POST',
          body: JSON.stringify({
            nama: form.nama,
            code: form.code
          })
        })

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        showSnack(json.message ?? 'Icon berhasil ditambahkan')

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
                  label='Nama Icon'
                  name='nama'
                  variant='outlined'
                  placeholder='Contoh: Listrik'
                  value={form.nama}
                  onChange={handleChange('nama')}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Code Icon'
                  name='code'
                  variant='outlined'
                  placeholder='Contoh: tabler-home, tabler-user, tabler-settings'
                  value={form.code}
                  onChange={handleChange('code')}
                  required
                  helperText='Gunakan format: tabler-[nama-icon]. Lihat icon di https://tabler.io/icons'
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={saving || !form.nama || !form.code}>
              {mode === 'edit' ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}
