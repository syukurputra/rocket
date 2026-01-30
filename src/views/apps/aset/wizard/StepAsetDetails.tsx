// React Imports
import { useState } from 'react'

// MUI Imports
import dynamic from 'next/dynamic'

import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import DirectionalIcon from '@components/DirectionalIcon'
import CustomTextField from '@core/components/mui/TextField'

// Custom Component Imports
import { apiFetchClient } from '@/src/utils/apiFetchClient'

const MapPicker = dynamic(() => import('@/src/components/MapPicker'), { ssr: false })

type Props = {
  activeStep: number
  handleNext: () => void
  handlePrev: () => void
  steps: { title: string; subtitle: string }[]
  onSave: (data: any, files?: File[]) => void
  initialData?: any
}

const StepAsetDetails = ({ activeStep, handleNext, handlePrev, steps, onSave, initialData }: Props) => {
  // States
  const [nama, setNama] = useState(initialData?.nama || '')
  const [jenis, setJenis] = useState(initialData?.status || 'aktif')
  const [tipe, setTipe] = useState(initialData?.jenis || '') // Map DB 'jenis' to UI 'tipe'

  const [alamat, setAlamat] = useState(initialData?.alamat || '')
  const [kota, setKota] = useState(initialData?.kota || '')
  const [provinsi, setProvinsi] = useState(initialData?.provinsi || '')
  const [lat, setLat] = useState<number | undefined>(initialData?.latitude || undefined)
  const [lng, setLng] = useState<number | undefined>(initialData?.longitude || undefined)

  const handleLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
  }

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<any[]>(initialData?.images || [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files)

      // Limit to 3 files max for new upload
      // Also consider existing images count if we want a strict total limit,
      // but usually "upload limit" refers to the batch or typical max per field.
      // User said "maksimal upload 3 image". Let's restrict selection to 3 for now.
      if (files.length > 3) {
        alert('Maksimal upload 3 gambar')

        return
      }

      if (existingImages.length + files.length > 3) {
        alert(`Total gambar tidak boleh lebih dari 3. Saat ini sudah ada ${existingImages.length} gambar.`)

        return
      }

      setSelectedFiles(files)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar ini?')) return

    try {
      await apiFetchClient(`/api/aset-image/${imageId}`, { method: 'DELETE' })

      // Remove from state
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Gagal menghapus gambar')
    }
  }

  const handleDeleteSelected = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    onSave(
      {
        nama,
        jenis: tipe, // UI Tipe -> DB jenis
        status: jenis, // UI Jenis -> DB status
        alamat,
        kota,
        provinsi,
        latitude: lat,
        longitude: lng
      },
      selectedFiles
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h5'>Informasi Aset</Typography>
        <Typography>Silakan lengkapi detail aset Anda.</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <CustomTextField
          fullWidth
          label='Nama Aset'
          placeholder='Contoh: Apartemen Sudirman'
          value={nama}
          onChange={e => setNama(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <CustomTextField multiline id='textarea-outlined' placeholder='Placeholder' label='Multiline Placeholder' />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <CustomTextField select fullWidth label='Status Aset' value={jenis} onChange={e => setJenis(e.target.value)}>
          <MenuItem value='aktif'>Aktif</MenuItem>
          <MenuItem value='non_aktif'>Non Aktif</MenuItem>
          <MenuItem value='publish'>Publish</MenuItem>
        </CustomTextField>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <CustomTextField
          fullWidth
          label='Jenis Aset (Tipe)'
          placeholder='Contoh: Rumah, Apartemen, Kantor'
          value={tipe}
          onChange={e => setTipe(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <CustomTextField
          fullWidth
          label='Alamat'
          placeholder='Alamat lengkap aset'
          multiline
          rows={2}
          value={alamat}
          onChange={e => setAlamat(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          fullWidth
          label='Kota'
          placeholder='Contoh: Jakarta Selatan'
          value={kota}
          onChange={e => setKota(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          fullWidth
          label='Provinsi'
          placeholder='Contoh: DKI Jakarta'
          value={provinsi}
          onChange={e => setProvinsi(e.target.value)}
        />
      </Grid>

      {/* Image Upload Section */}
      <Grid size={{ xs: 12 }}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Upload Gambar Aset
        </Typography>
        <div className='flex flex-col gap-4'>
          <Button
            component='label'
            variant='tonal'
            startIcon={<i className='tabler-upload' />}
            sx={{ width: 'fit-content' }}
            disabled={existingImages.length >= 3}
          >
            Pilih Gambar
            <input type='file' hidden multiple accept='image/*' onChange={handleFileChange} />
          </Button>

          {/* Selected New Files */}
          {selectedFiles.length > 0 && (
            <div className='flex flex-wrap gap-4'>
              {selectedFiles.map((file, index) => (
                <div key={index} className='flex flex-col items-center gap-1 border p-2 rounded relative group'>
                  <div className='absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <div
                      className='bg-red-500 text-white rounded-full p-1 cursor-pointer'
                      onClick={() => handleDeleteSelected(index)}
                    >
                      <i className='tabler-x text-xs' />
                    </div>
                  </div>
                  <Typography
                    variant='body2'
                    sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {file.name}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {(file.size / 1024).toFixed(0)} KB
                  </Typography>
                </div>
              ))}
            </div>
          )}

          {/* Display Existing Images */}
          {existingImages.length > 0 && (
            <div className='flex flex-col gap-2'>
              <Typography variant='subtitle2'>Gambar Tersimpan ({existingImages.length}/3):</Typography>
              <div className='flex flex-wrap gap-4'>
                {existingImages.map((img: any) => (
                  <div key={img.id} className='flex flex-col items-center gap-1 border p-2 rounded relative group'>
                    <img src={img.filepath} alt={img.filename} className='w-[100px] h-[100px] object-cover rounded' />
                    <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <Button
                        variant='contained'
                        color='error'
                        size='small'
                        sx={{ minWidth: 0, p: 1, borderRadius: '50%' }}
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        <i className='tabler-trash text-sm' />
                      </Button>
                    </div>

                    <Typography
                      variant='caption'
                      sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {img.filename}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Grid>

      {/* Map Section */}
      <Grid size={{ xs: 12 }}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Lokasi Aset
        </Typography>
        <MapPicker latitude={lat} longitude={lng} onLocationChange={handleLocationChange} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <div className='flex items-center justify-between'>
          <Button
            variant='tonal'
            color='secondary'
            disabled={activeStep === 0}
            onClick={handlePrev}
            startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
          >
            Previous
          </Button>
          <Button
            variant='contained'
            color={activeStep === steps.length - 1 ? 'success' : 'primary'}
            onClick={handleSubmit}
            endIcon={
              activeStep === steps.length - 1 ? (
                <i className='tabler-check' />
              ) : (
                <DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />
              )
            }
          >
            {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepAsetDetails
