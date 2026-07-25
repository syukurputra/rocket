'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import { useRouter, useSearchParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'

// Third-party Imports
import classnames from 'classnames'

import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import StepperWrapper from '@core/styles/stepper'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'

const MapPicker = dynamic(() => import('@/src/components/MapPicker'), { ssr: false })

// Sidebar sections
const steps = [
  { icon: 'tabler-building', title: 'Informasi Usaha', subtitle: 'Nama, email & telepon' },
  { icon: 'tabler-map-pin', title: 'Informasi Alamat', subtitle: 'Alamat & lokasi' },
  { icon: 'tabler-building-bank', title: 'Informasi Rekening', subtitle: 'Rekening penerimaan dana' }
]

const CompanyEditView = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { snack, showSnack, closeSnack } = useSnackbar()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const initialStep = (() => {
    const raw = Number(searchParams.get('step'))

    return Number.isInteger(raw) && raw >= 0 && raw < steps.length ? raw : 0
  })()

  const [activeStep, setActiveStep] = useState(initialStep)

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telepon: '',
    alamat: '',
    bankPenerima: '',
    nomorRekening: '',
    rekeningPenerima: ''
  })

  // Address states
  const [provinsi, setProvinsi] = useState('')
  const [kota, setKota] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [kelurahan, setKelurahan] = useState('')

  // Location states
  const [lat, setLat] = useState<number | undefined>(undefined)
  const [lng, setLng] = useState<number | undefined>(undefined)

  const handleLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
  }

  // Master data lists for address
  const [listProvinsi, setListProvinsi] = useState<any[]>([])
  const [listKota, setListKota] = useState<any[]>([])
  const [listKecamatan, setListKecamatan] = useState<any[]>([])
  const [listKelurahan, setListKelurahan] = useState<any[]>([])

  // IDs for cascading fetch
  const [selectedProvinsiId, setSelectedProvinsiId] = useState('')
  const [selectedKotaId, setSelectedKotaId] = useState('')
  const [selectedKecamatanId, setSelectedKecamatanId] = useState('')

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await apiFetchClient<{ data: any }>('/api/setting/company')
        const d = res.data

        setFormData({
          nama: d.nama || '',
          email: d.email || '',
          telepon: d.telepon || '',
          alamat: d.alamat || '',
          bankPenerima: d.bankPenerima || '',
          nomorRekening: d.nomorRekening || '',
          rekeningPenerima: d.rekeningPenerima || ''
        })
        setProvinsi(d.provinsi || '')
        setKota(d.kota || '')
        setKecamatan(d.kecamatan || '')
        setKelurahan(d.kelurahan || '')
        setLat(d.latitude || undefined)
        setLng(d.longitude || undefined)
      } catch (error) {
        console.error('Failed to fetch company:', error)
        showSnack('Gagal memuat data perusahaan', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch provinsi on mount
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

  // Fetch kota when provinsi ID changes
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

  // Fetch kecamatan when kota ID changes
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

  // Fetch kelurahan when kecamatan ID changes
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
        ...formData,
        provinsi,
        kota,
        kecamatan,
        kelurahan,
        latitude: lat,
        longitude: lng
      }

      await apiFetchClient('/api/setting/company', {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      showSnack('Informasi usaha berhasil diperbarui')
      router.push('/setting/company')
    } catch (error: any) {
      console.error('Update company error:', error)
      showSnack(error?.message || 'Gagal memperbarui informasi usaha', 'error')
    } finally {
      setSaving(false)
    }
  }

  const set = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }))

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
      <Card className='flex flex-col lg:flex-row'>
        {/* Sidebar */}
        <CardContent className='max-lg:border-be lg:border-ie lg:min-is-[300px]'>
          <StepperWrapper>
            <Stepper
              activeStep={activeStep}
              orientation='vertical'
              connector={<></>}
              className='flex flex-col gap-4 min-is-[220px]'
            >
              {steps.map((label, index) => (
                <Step key={index} onClick={() => setActiveStep(index)}>
                  <StepLabel icon={<></>} className='p-1 cursor-pointer'>
                    <div className='step-label'>
                      <CustomAvatar
                        variant='rounded'
                        skin={activeStep === index ? 'filled' : 'light'}
                        {...(activeStep === index && { color: 'primary', className: 'shadow-primarySm' })}
                        size={38}
                      >
                        <i className={classnames(label.icon, '!text-[22px]')} />
                      </CustomAvatar>
                      <div className='flex flex-col'>
                        <Typography color='text.primary' className='step-title'>
                          {label.title}
                        </Typography>
                        <Typography className='step-subtitle'>{label.subtitle}</Typography>
                      </div>
                    </div>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </StepperWrapper>
        </CardContent>

        {/* Content */}
        <CardContent className='flex-1 pbs-6'>
          <Grid container spacing={6}>
            {activeStep === 0 && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Typography variant='h5'>Informasi Usaha</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Nama, email & telepon perusahaan Anda.
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <CustomTextField
                    fullWidth
                    required
                    label='Nama Perusahaan'
                    placeholder='Nama perusahaan'
                    value={formData.nama}
                    onChange={set('nama')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    type='email'
                    label='Email'
                    placeholder='email@example.com'
                    value={formData.email}
                    onChange={set('email')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Telepon'
                    placeholder='08123456789'
                    value={formData.telepon}
                    onChange={set('telepon')}
                  />
                </Grid>
              </>
            )}

            {activeStep === 1 && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Typography variant='h5'>Informasi Alamat</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Lengkapi alamat & titik lokasi Anda.
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <CustomTextField
                    fullWidth
                    label='Alamat'
                    placeholder='Alamat lengkap (Nama jalan, RT/RW, No. Rumah)'
                    multiline
                    rows={2}
                    value={formData.alamat}
                    onChange={set('alamat')}
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
                    renderInput={params => <CustomTextField {...params} label='Kecamatan' placeholder='Pilih Kecamatan' />}
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
                    renderInput={params => <CustomTextField {...params} label='Kelurahan' placeholder='Pilih Kelurahan' />}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant='h6' className='mbe-2'>Lokasi Peta</Typography>
                  <MapPicker
                    latitude={lat}
                    longitude={lng}
                    onLocationChange={handleLocationChange}
                    containerId='company-edit-map-container'
                  />
                </Grid>
              </>
            )}

            {activeStep === 2 && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Typography variant='h5'>Informasi Rekening</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Rekening penerimaan dana hasil sewa.
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <CustomTextField
                    fullWidth
                    label='Bank Penerima'
                    placeholder='mis. BCA, Mandiri, BNI'
                    value={formData.bankPenerima}
                    onChange={set('bankPenerima')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CustomTextField
                    fullWidth
                    label='Nomor Rekening'
                    placeholder='Nomor rekening'
                    value={formData.nomorRekening}
                    onChange={set('nomorRekening')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CustomTextField
                    fullWidth
                    label='Rekening Penerima'
                    placeholder='Nama pemilik rekening'
                    value={formData.rekeningPenerima}
                    onChange={set('rekeningPenerima')}
                  />
                </Grid>
              </>
            )}

            {/* Action */}
            <Grid size={{ xs: 12 }} className='flex justify-end gap-3 mt-4'>
              <Button color='secondary' onClick={() => router.push('/setting/company')} disabled={saving}>
                Batal
              </Button>
              <Button variant='contained' onClick={handleSave} disabled={saving || !formData.nama}>
                {saving ? <CircularProgress size={20} color='inherit' /> : 'Simpan'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default CompanyEditView
