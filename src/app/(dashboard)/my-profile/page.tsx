'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

// Custom Components
import CustomTextField from '@core/components/mui/TextField'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

const MapPicker = dynamic(() => import('@/src/components/MapPicker'), { ssr: false })

export default function MyProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form States
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [nomorTelepon, setNomorTelepon] = useState('')
  const [nomorKtp, setNomorKtp] = useState('')

  // Address States
  const [alamat, setAlamat] = useState('')
  const [provinsi, setProvinsi] = useState('')
  const [kota, setKota] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [kelurahan, setKelurahan] = useState('')

  // Location States
  const [lat, setLat] = useState<number | undefined>(undefined)
  const [lng, setLng] = useState<number | undefined>(undefined)

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

  // Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetchClient<{ user: any }>('/api/user/profile')
        const data = res.user

        if (data) {
          setUsername(data.username || '')
          setEmail(data.email || '')
          setNomorTelepon(data.nomorTelepon || '')
          setNomorKtp(data.nomorKtp || '')
          setAlamat(data.alamat || '')
          setProvinsi(data.provinsi || '')
          setKota(data.kota || '')
          setKecamatan(data.kecamatan || '')
          setKelurahan(data.kelurahan || '')
          setLat(data.latitude || undefined)
          setLng(data.longitude || undefined)
        }
      } catch (error) {
        console.error('Failed to fetch profile', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // 1. Fetch Provinsi on Mount
  useEffect(() => {
    const fetchProvinsi = async () => {
      try {
        const res = (await apiFetchClient('/api/master/provinsi')) as any[]
        setListProvinsi(res)

        // If initial data exists, set selected ID
        if (provinsi && res.length > 0) {
          const found = res.find((p: any) => p.name === provinsi)
          if (found) setSelectedProvinsiId(found.id)
        }
      } catch (err) {
        console.error('Failed to fetch provinsi', err)
      }
    }
    fetchProvinsi()
  }, [provinsi])

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
        if (kota && res.length > 0) {
          const found = res.find((c: any) => c.name === kota)
          if (found) setSelectedKotaId(found.id)
        }
      } catch (err) {
        console.error('Failed to fetch kota', err)
      }
    }
    fetchKota()
  }, [selectedProvinsiId, kota])

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
        if (kecamatan && res.length > 0) {
          const found = res.find((k: any) => k.name === kecamatan)
          if (found) setSelectedKecamatanId(found.id)
        }
      } catch (err) {
        console.error('Failed to fetch kecamatan', err)
      }
    }
    fetchKecamatan()
  }, [selectedKotaId, kecamatan])

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        username,
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
      }
      
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        alert('Profile updated successfully!')
      } else {
        const errorData = await res.json()
        alert('Failed to update profile: ' + (errorData.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving profile', error)
      alert('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-[300px]">
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Akun Saya" titleTypographyProps={{ variant: 'h5' }} />
      <Divider />
      <CardContent>
        <Grid container spacing={6}>
          {/* Personal Info Section */}
          <Grid size={{ xs: 12 }}>
            <Typography variant='h6'>Informasi Pribadi</Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label='Username'
              placeholder='Username'
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
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
              Alamat Lengkap
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Alamat'
              placeholder='Alamat lengkap (Nama jalan, RT/RW, No. Rumah)'
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
              Lokasi Peta
            </Typography>
            <MapPicker
              latitude={lat}
              longitude={lng}
              onLocationChange={handleLocationChange}
              containerId='my-profile-map-container'
            />
          </Grid>

          {/* Action Buttons */}
          <Grid size={{ xs: 12 }} className="flex justify-end gap-3 mt-4">
            <Button
              variant='contained'
              color='primary'
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Simpan Perubahan'}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
