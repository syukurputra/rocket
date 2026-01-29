import { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

import { useRouter } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { styled } from '@mui/material/styles'
import type { BoxProps } from '@mui/material/Box'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { AsetClient, AsetImage, AsetStatus } from '@/src/types/apps/asetTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import StepperCustomDot from '@components/stepper-dot'
import StepperWrapper from '@core/styles/stepper'
import AsetRoomStep from './AsetRoomStep'

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

const steps = [
  {
    title: 'Informasi Aset',
    subtitle: 'Jenis, Nama, Alamat',
    icon: 'tabler-home'
  },
  {
    title: 'Ruangan',
    subtitle: 'Daftar Ruangan',
    icon: 'tabler-door'
  }
]

const MAX_IMAGES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const MapPicker = dynamic(() => import('@/src/components/MapPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '400px', background: '#f0f0f0', borderRadius: '8px' }}>Loading map...</div>
})

const ContentWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(6),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(4)
  }
}))

export default function AddEditAset({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
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
      setSelectedFiles([])
      setExistingImages([])
      setMapKey(prev => prev + 1)
      setActiveStep(0)
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

  const handleSaveAsset = async () => {
    if (!form.jenis || !form.nama) {
      setSnack({ open: true, message: 'Mohon lengkapi semua field yang diperlukan', severity: 'error' })
      return null
    }

    setSaving(true)
    try {
      const body = {
        jenis: form.jenis,
        nama: form.nama,
        alamat: form.alamat,
        kota: form.kota,
        provinsi: form.provinsi,
        latitude: form.latitude,
        longitude: form.longitude,
        status: form.status
      }

      let result: AsetClient
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: AsetClient; message?: string }>(`/api/aset/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        })
        result = json.data
      } else {
        const json = await apiFetchClient<{ data: AsetClient; message?: string }>(`/api/aset`, {
          method: 'POST',
          body: JSON.stringify(body)
        })
        result = json.data
        setForm(prev => ({ ...prev, id: result.id }))
      }

      if (selectedFiles.length > 0) {
        await uploadImages(result.id)
      }

      onSaved?.(result)
      setSaving(false)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'
      setSnack({ open: true, message: msg, severity: 'error' })
      setSaving(false)
      return null
    }
  }

  const handleNext = async () => {
    if (activeStep === 0) {
      const saved = await handleSaveAsset()
      if (saved) {
        setActiveStep(1)
        router.refresh()
      }
    } else {
      setOpen(false)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                label='Jenis Bangunan'
                name='jenis'
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
                placeholder='Nama Kota'
                value={form.kota}
                onChange={handleChange('kota')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                label='Status'
                name='status'
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

            {/* Images */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle1' sx={{ mb: 2 }}>
                Foto Aset (Maksimal {MAX_IMAGES} gambar)
              </Typography>
              {(existingImages.length > 0 || selectedFiles.length > 0) && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  {existingImages.map(image => (
                    <Box key={image.id} sx={{ position: 'relative', width: 100, height: 100 }}>
                      <img
                        src={image.filepath}
                        alt={image.filename}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <IconButton
                        size='small'
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
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
                  {selectedFiles.map((file, index) => (
                    <Box key={index} sx={{ position: 'relative', width: 100, height: 100 }}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <IconButton
                        size='small'
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
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
              )}
              {existingImages.length + selectedFiles.length < MAX_IMAGES && (
                <Button variant='outlined' component='label' startIcon={<i className='tabler-upload' />}>
                  Pilih Gambar
                  <input type='file' hidden multiple accept='image/*' onChange={handleFileSelect} />
                </Button>
              )}
            </Grid>

            {/* Map */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle1' sx={{ mb: 2 }}>
                Lokasi pada Peta
              </Typography>
              <Box sx={{ mb: 2, height: 400, width: '100%' }}>
                <MapPicker
                  key={mapKey}
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onLocationChange={(lat, lng) => setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                />
              </Box>
            </Grid>
          </Grid>
        )
      case 1:
        return <AsetRoomStep asetId={form.id!} />
      default:
        return null
    }
  }

  return (
    <>
      <Dialog
        open={open}
        maxWidth='md'
        fullWidth
        scroll='body'
        closeAfterTransition={false}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 600 }}>
          <Box
            sx={{
              p: 6,
              borderRight: theme => ({ md: `1px solid ${theme.palette.divider}` }),
              borderBottom: theme => ({ xs: `1px solid ${theme.palette.divider}`, md: 'none' }),
              minWidth: 260,
              bgcolor: 'var(--mui-palette-action-hover)'
            }}
          >
            <Typography variant='h4' sx={{ mb: 6 }}>
              {mode === 'edit' ? 'Ubah Aset' : 'Tambah Aset'}
            </Typography>
            <StepperWrapper>
              <Stepper activeStep={activeStep} orientation='vertical'>
                {steps.map((step, index) => (
                  <Step
                    key={index}
                    onClick={() => mode === 'edit' && setActiveStep(index)}
                    sx={{ cursor: mode === 'edit' ? 'pointer' : 'default' }}
                  >
                    <StepLabel StepIconComponent={StepperCustomDot}>
                      <div className='step-label'>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography className='step-title'>{step.title}</Typography>
                          <Typography className='step-subtitle'>{step.subtitle}</Typography>
                        </Box>
                      </div>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </StepperWrapper>
          </Box>
          <ContentWrapper>
            <Box sx={{ mb: 8 }}>{renderStepContent(activeStep)}</Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
              <Button
                variant='tonal'
                color='secondary'
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<i className='tabler-arrow-left' />}
              >
                Previous
              </Button>
              <Button
                variant='contained'
                onClick={handleNext}
                disabled={saving || uploading}
                endIcon={
                  activeStep === steps.length - 1 ? (
                    <i className='tabler-check' />
                  ) : (
                    <i className='tabler-arrow-right' />
                  )
                }
              >
                {saving || uploading ? (
                  <CircularProgress size={20} color='inherit' />
                ) : activeStep === steps.length - 1 ? (
                  'Selesai'
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
          </ContentWrapper>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackClose} severity={snack.severity} variant='filled' sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  )
}
