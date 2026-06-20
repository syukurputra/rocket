// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import dynamic from 'next/dynamic'

import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Autocomplete from '@mui/material/Autocomplete'

import DirectionalIcon from '@components/DirectionalIcon'
import CustomTextField from '@core/components/mui/TextField'

// Utils
import { apiFetchClient } from '@/src/utils/apiFetchClient'

const MapPicker = dynamic(() => import('@/src/components/MapPicker'), { ssr: false })

type Props = {
  activeStep: number
  handleNext: () => void
  handlePrev: () => void
  steps: { title: string; subtitle: string }[]
  onSave: (data: any) => void
  initialData?: any
}

type PenyewaData = {
  id?: string
  nama: string
  status: string
  email: string
  nomorTelepon: string
  nomorKtp: string
  alamat: string
  provinsi: string
  kota: string
  kecamatan: string
  kelurahan: string
}

const StepPenyewaDetails = ({ activeStep, handleNext, handlePrev, steps, onSave, initialData }: Props) => {
  // View State
  const [view, setView] = useState<'form'>('form')
  const [editingId, setEditingId] = useState<string | null>(initialData?.id || null)

  // Form States
  const [nama, setNama] = useState(initialData?.nama || '')
  const [status, setStatus] = useState(initialData?.status || 'belum terbayar')
  const [email, setEmail] = useState(initialData?.email || '')
  const [nomorTelepon, setNomorTelepon] = useState(initialData?.nomorTelepon || '')
  const [nomorKtp, setNomorKtp] = useState(initialData?.nomorKtp || '')

  // Address States
  const [alamat, setAlamat] = useState(initialData?.alamat || '')
  const [provinsi, setProvinsi] = useState(initialData?.provinsi || '')
  const [kota, setKota] = useState(initialData?.kota || '')
  const [kecamatan, setKecamatan] = useState(initialData?.kecamatan || '')
  const [kelurahan, setKelurahan] = useState(initialData?.kelurahan || '')

  // Location States
  const [lat, setLat] = useState<number | undefined>(initialData?.latitude || undefined)
  const [lng, setLng] = useState<number | undefined>(initialData?.longitude || undefined)

  const handleLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
  }

  // Master Data Lists for Address
  const [listProvinsi, setListProvinsi] = useState<any[]>([])
  const [listKota, setListKota] = useState<any[]>([])
  const [listKecamatan, setListKecamatan] = useState<any[]>([])
  const [listKelurahan, setListKelurahan] = useState<any[]>([])

  // IDs for cascading fetch
  const [selectedProvinsiId, setSelectedProvinsiId] = useState<string>('')
  const [selectedKotaId, setSelectedKotaId] = useState<string>('')
  const [selectedKecamatanId, setSelectedKecamatanId] = useState<string>('')

  // --- Address Master Data Fetching Logic ---

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

  const resetForm = () => {
    setNama('')
    setStatus('belum terbayar')
    setEmail('')
    setNomorTelepon('')
    setNomorKtp('')
    setAlamat('')
    setProvinsi('')
    setKota('')
    setKecamatan('')
    setKelurahan('')
    setSelectedProvinsiId('')
    setSelectedKotaId('')
    setSelectedKecamatanId('')
  }

  const handleSubmit = () => {
    if (!nama) {
      alert('Mohon lengkapi nama penyewa')

      return
    }

    onSave({
      nama,
      status,
      email,
      nomorTelepon,
      nomorKtp,
      alamat,
      provinsi,
      kota,
      kecamatan,
      kelurahan,
      latitude: lat,
      longitude: lng
    })
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()

    if (statusLower === 'sudah terbayar' || statusLower === 'lunas') return 'success'
    if (statusLower === 'belum terbayar') return 'error'
    if (statusLower === 'booking') return 'warning'

    return 'default'
  }

  // Form View
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h5'>{editingId ? 'Ubah Penyewa' : 'Tambah Penyewa'}</Typography>
        <Typography>Silakan lengkapi detail penyewa.</Typography>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <CustomTextField
          fullWidth
          label='Nama Penyewa'
          placeholder='Nama Lengkap'
          value={nama}
          onChange={e => setNama(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <CustomTextField
          select
          fullWidth
          label='Status'
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <MenuItem value='belum terbayar'>Belum Terbayar</MenuItem>
          <MenuItem value='sudah terbayar'>Sudah Terbayar</MenuItem>
          <MenuItem value='booking'>Booking</MenuItem>
        </CustomTextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <CustomTextField
          fullWidth
          label='Email'
          placeholder='email@example.com'
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <CustomTextField
          fullWidth
          label='Nomor Telepon'
          placeholder='08123456789'
          value={nomorTelepon}
          onChange={e => setNomorTelepon(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <CustomTextField
          fullWidth
          label='Nomor KTP'
          placeholder='3201xxxxxxxxxxxxxxxx'
          value={nomorKtp}
          onChange={e => setNomorKtp(e.target.value)}
        />
      </Grid>

      {/* Address Section */}
      <Grid size={{ xs: 12 }}>
        <Typography variant='h6' sx={{ mt: 2 }}>
          Alamat Penyewa
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <CustomTextField
          fullWidth
          label='Alamat'
          placeholder='Alamat lengkap penyewa'
          multiline
          rows={2}
          value={alamat}
          onChange={e => setAlamat(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          fullWidth
          options={listProvinsi}
          getOptionLabel={option => option.name || ''}
          value={listProvinsi.find(p => p.name === provinsi) || null}
          onChange={(_, newValue) => {
            setProvinsi(newValue ? newValue.name : '')
            setSelectedProvinsiId(newValue ? newValue.id : '')
            setKota('')
            setSelectedKotaId('')
            setKecamatan('')
            setSelectedKecamatanId('')
            setKelurahan('')
          }}
          renderInput={params => <CustomTextField {...params} label='Provinsi' placeholder='Pilih Provinsi' />}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          fullWidth
          options={listKota}
          getOptionLabel={option => option.name || ''}
          value={listKota.find(k => k.name === kota) || null}
          onChange={(_, newValue) => {
            setKota(newValue ? newValue.name : '')
            setSelectedKotaId(newValue ? newValue.id : '')
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
      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          fullWidth
          options={listKecamatan}
          getOptionLabel={option => option.name || ''}
          value={listKecamatan.find(k => k.name === kecamatan) || null}
          onChange={(_, newValue) => {
            setKecamatan(newValue ? newValue.name : '')
            setSelectedKecamatanId(newValue ? newValue.id : '')
            setKelurahan('')
          }}
          disabled={!selectedKotaId}
          renderInput={params => (
            <CustomTextField {...params} label='Kecamatan' placeholder='Pilih Kecamatan' />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          fullWidth
          options={listKelurahan}
          getOptionLabel={option => option.name || ''}
          value={listKelurahan.find(k => k.name === kelurahan) || null}
          onChange={(_, newValue) => {
            setKelurahan(newValue ? newValue.name : '')
          }}
          disabled={!selectedKecamatanId}
          renderInput={params => (
            <CustomTextField {...params} label='Kelurahan' placeholder='Pilih Kelurahan' />
          )}
        />
      </Grid>

      {/* Map Section */}
      <Grid size={{ xs: 12 }}>
        <Typography variant='h6' sx={{ mt: 2 }}>
          Lokasi Penyewa
        </Typography>
        <MapPicker
          latitude={lat}
          longitude={lng}
          onLocationChange={handleLocationChange}
          containerId='penyewa-map-container'
        />
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
            color='primary'
            onClick={handleSubmit}
            endIcon={<DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />}
          >
            Next
          </Button>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepPenyewaDetails
