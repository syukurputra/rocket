// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'

import DirectionalIcon from '@components/DirectionalIcon'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/src/libs/styles/AppReactDatepicker'

// Utils
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Props = {
  activeStep: number
  handleNext: () => void
  handlePrev: () => void
  steps: { title: string; subtitle: string }[]
  onSave: (data: any) => void
  initialData?: any
}

type AsetOption = {
  id: string
  nama: string
  jenis: string
}

type RuanganOption = {
  id: string
  nama: string
  status: string
}

type PenyewaData = {
  id?: string
  nama: string
  status: string
  asetId: string
  ruanganId: string
  periodeSewa: string
  mulaiSewa: Date | null
  selesaiSewa: Date | null
  email: string
  nomorTelepon: string
}

const StepPenyewaDetails = ({ activeStep, handleNext, handlePrev, steps, onSave, initialData }: Props) => {
  // View State
  const [view, setView] = useState<'form'>('form')
  const [editingId, setEditingId] = useState<string | null>(initialData?.id || null)

  // Form States
  const [nama, setNama] = useState(initialData?.nama || '')
  const [status, setStatus] = useState(initialData?.status || 'belum terbayar')
  const [asetId, setAsetId] = useState(initialData?.asetId || '')
  const [ruanganId, setRuanganId] = useState(initialData?.ruanganId || '')
  const [periodeSewa, setPeriodeSewa] = useState(initialData?.periodeSewa || 'bulanan')

  const [mulaiSewa, setMulaiSewa] = useState<Date | null>(
    initialData?.mulaiSewa ? new Date(initialData.mulaiSewa) : new Date()
  )

  const [selesaiSewa, setSelesaiSewa] = useState<Date | null>(
    initialData?.selesaiSewa ? new Date(initialData.selesaiSewa) : null
  )

  const [email, setEmail] = useState(initialData?.email || '')
  const [nomorTelepon, setNomorTelepon] = useState(initialData?.nomorTelepon || '')

  // Data Options
  const [asetList, setAsetList] = useState<AsetOption[]>([])
  const [ruanganList, setRuanganList] = useState<RuanganOption[]>([])

  useEffect(() => {
    fetchAsets()
  }, [])

  useEffect(() => {
    if (asetId) {
      fetchRuangan(asetId)
    } else {
      setRuanganList([])
    }
  }, [asetId])

  const fetchAsets = async () => {
    try {
      const res = await apiFetchClient<{ data: AsetOption[] }>('/api/aset')

      if (res.data) setAsetList(res.data)
    } catch (error) {
      console.error('Error fetching asets:', error)
    }
  }

  const fetchRuangan = async (id: string) => {
    try {
      const res = await apiFetchClient<{ data: RuanganOption[] }>(`/api/ruangan?asetId=${id}`)

      if (res.data) {
        setRuanganList(res.data)
      }
    } catch (error) {
      console.error('Error fetching ruangan:', error)
    }
  }

  const resetForm = () => {
    setNama('')
    setStatus('belum terbayar')
    setAsetId('')
    setRuanganId('')
    setPeriodeSewa('bulanan')
    setMulaiHuni(new Date())
    setSelesaiHuni(null)
    setEmail('')
    setNomorTelepon('')
  }

  const handleSubmit = () => {
    // Basic Validation
    if (!nama || !asetId || !ruanganId) {
      alert('Mohon lengkapi data wajib (Nama, Aset, Ruangan)')

      return
    }

    onSave({
      nama,
      status,
      asetId,
      ruanganId,
      periodeSewa,
      mulaiSewa,
      selesaiSewa,
      email,
      nomorTelepon
    })
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()

    if (statusLower === 'sudah terbayar' || statusLower === 'lunas') return 'success'
    if (statusLower === 'belum terbayar') return 'error'

    return 'default'
  }

  // Form View
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h5'>{editingId ? 'Ubah Penyewa' : 'Tambah Penyewa'}</Typography>
        <Typography>Silakan lengkapi detail penyewa.</Typography>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Grid container spacing={6}>
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
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Nama Aset'
                  value={asetId}
                  onChange={e => {
                    setAsetId(e.target.value)
                    setRuanganId('') // Reset ruangan when aset changes
                  }}
                >
                  {asetList.map(aset => (
                    <MenuItem key={aset.id} value={aset.id}>
                      {aset.nama}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Nama Item Aset'
                  value={ruanganId}
                  onChange={e => setRuanganId(e.target.value)}
                  disabled={!asetId}
                >
                  {ruanganList.map(ruangan => (
                    <MenuItem key={ruangan.id} value={ruangan.id}>
                      {ruangan.nama} - {ruangan.status}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Periode Sewa'
                  value={periodeSewa}
                  onChange={e => setPeriodeSewa(e.target.value)}
                >
                  <MenuItem value='harian'>Harian</MenuItem>
                  <MenuItem value='bulanan'>Bulanan</MenuItem>
                  <MenuItem value='tahunan'>Tahunan</MenuItem>
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <AppReactDatepicker
                  selected={mulaiSewa}
                  onChange={(date: Date | null) => setMulaiSewa(date)}
                  placeholderText='DD-MM-YYYY'
                  dateFormat='dd-MM-yyyy'
                  customInput={<CustomTextField fullWidth label='Mulai Sewa' />}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <AppReactDatepicker
                  selected={selesaiSewa}
                  onChange={(date: Date | null) => setSelesaiSewa(date)}
                  placeholderText='DD-MM-YYYY'
                  dateFormat='dd-MM-yyyy'
                  customInput={<CustomTextField fullWidth label='Selesai Sewa' />}
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
            </Grid>
          </CardContent>
        </Card>
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
