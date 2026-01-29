'use client'

import { useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { RuanganClient, RuanganImage } from '@/src/types/apps/ruanganTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

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
  hargaHarian: number
  hargaBulanan: number
  hargaTahunan: number
  status: string
}

const DEFAULTS: FormValues = {
  nama: '',
  hargaHarian: 0.0,
  hargaBulanan: 0.0,
  hargaTahunan: 0.0,
  status: 'tidak dihuni'
}

const STATUS_OPTIONS = [
  { label: 'Huni', value: 'huni' },
  { label: 'Tidak Huni', value: 'tidak dihuni' }
]

const MAX_IMAGES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function AddEditRuang({ open, setOpen, mode = 'create', initialData, asetId, onSaved }: Props) {
  const params = useParams()
  const finalAsetId = asetId || (params?.id as string)

  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })

  // Image upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<RuanganImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
  }

  useEffect(() => {
    if (!open) {
      // Reset states when dialog closes
      setSelectedFiles([])
      setExistingImages([])

      return
    }

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        nama: initialData.nama ?? '',
        hargaHarian: initialData.hargaHarian ?? 0.0,
        hargaBulanan: initialData.hargaBulanan ?? 0.0,
        hargaTahunan: initialData.hargaTahunan ?? 0.0,
        status: initialData.status ?? 'tidak dihuni'
      })
      setExistingImages(initialData.images || [])
    } else {
      setForm(DEFAULTS)
      setExistingImages([])
    }
  }, [open, mode, initialData])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const formatNumber = (num: number): string => {
    if (!num) return ''

    return num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  const handlePricingChange =
    (field: 'hargaHarian' | 'hargaBulanan' | 'hargaTahunan') => (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawValue = e.target.value.replace(/[^\d,]/g, '')

      rawValue = rawValue.replace(',', '.')
      const numericValue = parseFloat(rawValue) || 0

      setForm(prev => ({ ...prev, [field]: numericValue }))
    }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const totalCount = existingImages.length + selectedFiles.length + files.length

    if (totalCount > MAX_IMAGES) {
      setSnack({
        open: true,
        message: `Maksimal ${MAX_IMAGES} gambar. Anda sudah memiliki ${existingImages.length + selectedFiles.length} gambar.`,
        severity: 'error'
      })

      return
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setSnack({ open: true, message: `${file.name} bukan file gambar`, severity: 'error' })

        return false
      }

      if (file.size > MAX_FILE_SIZE) {
        setSnack({ open: true, message: `${file.name} melebihi 5MB`, severity: 'error' })

        return false
      }

      return true
    })

    setSelectedFiles(prev => [...prev, ...validFiles])
    e.target.value = ''
  }

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!form.id) return

    setDeletingImageId(imageId)

    try {
      await apiFetchClient(`/api/ruangan/${form.id}/images/${imageId}`, {
        method: 'DELETE'
      })

      setExistingImages(prev => prev.filter(img => img.id !== imageId))
      setSnack({ open: true, message: 'Gambar berhasil dihapus', severity: 'success' })
    } catch (error) {
      setSnack({ open: true, message: 'Gagal menghapus gambar', severity: 'error' })
    } finally {
      setDeletingImageId(null)
    }
  }

  const uploadImages = async (ruanganId: string) => {
    if (selectedFiles.length === 0) return

    setUploading(true)

    try {
      const formData = new FormData()

      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      await apiFetchClient(`/api/ruangan/${ruanganId}/images`, {
        method: 'POST',
        body: formData
      })

      setSelectedFiles([])
    } catch (error) {
      console.error('Upload images error:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.nama) {
      setSnack({ open: true, message: 'Mohon lengkapi nama ruangan', severity: 'error' })

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
        hargaHarian: form.hargaHarian,
        hargaBulanan: form.hargaBulanan,
        hargaTahunan: form.hargaTahunan,
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

        // Upload new images if any
        if (selectedFiles.length > 0) {
          await uploadImages(form.id)
        }

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Show success message
        setSnack({ open: true, message: json.message ?? 'Ruangan berhasil diupdate', severity: 'success' })

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
      } else {
        const json = await apiFetchClient<{ data: RuanganClient; message?: string }>(`/api/ruangan`, {
          method: 'POST',
          body: JSON.stringify(requestBody)
        })

        // Upload images if any
        if (selectedFiles.length > 0) {
          await uploadImages(json.data.id)
        }

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Show success message
        setSnack({ open: true, message: json.message ?? 'Ruangan berhasil ditambahkan', severity: 'success' })

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
          {mode === 'edit' ? 'Ubah Ruangan' : 'Tambah Ruangan'}
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
                  label='Nama Ruangan'
                  name='nama'
                  variant='outlined'
                  placeholder='Nama Ruangan'
                  value={form.nama}
                  onChange={handleChange('nama')}
                />
              </Grid>

              {/* Pricing Fields */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <CustomTextField
                  fullWidth
                  label='Harga Harian'
                  placeholder='100.000'
                  value={formatNumber(form.hargaHarian)}
                  onChange={handlePricingChange('hargaHarian')}
                  inputProps={{
                    inputMode: 'decimal',
                    pattern: '[0-9.,]*'
                  }}
                  helperText='Per hari'
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CustomTextField
                  fullWidth
                  label='Harga Bulanan'
                  placeholder='2.000.000'
                  value={formatNumber(form.hargaBulanan)}
                  onChange={handlePricingChange('hargaBulanan')}
                  inputProps={{
                    inputMode: 'decimal',
                    pattern: '[0-9.,]*'
                  }}
                  helperText='Per bulan'
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <CustomTextField
                  fullWidth
                  label='Harga Tahunan'
                  placeholder='20.000.000'
                  value={formatNumber(form.hargaTahunan)}
                  onChange={handlePricingChange('hargaTahunan')}
                  inputProps={{
                    inputMode: 'decimal',
                    pattern: '[0-9.,]*'
                  }}
                  helperText='Per tahun'
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Pilih Status'
                  name='status'
                  variant='outlined'
                  value={form.status}
                  onChange={handleChange('status')}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>

              {/* Image Upload Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle1' sx={{ mb: 2 }}>
                  Foto Ruangan (Maksimal {MAX_IMAGES} gambar)
                </Typography>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                      Gambar yang sudah ada:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {existingImages.map(image => (
                        <Box
                          key={image.id}
                          sx={{
                            position: 'relative',
                            width: 120,
                            height: 120,
                            borderRadius: 1,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <img
                            src={image.filepath}
                            alt={image.filename}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <IconButton
                            size='small'
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'error.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'error.dark' }
                            }}
                            onClick={() => handleDeleteExistingImage(image.id)}
                            disabled={deletingImageId === image.id}
                          >
                            {deletingImageId === image.id ? (
                              <CircularProgress size={16} color='inherit' />
                            ) : (
                              <i className='tabler-trash' style={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                      Gambar baru yang akan diupload:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {selectedFiles.map((file, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            width: 120,
                            height: 120,
                            borderRadius: 1,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <IconButton
                            size='small'
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'error.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'error.dark' }
                            }}
                            onClick={() => handleRemoveSelectedFile(index)}
                          >
                            <i className='tabler-x' style={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Upload Button */}
                {existingImages.length + selectedFiles.length < MAX_IMAGES && (
                  <Button variant='outlined' component='label' startIcon={<i className='tabler-upload' />}>
                    Pilih Gambar
                    <input type='file' hidden multiple accept='image/*' onChange={handleFileSelect} />
                  </Button>
                )}

                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                  Format: JPG, PNG, WebP. Maksimal 5MB per gambar.
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving || uploading}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={saving || uploading || !form.nama}>
              {saving || uploading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {uploading ? 'Mengupload...' : 'Menyimpan...'}
                </>
              ) : mode === 'edit' ? (
                'Simpan'
              ) : (
                'Tambah'
              )}
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
