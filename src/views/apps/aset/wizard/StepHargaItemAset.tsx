// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import DirectionalIcon from '@components/DirectionalIcon'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Props = {
  activeStep: number
  handleNext: () => void
  handlePrev: () => void
  steps: { title: string; subtitle: string }[]
  asetId: string | null
  onShowMessage?: (message: string, type: 'success' | 'error') => void
}

type ItemAsetData = { id: string; nama: string }

type HargaData = {
  id: string
  ruanganId: string
  jenisHarga: string
  harga: number
  ruangan?: ItemAsetData
}

const JENIS_OPTIONS = ['JAM', 'HARIAN', 'BULANAN', 'TAHUNAN']

const jenisLabel = (j: string) => ({ JAM: 'Jam', HARIAN: 'Harian', BULANAN: 'Bulanan', TAHUNAN: 'Tahunan' }[j] ?? j)

const jenisColor = (j: string): 'default' | 'info' | 'success' | 'warning' => ({
  JAM: 'default',
  HARIAN: 'info',
  BULANAN: 'success',
  TAHUNAN: 'warning'
}[j] as any ?? 'default')

const formatRupiah = (val: number | string) =>
  Number(val).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

const formatNumber = (val: string) => val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const parseNumber = (val: string) => val.replace(/\./g, '')

const StepHargaItemAset = ({ activeStep, handleNext, handlePrev, steps, asetId, onShowMessage }: Props) => {
  const [view, setView] = useState<'table' | 'form'>('table')
  const [list, setList] = useState<HargaData[]>([])
  const [itemAsets, setItemAsets] = useState<ItemAsetData[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [selectedRuanganId, setSelectedRuanganId] = useState('')
  const [jenisHarga, setJenisHarga] = useState('HARIAN')
  const [harga, setHarga] = useState('')

  useEffect(() => {
    if (asetId) {
      fetchItemAsets()
      fetchHarga()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asetId])

  const fetchItemAsets = async () => {
    try {
      const res = await apiFetchClient<{ data: ItemAsetData[] }>(`/api/ruangan?asetId=${asetId}`)

      if (res.data) setItemAsets(res.data)
    } catch { /* noop */ }
  }

  const fetchHarga = async () => {
    try {
      const res = await apiFetchClient<{ data: HargaData[] }>(`/api/harga-item-aset?asetId=${asetId}`)

      if (res.data) setList(res.data)
    } catch { /* noop */ }
  }

  const resetForm = () => {
    setSelectedRuanganId('')
    setJenisHarga('HARIAN')
    setHarga('')
    setEditingId(null)
  }

  const handleAdd = () => { resetForm(); setView('form') }

  const handleEdit = (item: HargaData) => {
    setEditingId(item.id)
    setSelectedRuanganId(item.ruanganId)
    setJenisHarga(item.jenisHarga)
    setHarga(formatNumber(String(Math.floor(Number(item.harga)))))
    setView('form')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus harga ini?')) return
    try {
      await apiFetchClient(`/api/harga-item-aset/${id}`, { method: 'DELETE' })
      fetchHarga()
    } catch {
      onShowMessage?.('Gagal menghapus harga.', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!selectedRuanganId || !jenisHarga || !harga) {
      onShowMessage?.('Semua field harus diisi.', 'error')

      return
    }

    try {
      const payload = { ruanganId: selectedRuanganId, jenisHarga, harga: Number(parseNumber(harga)) }

      if (editingId) {
        await apiFetchClient(`/api/harga-item-aset/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      } else {
        await apiFetchClient('/api/harga-item-aset', { method: 'POST', body: JSON.stringify(payload) })
      }

      fetchHarga()
      setView('table')
      resetForm()
    } catch {
      onShowMessage?.('Gagal menyimpan harga.', 'error')
    }
  }

  if (view === 'table') {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className='flex items-center justify-between'>
            <Typography variant='h5'>Harga Item Aset</Typography>
            <Button variant='contained' onClick={handleAdd} startIcon={<i className='tabler-plus' />}>
              Tambah
            </Button>
          </div>
          <Typography className='mb-4'>Kelola daftar harga per jenis sewa.</Typography>

          <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Aset</TableCell>
                  <TableCell>Jenis Harga</TableCell>
                  <TableCell>Harga</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>Belum ada data harga</TableCell>
                  </TableRow>
                ) : (
                  list.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.ruangan?.nama || '-'}</TableCell>
                      <TableCell>
                        <Chip label={jenisLabel(item.jenisHarga)} color={jenisColor(item.jenisHarga)} size='small' variant='tonal' />
                      </TableCell>
                      <TableCell>{formatRupiah(item.harga)}</TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Tooltip title='Ubah'>
                            <IconButton onClick={() => handleEdit(item)} sx={{ minWidth: 0, p: 1 }}>
                              <i className='tabler-edit' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Hapus'>
                            <IconButton color='error' onClick={() => handleDelete(item.id)} sx={{ minWidth: 0, p: 1 }}>
                              <i className='tabler-trash' />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <div className='flex items-center justify-between'>
            <Button
              variant='tonal'
              color='secondary'
              onClick={handlePrev}
              startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
            >
              Previous
            </Button>
            <Button
              variant='contained'
              color='success'
              onClick={handleNext}
              endIcon={<i className='tabler-check' />}
            >
              Finish
            </Button>
          </div>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h5'>{editingId ? 'Edit Harga Item Aset' : 'Tambah Harga Item Aset'}</Typography>
        <Typography>Silakan lengkapi detail harga item aset.</Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          select
          fullWidth
          label='Pilih Item Aset'
          value={selectedRuanganId}
          onChange={e => setSelectedRuanganId(e.target.value)}
        >
          <MenuItem value=''>-- Pilih Item Aset --</MenuItem>
          {itemAsets.map(r => (
            <MenuItem key={r.id} value={r.id}>{r.nama}</MenuItem>
          ))}
        </CustomTextField>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          select
          fullWidth
          label='Jenis Harga'
          value={jenisHarga}
          onChange={e => setJenisHarga(e.target.value)}
        >
          {JENIS_OPTIONS.map(j => (
            <MenuItem key={j} value={j}>{jenisLabel(j)}</MenuItem>
          ))}
        </CustomTextField>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          fullWidth
          label='Harga'
          placeholder='0'
          value={harga}
          onChange={e => setHarga(formatNumber(e.target.value))}
          inputProps={{ inputMode: 'numeric' }}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <div className='flex items-center justify-between'>
          <Button variant='tonal' color='secondary' onClick={() => { setView('table'); resetForm() }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleSubmit}
            endIcon={<i className='tabler-check' />}
            disabled={!selectedRuanganId || !harga}
          >
            Submit
          </Button>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepHargaItemAset
