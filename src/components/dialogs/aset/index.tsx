import { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

import { useRouter } from 'next/navigation'

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
import type { AsetClient, AsetImage, AsetStatus } from '@/src/types/apps/asetTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

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
  latitude?: number
  longitude?: number
  status: AsetStatus
}

const JENIS_OPTIONS = [
  { label: 'Pilih Bangunan', value: '' },
  { label: 'Kost', value: 'kost' },
  { label: 'Rumah', value: 'rumah' },
  { label: 'Apartemen', value: 'apartemen' }
]

const STATUS_OPTIONS = [
  { label: 'Aktif', value: 'aktif' },
  { label: 'Non Aktif', value: 'non aktif' },
  { label: 'Publish', value: 'publish' }
]

const DEFAULTS: FormValues = {
  jenis: '',
  nama: '',
  alamat: '',
  kota: '',
  provinsi: '',
  latitude: undefined,
  longitude: undefined,
  status: 'aktif'
}

const MAX_IMAGES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Dynamic import for MapPicker (client-side only)
const MapPicker = dynamic(() => import('@/src/components/MapPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '400px', background: '#f0f0f0', borderRadius: '8px' }}>Loading map...</div>
})

export default function AddEditAset({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })
  const [mapKey, setMapKey] = useState(0)

  // Image upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<AsetImage[]>([])
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
      setMapKey(prev => prev + 1) // Force map remount

      return
    }

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        jenis: initialData.jenis ?? '',
        nama: initialData.nama ?? '',
        alamat: initialData.alamat ?? '',
        kota: initialData.kota ?? '',
        provinsi: initialData.provinsi ?? '',
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        status: initialData.status
      })
      setExistingImages(initialData.images || [])
    } else {
      setForm(DEFAULTS)
      setExistingImages([])
    }
  }, [open, mode, initialData])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate total count
    const totalCount = existingImages.length + selectedFiles.length + files.length

    if (totalCount > MAX_IMAGES) {
      setSnack({
        open: true,
        message: `Maksimal ${MAX_IMAGES} gambar. Anda sudah memiliki ${existingImages.length + selectedFiles.length} gambar.`,
        severity: 'error'
      })

      return
    }

    // Validate each file
    const validFiles = files.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setSnack({ open: true, message: `${file.name} bukan file gambar`, severity: 'error' })

        return false
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setSnack({ open: true, message: `${file.name} melebihi 5MB`, severity: 'error' })

        return false
      }

      return true
    })

    setSelectedFiles(prev => [...prev, ...validFiles])
    e.target.value = '' // Reset input
  }

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!form.id) return

    setDeletingImageId(imageId)

    try {
      await apiFetchClient(`/api/aset/${form.id}/images/${imageId}`, {
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

  const uploadImages = async (asetId: string) => {
    if (selectedFiles.length === 0) return

    setUploading(true)

    try {
      const formData = new FormData()

      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      await apiFetchClient(`/api/aset/${asetId}/images`, {
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
            latitude: form.latitude,
            longitude: form.longitude,
            status: form.status
          })
        })

        // Upload new images if any
        if (selectedFiles.length > 0) {
          await uploadImages(form.id)
        }

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Show success message
        setSnack({ open: true, message: json.message ?? 'Aset berhasil diupdate', severity: 'success' })

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
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
            latitude: form.latitude,
            longitude: form.longitude,
            status: form.status
          })
        })

        // Upload images if any
        if (selectedFiles.length > 0) {
          await uploadImages(json.data.id)
        }

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        // Show success message
        setSnack({ open: true, message: json.message ?? 'Aset berhasil ditambahkan', severity: 'success' })

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
          {mode === 'edit' ? 'Ubah Aset' : 'Tambah Aset'}
        </DialogTitle>
        <form
          onSubmit={e => {
            e.preventDefault()
            if (!saving && !uploading) handleSubmit()
          }}
        >
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

              {/* Image Upload Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle1' sx={{ mb: 2 }}>
                  Foto Aset (Maksimal {MAX_IMAGES} gambar)
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

              {/* Map Location Picker */}
              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle1' sx={{ mb: 2 }}>
                  Lokasi pada Peta
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <MapPicker
                    key={mapKey}
                    latitude={form.latitude}
                    longitude={form.longitude}
                    onLocationChange={(lat, lng) => {
                      setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
                    }}
                  />
                </Box>
                {form.latitude && form.longitude && (
                  <Typography variant='caption' color='text.secondary'>
                    Koordinat: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                  </Typography>
                )}
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                  Klik pada peta untuk menandai lokasi aset, atau drag marker untuk menyesuaikan posisi.
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Status'
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
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving || uploading}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={saving || uploading || !form.jenis || !form.nama}>
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
