'use client'

import { useEffect, useState, useRef } from 'react'

import { useRouter } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { MasterPaketClient } from '@/src/types/apps/paketTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

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
  iconUrl: string
  hargaBulanan: string
  hargaTahunan: string
  urutan: string
  status: boolean
}

const formatRupiah = (value: string): string => {
  const num = value.replace(/\D/g, '')

  if (!num) return ''

  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const DEFAULTS: FormValues = {
  nama: '',
  deskripsi: '',
  iconUrl: '',
  hargaBulanan: '',
  hargaTahunan: '',
  urutan: '0',
  status: true
}

export default function AddEditPaket({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { snack, showSnack, closeSnack } = useSnackbar()

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        nama: initialData.nama ?? '',
        deskripsi: initialData.deskripsi ?? '',
        iconUrl: initialData.iconUrl ?? '',
        hargaBulanan: Math.floor(Number(initialData.hargaBulanan ?? 0)).toString(),
        hargaTahunan: Math.floor(Number(initialData.hargaTahunan ?? 0)).toString(),
        urutan: initialData.urutan?.toString() ?? '0',
        status: initialData.status ?? true
      })

      setIconPreview(initialData.iconUrl || null)
    } else {
      setForm(DEFAULTS)
      setIconPreview(null)
    }
  }, [open, mode, initialData])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, status: e.target.checked }))

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml']

    if (!allowedTypes.includes(file.type)) {
      showSnack('Tipe file tidak valid. Hanya JPG, PNG, WebP, dan SVG yang diizinkan', 'error')

      return
    }

    // Validate file size (2MB)
    if (file.size > 3 * 1024 * 1024) {
      showSnack('Ukuran file melebihi batas 3MB', 'error')

      return
    }

    setUploading(true)

    try {
      const formData = new FormData()

      formData.append('file', file)

      if (form.iconUrl) {
        formData.append('oldFilePath', form.iconUrl)
      }

      const token = localStorage.getItem('accessToken')

      const response = await fetch('/api/upload/paket-icon', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Upload gagal')
      }

      setForm(prev => ({ ...prev, iconUrl: result.url }))
      setIconPreview(result.url)
      showSnack('Icon berhasil diupload', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengupload icon'

      showSnack(msg, 'error')
    } finally {
      setUploading(false)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveIcon = () => {
    setForm(prev => ({ ...prev, iconUrl: '' }))
    setIconPreview(null)
  }

  const handleSubmit = async () => {
    if (!form.nama) {
      showSnack('Nama paket harus diisi', 'error')

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
              iconUrl: form.iconUrl || null,
              hargaBulanan: parseFloat(form.hargaBulanan),
              hargaTahunan: parseFloat(form.hargaTahunan),
              urutan: parseInt(form.urutan, 10),
              status: form.status
            })
          }
        )

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
      } else {
        const json = await apiFetchClient<{ data: MasterPaketClient; message?: string }>(`/api/master/paket`, {
          method: 'POST',
          body: JSON.stringify({
            nama: form.nama,
            deskripsi: form.deskripsi || null,
            iconUrl: form.iconUrl || null,
            hargaBulanan: parseFloat(form.hargaBulanan),
            hargaTahunan: parseFloat(form.hargaTahunan),
            urutan: parseInt(form.urutan, 10),
            status: form.status
          })
        })

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

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
              {/* Icon Upload Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle2' className='mbe-2'>
                  Icon Paket
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  {/* Icon Preview */}
                  <Box
                    sx={{
                      width: 88,
                      height: 88,
                      borderRadius: 2,
                      border: '2px dashed',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: 'action.hover',
                      flexShrink: 0
                    }}
                  >
                    {uploading ? (
                      <CircularProgress size={28} />
                    ) : iconPreview ? (
                      <img
                        src={iconPreview}
                        alt='Icon preview'
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          padding: 8
                        }}
                      />
                    ) : (
                      <i className='tabler-photo text-3xl' style={{ opacity: 0.4 }} />
                    )}
                  </Box>

                  {/* Upload Actions */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant='tonal'
                        size='small'
                        component='label'
                        disabled={uploading}
                        startIcon={<i className='tabler-upload' />}
                      >
                        Upload Icon
                        <input
                          ref={fileInputRef}
                          type='file'
                          hidden
                          accept='image/jpeg,image/png,image/webp,image/svg+xml'
                          onChange={handleIconUpload}
                        />
                      </Button>
                      {iconPreview && (
                        <IconButton
                          size='small'
                          color='error'
                          onClick={handleRemoveIcon}
                          disabled={uploading}
                          title='Hapus icon'
                        >
                          <i className='tabler-trash' />
                        </IconButton>
                      )}
                    </Box>
                    <Typography variant='caption' color='text.disabled'>
                      JPG, PNG, WebP, SVG. Maks 3MB.
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
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
              <Grid size={{ xs: 12, sm: 4 }}>
                <CustomTextField
                  fullWidth
                  label='Urutan'
                  name='urutan'
                  type='number'
                  variant='outlined'
                  placeholder='0'
                  value={form.urutan}
                  onChange={handleChange('urutan')}
                  required
                  inputProps={{ min: 0, step: '1' }}
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Harga Bulanan (Rp)'
                  name='hargaBulanan'
                  variant='outlined'
                  placeholder='0'
                  value={formatRupiah(form.hargaBulanan)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\./g, '')

                    if (raw === '' || /^\d+$/.test(raw)) {
                      setForm(prev => ({ ...prev, hargaBulanan: raw }))
                    }
                  }}
                  required
                  inputProps={{ inputMode: 'numeric' }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Harga Tahunan (Rp)'
                  name='hargaTahunan'
                  variant='outlined'
                  placeholder='0'
                  value={formatRupiah(form.hargaTahunan)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\./g, '')

                    if (raw === '' || /^\d+$/.test(raw)) {
                      setForm(prev => ({ ...prev, hargaTahunan: raw }))
                    }
                  }}
                  required
                  inputProps={{ inputMode: 'numeric' }}
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
            <Button
              variant='contained'
              type='submit'
              disabled={saving || uploading || !form.nama || !form.hargaBulanan || !form.hargaTahunan}
            >
              {mode === 'edit' ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}
