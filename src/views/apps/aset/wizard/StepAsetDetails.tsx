// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import dynamic from 'next/dynamic'

import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import Autocomplete from '@mui/material/Autocomplete'

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
  onSave: (data: any, files?: File[]) => Promise<void>
  initialData?: any
  onShowMessage?: (message: string, type: 'success' | 'error') => void
}

const StepAsetDetails = ({ activeStep, handleNext, handlePrev, steps, onSave, initialData, onShowMessage }: Props) => {
  // States
  const [nama, setNama] = useState(initialData?.nama || '')
  const [jenis, setJenis] = useState(initialData?.status || 'aktif')
  const [tipe, setTipe] = useState(initialData?.jenis || '') // Map DB 'jenis' to UI 'tipe'
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi || '')

  const [alamat, setAlamat] = useState(initialData?.alamat || '')

  // Wilayah State (Storing Names to match DB schema)
  const [provinsi, setProvinsi] = useState(initialData?.provinsi || '')
  const [kota, setKota] = useState(initialData?.kota || '')
  const [kecamatan, setKecamatan] = useState(initialData?.kecamatan || '')
  const [kelurahan, setKelurahan] = useState(initialData?.kelurahan || '')

  // Master Data Lists
  const [listProvinsi, setListProvinsi] = useState<any[]>([])
  const [listKota, setListKota] = useState<any[]>([])
  const [listKecamatan, setListKecamatan] = useState<any[]>([])
  const [listKelurahan, setListKelurahan] = useState<any[]>([])

  // IDs for cascading fetch
  const [selectedProvinsiId, setSelectedProvinsiId] = useState<string>('')
  const [selectedKotaId, setSelectedKotaId] = useState<string>('')
  const [selectedKecamatanId, setSelectedKecamatanId] = useState<string>('')

  const [lat, setLat] = useState<number | undefined>(initialData?.latitude || undefined)
  const [lng, setLng] = useState<number | undefined>(initialData?.longitude || undefined)

  const handleLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
  }

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<any[]>(initialData?.images || [])
  const [isLoading, setIsLoading] = useState(false)

  // Update form when initialData changes (after save)
  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama || '')
      setJenis(initialData.status || 'aktif')
      setTipe(initialData.jenis || '')
      setDeskripsi(initialData.deskripsi || '')
      setAlamat(initialData.alamat || '')
      setKota(initialData.kota || '')
      setProvinsi(initialData.provinsi || '')
      setKecamatan(initialData.kecamatan || '')
      setKelurahan(initialData.kelurahan || '')
      setLat(initialData.latitude || undefined)
      setLng(initialData.longitude || undefined)
      setExistingImages(initialData.images || [])
    }
  }, [initialData])

  // --- Master Data Fetching Logic ---

  // 1. Fetch Provinsi on Mount
  useEffect(() => {
    const fetchProvinsi = async () => {
      try {
        const res = (await apiFetchClient('/api/master/provinsi')) as any[]

        setListProvinsi(res)

        // If initial data exists, set selected ID
        if (initialData?.provinsi && res.length > 0) {
          const found = res.find((p: any) => p.name === initialData.provinsi)

          if (found) setSelectedProvinsiId(found.id)
        }
      } catch (err) {
        console.error('Failed to fetch provinsi', err)
      }
    }

    fetchProvinsi()
  }, [initialData?.provinsi])

  // 2. Fetch Kota when Province ID changes
  useEffect(() => {
    if (!selectedProvinsiId) {
      setListKota([])

      // Only reset child fields if user changed parent manually, not on initial load sync
      return
    }

    const fetchKota = async () => {
      try {
        const res = (await apiFetchClient(`/api/master/kota/${selectedProvinsiId}`)) as any[]

        setListKota(res)

        // Sync initial Kota ID
        if (initialData?.kota && res.length > 0) {
          const found = res.find((c: any) => c.name === initialData.kota)

          if (found) setSelectedKotaId(found.id)
        }
      } catch (err) {
        console.error('Failed to fetch kota', err)
      }
    }

    fetchKota()
  }, [selectedProvinsiId, initialData?.kota])

  // 3. Fetch Kecamatan when Kota ID changes
  useEffect(() => {
    if (!selectedKotaId) {
      setListKecamatan([])

      return
    }

    const fetchKecamatan = async () => {
      try {
        const res = (await apiFetchClient(`/api/master/kecamatan/${selectedKotaId}`)) as any[]

        setListKecamatan(res)

        // Sync initial Kecamatan ID
        if (initialData?.kecamatan && res.length > 0) {
          const found = res.find((k: any) => k.name === initialData.kecamatan)

          if (found) setSelectedKecamatanId(found.id)
        }
      } catch (err) {
        console.error('Failed to fetch kecamatan', err)
      }
    }

    fetchKecamatan()
  }, [selectedKotaId, initialData?.kecamatan])

  // 4. Fetch Kelurahan when Kecamatan ID changes
  useEffect(() => {
    if (!selectedKecamatanId) {
      setListKelurahan([])

      return
    }

    const fetchKelurahan = async () => {
      try {
        const res = (await apiFetchClient(`/api/master/kelurahan/${selectedKecamatanId}`)) as any[]

        setListKelurahan(res)
      } catch (err) {
        console.error('Failed to fetch kelurahan', err)
      }
    }

    fetchKelurahan()
  }, [selectedKecamatanId])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files)

      // Limit to 3 files max for new upload
      // Also consider existing images count if we want a strict total limit,
      // but usually "upload limit" refers to the batch or typical max per field.
      // User said "maksimal upload 3 image". Let's restrict selection to 3 for now.
      if (files.length > 3) {
        onShowMessage?.('Maksimal upload 3 gambar', 'error')

        return
      }

      if (existingImages.length + files.length > 3) {
        onShowMessage?.(
          `Total gambar tidak boleh lebih dari 3. Saat ini sudah ada ${existingImages.length} gambar.`,
          'error'
        )

        return
      }

      setSelectedFiles(files)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      await apiFetchClient(`/api/aset-image/${imageId}`, { method: 'DELETE' })

      // Remove from state
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Error deleting image:', error)
      onShowMessage?.('Gagal menghapus gambar', 'error')
    }
  }

  const handleDeleteSelected = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      await onSave(
        {
          nama,
          jenis: tipe, // UI Tipe -> DB jenis
          status: jenis, // UI Jenis -> DB status
          deskripsi,
          alamat,
          provinsi, // String name
          kota,
          kecamatan,
          kelurahan,
          latitude: lat,
          longitude: lng
        },
        selectedFiles
      )
    } catch (error) {
      console.error('Error in handleSubmit:', error)
    } finally {
      setIsLoading(false)
    }
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
      <Grid size={{ xs: 12, md: 12 }}>
        <CustomTextField
          fullWidth
          rows={4}
          multiline
          id='textarea-outlined'
          placeholder='Deskripsi'
          label='Deskripsi'
          value={deskripsi}
          onChange={e => setDeskripsi(e.target.value)}
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
        <Autocomplete
          fullWidth
          options={listProvinsi}
          getOptionLabel={option => option.name || ''}
          value={listProvinsi.find(p => p.name === provinsi) || null}
          onChange={(_, newValue) => {
            setProvinsi(newValue ? newValue.name : '')
            setSelectedProvinsiId(newValue ? newValue.id : '')

            // Reset children
            setKota('')
            setSelectedKotaId('')
            setKecamatan('')
            setSelectedKecamatanId('')
            setKelurahan('')
          }}
          renderInput={params => <CustomTextField {...params} label='Provinsi' placeholder='Pilih Provinsi' />}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          fullWidth
          options={listKota}
          getOptionLabel={option => option.name || ''}
          value={listKota.find(k => k.name === kota) || null}
          onChange={(_, newValue) => {
            setKota(newValue ? newValue.name : '')
            setSelectedKotaId(newValue ? newValue.id : '')

            // Reset children
            setKecamatan('')
            setSelectedKecamatanId('')
            setKelurahan('')
          }}
          disabled={!selectedProvinsiId}
          renderInput={params => (
            <CustomTextField {...params} label='Kota/Kabupaten' placeholder='Pilih Kota/Kabupaten' />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          fullWidth
          options={listKecamatan}
          getOptionLabel={option => option.name || ''}
          value={listKecamatan.find(k => k.name === kecamatan) || null}
          onChange={(_, newValue) => {
            setKecamatan(newValue ? newValue.name : '')
            setSelectedKecamatanId(newValue ? newValue.id : '')

            // Reset children
            setKelurahan('')
          }}
          disabled={!selectedKotaId}
          renderInput={params => <CustomTextField {...params} label='Kecamatan' placeholder='Pilih Kecamatan' />}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          fullWidth
          options={listKelurahan}
          getOptionLabel={option => option.name || ''}
          value={listKelurahan.find(k => k.name === kelurahan) || null}
          onChange={(_, newValue) => {
            setKelurahan(newValue ? newValue.name : '')
          }}
          disabled={!selectedKecamatanId}
          renderInput={params => <CustomTextField {...params} label='Kelurahan' placeholder='Pilih Kelurahan' />}
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
            disabled={isLoading}
            endIcon={
              isLoading ? (
                <CircularProgress size={20} color='inherit' />
              ) : activeStep === steps.length - 1 ? (
                <i className='tabler-check' />
              ) : (
                <DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />
              )
            }
          >
            {isLoading ? 'Menyimpan...' : activeStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepAsetDetails
