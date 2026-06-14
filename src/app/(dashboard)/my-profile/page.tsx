'use client'

import { useRef, useState, useEffect } from 'react'
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
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
// Custom Components
import CustomTextField from '@core/components/mui/TextField'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'

const MapPicker = dynamic(() => import('@/src/components/MapPicker'), { ssr: false })

export default function MyProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Photo States
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoDeleting, setPhotoDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { snack, showSnack, closeSnack } = useSnackbar()

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
          setPhotoUrl(data.photoUrl || null)
        }
      } catch (error) {
        console.error('Failed to fetch profile', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // Fetch Provinsi on Mount
  useEffect(() => {
    const fetchProvinsi = async () => {
      try {
        const res = (await apiFetchClient('/api/master/provinsi')) as any[]
        setListProvinsi(res)

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

  // Fetch Kota when Province ID changes
  useEffect(() => {
    if (!selectedProvinsiId) {
      setListKota([])
      return
    }
    const fetchKota = async () => {
      try {
        const res = (await apiFetchClient(`/api/master/kota/${selectedProvinsiId}`)) as any[]
        setListKota(res)

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

  // Fetch Kecamatan when Kota ID changes
  useEffect(() => {
    if (!selectedKotaId) {
      setListKecamatan([])
      return
    }
    const fetchKecamatan = async () => {
      try {
        const res = (await apiFetchClient(`/api/master/kecamatan/${selectedKotaId}`)) as any[]
        setListKecamatan(res)

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

  // Fetch Kelurahan when Kecamatan ID changes
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoUploading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/user/profile/photo', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      })

      const data = await res.json()
      if (res.ok) {
        setPhotoUrl(data.photoUrl)
        // Update localStorage user data
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          localStorage.setItem('user', JSON.stringify({ ...parsed, photoUrl: data.photoUrl }))
        }
        showSnack('Foto profil berhasil diupload')
      } else {
        showSnack(data.message || 'Gagal mengupload foto', 'error')
      }
    } catch {
      showSnack('Gagal mengupload foto', 'error')
    } finally {
      setPhotoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePhotoDelete = async () => {
    setPhotoDeleting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/user/profile/photo', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      const data = await res.json()
      if (res.ok) {
        setPhotoUrl(null)
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          localStorage.setItem('user', JSON.stringify({ ...parsed, photoUrl: null }))
        }
        showSnack('Foto profil berhasil dihapus')
      } else {
        showSnack(data.message || 'Gagal menghapus foto', 'error')
      }
    } catch {
      showSnack('Gagal menghapus foto', 'error')
    } finally {
      setPhotoDeleting(false)
    }
  }

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

      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        showSnack('Profil berhasil diperbarui')
      } else {
        showSnack(data.message || 'Gagal memperbarui profil', 'error')
      }
    } catch {
      showSnack('Terjadi kesalahan', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className='flex justify-center items-center h-[300px]'>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader title='Akun Saya' titleTypographyProps={{ variant: 'h5' }} />
        <Divider />
        <CardContent>
          <Grid container spacing={6}>
            {/* Photo Section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='h6'>Foto Profil</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box className='flex items-center gap-6'>
                <Avatar
                  src={photoUrl || undefined}
                  alt={username || 'User'}
                  sx={{ width: 96, height: 96, fontSize: 36 }}
                />

                <Box className='flex flex-col gap-2'>
                  <Box className='flex gap-2'>
                    <Button
                      variant='contained'
                      size='small'
                      startIcon={<i className='tabler-upload' />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading || photoDeleting}
                    >
                      {photoUploading ? 'Mengupload...' : 'Upload Foto'}
                    </Button>
                    {photoUrl && (
                      <Button
                        variant='outlined'
                        color='error'
                        size='small'
                        startIcon={
                          photoDeleting ? <CircularProgress size={14} color='inherit' /> : <i className='tabler-trash' />
                        }
                        onClick={handlePhotoDelete}
                        disabled={photoUploading || photoDeleting}
                      >
                        {photoDeleting ? 'Menghapus...' : 'Hapus Foto'}
                      </Button>
                    )}
                  </Box>
                  <Typography variant='caption' color='text.secondary'>
                    JPG, PNG, atau WebP. Maksimal 2MB.
                  </Typography>
                </Box>

                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/jpeg,image/png,image/jpg,image/webp'
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

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
            <Grid size={{ xs: 12 }} className='flex justify-end gap-3 mt-4'>
              <Button variant='contained' color='primary' disabled={saving} onClick={handleSave}>
                {saving ? <CircularProgress size={24} color='inherit' /> : 'Simpan'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}
