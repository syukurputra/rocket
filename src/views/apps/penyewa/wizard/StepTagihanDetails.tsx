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
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import DirectionalIcon from '@components/DirectionalIcon'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/src/libs/styles/AppReactDatepicker'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

// Type Imports
import type { TagihanClient } from '@/src/types/apps/tagihanTypes'

type Props = {
  activeStep: number
  handleNext: () => void
  handlePrev: () => void
  steps: { title: string; subtitle: string }[]
  onSave: (data: any) => void
  penyewaId: string | null
}

type TagihanData = {
  id?: string
  keterangan: string
  status: string
  metodeBayar: string
  buktiPembayaran: string
  mulaiSewa: Date | null
  selesaiSewa: Date | null
  nominal: number
  jumlahBulan?: number
  jumlahTahun?: number
}

const StepTagihanDetails = ({ activeStep, handleNext, handlePrev, steps, penyewaId }: Props) => {
  // View State
  const [view, setView] = useState<'table' | 'form'>('table')
  const [tagihan, setTagihan] = useState<TagihanClient[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [keterangan, setKeterangan] = useState('')
  const [status, setStatus] = useState('BELUM TERBAYAR')
  const [metodeBayar, setMetodeBayar] = useState('')
  const [buktiPembayaran, setBuktiPembayaran] = useState('')
  const [mulaiSewa, setMulaiSewa] = useState<Date | null>(new Date())
  const [selesaiSewa, setSelesaiSewa] = useState<Date | null>(new Date())
  const [nominal, setNominal] = useState(0)
  const [jumlahBulan, setJumlahBulan] = useState(1)
  const [jumlahTahun, setJumlahTahun] = useState(1)

  // Periode sewa (input di form tagihan)
  const [periodeSewa, setPeriodeSewa] = useState<string>('bulanan')

  const [ruanganPricing, setRuanganPricing] = useState({
    hargaHarian: 0,
    hargaBulanan: 0,
    hargaTahunan: 0
  })

  const { snack: snackbar, showSnack: showSnackbar, closeSnack } = useSnackbar()

  useEffect(() => {
    if (penyewaId) {
      fetchTagihan()
      fetchPenyewaData()
    }
  }, [penyewaId])

  // Auto-calculate end date for bulanan and tahunan
  useEffect(() => {
    if (!mulaiSewa) return

    if (periodeSewa === 'bulanan' && jumlahBulan) {
      const endDate = new Date(mulaiSewa)

      endDate.setMonth(endDate.getMonth() + jumlahBulan)
      setSelesaiSewa(endDate)
    } else if (periodeSewa === 'tahunan' && jumlahTahun) {
      const endDate = new Date(mulaiSewa)

      endDate.setFullYear(endDate.getFullYear() + jumlahTahun)
      setSelesaiSewa(endDate)
    }
  }, [mulaiSewa, jumlahBulan, jumlahTahun, periodeSewa])

  // Auto-calculate nominal based on periode sewa (only when adding, not editing)
  useEffect(() => {
    if (editingId) return
    if (!mulaiSewa || !selesaiSewa) return

    let calculatedNominal = 0

    if (periodeSewa === 'harian') {
      const diffTime = Math.abs(selesaiSewa.getTime() - mulaiSewa.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      calculatedNominal = diffDays * ruanganPricing.hargaHarian
    } else if (periodeSewa === 'bulanan' && jumlahBulan) {
      calculatedNominal = jumlahBulan * ruanganPricing.hargaBulanan
    } else if (periodeSewa === 'tahunan' && jumlahTahun) {
      calculatedNominal = jumlahTahun * ruanganPricing.hargaTahunan
    }

    setNominal(calculatedNominal)
  }, [mulaiSewa, selesaiSewa, jumlahBulan, jumlahTahun, periodeSewa, ruanganPricing, editingId])

  const fetchPenyewaData = async () => {
    try {
      const response = await apiFetchClient<any>(`/api/penyewa/${penyewaId}`)

      if (response.data?.ruangan) {
        setRuanganPricing({
          hargaHarian: Number(response.data.ruangan.hargaHarian) || 0,
          hargaBulanan: Number(response.data.ruangan.hargaBulanan) || 0,
          hargaTahunan: Number(response.data.ruangan.hargaTahunan) || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch penyewa details:', error)
    }
  }

  const fetchTagihan = async () => {
    try {
      setLoading(true)
      const res = await apiFetchClient<{ data: TagihanClient[] }>(`/api/tagihan?penyewaId=${penyewaId}`)

      if (res.data) {
        setTagihan(res.data)
      }
    } catch (error) {
      console.error('Error fetching tagihan:', error)
      showSnackbar('Gagal memuat data tagihan', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    resetForm()
    setEditingId(null)
    setView('form')
  }

  const handleEdit = (item: TagihanClient) => {
    setEditingId(item.id)
    setKeterangan(item.keterangan || '')
    setStatus(item.status || 'BELUM TERBAYAR')
    setMetodeBayar(item.metodeBayar || '')
    setBuktiPembayaran(item.buktiPembayaran || '')
    setPeriodeSewa(item.periodeSewa || 'bulanan')
    setMulaiSewa(item.mulaiSewa ? new Date(item.mulaiSewa) : new Date())
    setSelesaiSewa(item.selesaiSewa ? new Date(item.selesaiSewa) : new Date())
    setNominal(Number(item.nominal) || 0)
    setView('form')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus tagihan ini?')) {
      try {
        await apiFetchClient(`/api/tagihan/${id}`, { method: 'DELETE' })
        fetchTagihan()
        showSnackbar('Tagihan berhasil dihapus', 'success')
      } catch (error) {
        console.error('Error deleting tagihan:', error)
        showSnackbar('Gagal menghapus tagihan', 'error')
      }
    }
  }

  const handleSendEmail = async (id: string) => {
    try {
      await apiFetchClient(`/api/tagihan/${id}/send-email`, { method: 'POST' })
      showSnackbar('Email berhasil dikirim', 'success')
    } catch (error) {
      console.error('Error sending email:', error)
      showSnackbar('Gagal mengirim email', 'error')
    }
  }



  const resetForm = () => {
    setKeterangan('')
    setStatus('BELUM TERBAYAR')
    setMetodeBayar('')
    setBuktiPembayaran('')
    setPeriodeSewa('bulanan')
    setMulaiSewa(new Date())
    setSelesaiSewa(new Date())
    setNominal(0)
    setJumlahBulan(1)
    setJumlahTahun(1)
  }

  const handleSubmit = async () => {
    if (!keterangan || !mulaiSewa || !selesaiSewa) {
      alert('Mohon lengkapi semua field yang diperlukan')

      return
    }

    const data = {
      keterangan,
      status,
      metodeBayar,
      buktiPembayaran,
      periodeSewa,
      mulaiSewa: mulaiSewa.toISOString(),
      selesaiSewa: selesaiSewa.toISOString(),
      nominal
    }

    try {
      if (editingId) {
        // Update
        await apiFetchClient(`/api/tagihan/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        })
        showSnackbar('Tagihan berhasil diupdate', 'success')
      } else {
        // Create
        await apiFetchClient(`/api/tagihan`, {
          method: 'POST',
          body: JSON.stringify({ ...data, penyewaId })
        })
        showSnackbar('Tagihan berhasil ditambahkan', 'success')
      }

      fetchTagihan()
      setView('table')
    } catch (error) {
      console.error('Error saving tagihan:', error)
      showSnackbar('Gagal menyimpan tagihan', 'error')
    }
  }



  const formatNumber = (num: number): string => {
    if (!num || num === 0) return '0'

    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  if (view === 'table') {
    return (
      <>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className='flex items-center justify-between'>
              <Typography variant='h5'>Daftar Tagihan</Typography>
              <Button variant='contained' onClick={handleAdd} startIcon={<i className='tabler-plus' />}>
                Tambah
              </Button>
            </div>
            <Typography className='mb-4'>Kelola daftar tagihan untuk penyewa ini.</Typography>

            <TableContainer component={Paper} sx={{ mt: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Keterangan</TableCell>
                    <TableCell>Periode Sewa</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tagihan.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align='center'>
                        Belum ada data tagihan
                      </TableCell>
                    </TableRow>
                  ) : (
                    tagihan.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.keterangan}</TableCell>
                        <TableCell>
                          {new Date(item.mulaiSewa).toLocaleDateString('id-ID')} -{' '}
                          {new Date(item.selesaiSewa).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>Rp {formatNumber(item.nominal)}</TableCell>
                        <TableCell>
                          <div className='flex flex-col gap-1'>
                            {item.status === 'LUNAS' ? (
                              <>
                                <Chip label='Lunas' color='success' size='small' variant='tonal' />
                              </>
                            ) : (
                              <Chip label='Belum Terbayar' color='error' size='small' variant='tonal' />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex gap-2'>

                            <Tooltip title='Ubah'>
                              <IconButton aria-label='Ubah' onClick={() => handleEdit(item)} sx={{ minWidth: 0, p: 1 }}>
                                <i className='tabler-edit' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Kirim Email'>
                              <IconButton
                                aria-label='Kirim Email'
                                onClick={() => handleSendEmail(item.id)}
                                sx={{ minWidth: 0, p: 1 }}
                              >
                                <i className='tabler-mail' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Hapus'>
                              <IconButton
                                aria-label='Hapus'
                                color='error'
                                onClick={() => handleDelete(item.id)}
                                sx={{ minWidth: 0, p: 1 }}
                              >
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
                onClick={() => {
                  alert('Wizard Completed!')
                  window.location.href = '/penyewa'
                }}
              >
                Finish
              </Button>
            </div>
          </Grid>
        </Grid>

        <AppSnackbar snack={snackbar} onClose={closeSnack} />
      </>
    )
  }

  // Form View
  return (
    <>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Typography variant='h5'>{editingId ? 'Ubah Tagihan' : 'Tambah Tagihan'}</Typography>
          <Typography>Silakan lengkapi detail tagihan.</Typography>
        </Grid>

        {/* Periode Sewa */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField
            select
            fullWidth
            label='Periode Sewa'
            value={periodeSewa}
            onChange={e => { setPeriodeSewa(e.target.value); setJumlahBulan(1); setJumlahTahun(1) }}
          >
            <MenuItem value='jam'>Jam</MenuItem>
            <MenuItem value='harian'>Harian</MenuItem>
            <MenuItem value='bulanan'>Bulanan</MenuItem>
            <MenuItem value='tahunan'>Tahunan</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Conditional fields based on periode sewa */}
        {periodeSewa === 'harian' && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppReactDatepicker
                selected={mulaiSewa}
                onChange={(date: Date | null) => setMulaiSewa(date)}
                placeholderText='DD-MM-YYYY'
                dateFormat='dd-MM-yyyy'
                customInput={<CustomTextField fullWidth label='Tanggal Mulai' required />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppReactDatepicker
                selected={selesaiSewa}
                onChange={(date: Date | null) => setSelesaiSewa(date)}
                placeholderText='DD-MM-YYYY'
                dateFormat='dd-MM-yyyy'
                customInput={<CustomTextField fullWidth label='Tanggal Selesai' required />}
              />
            </Grid>
          </>
        )}

        {periodeSewa === 'bulanan' && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppReactDatepicker
                selected={mulaiSewa}
                onChange={(date: Date | null) => setMulaiSewa(date)}
                placeholderText='DD-MM-YYYY'
                dateFormat='dd-MM-yyyy'
                customInput={<CustomTextField fullWidth label='Tanggal Mulai' required />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='number'
                label='Jumlah Bulan'
                value={jumlahBulan}
                onChange={e => setJumlahBulan(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Tanggal Selesai (Otomatis)'
                value={selesaiSewa ? selesaiSewa.toLocaleDateString('id-ID') : ''}
                disabled
              />
            </Grid>
          </>
        )}

        {periodeSewa === 'tahunan' && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppReactDatepicker
                selected={mulaiSewa}
                onChange={(date: Date | null) => setMulaiSewa(date)}
                placeholderText='DD-MM-YYYY'
                dateFormat='dd-MM-yyyy'
                customInput={<CustomTextField fullWidth label='Tanggal Mulai' required />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='number'
                label='Jumlah Tahun'
                value={jumlahTahun}
                onChange={e => setJumlahTahun(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Tanggal Selesai (Otomatis)'
                value={selesaiSewa ? selesaiSewa.toLocaleDateString('id-ID') : ''}
                disabled
              />
            </Grid>
          </>
        )}

        <Grid size={{ xs: 12 }}>
          {editingId ? (
            <CustomTextField
              fullWidth
              label='Nominal'
              type='number'
              value={nominal}
              onChange={e => setNominal(Number(e.target.value) || 0)}
              inputProps={{ min: 0 }}
            />
          ) : (
            <CustomTextField
              fullWidth
              label='Nominal (Otomatis)'
              value={`Rp ${nominal.toLocaleString('id-ID')}`}
              disabled
            />
          )}
        </Grid>
        <Grid size={{ xs: 12 }}>
          <CustomTextField
            fullWidth
            label='Keterangan'
            placeholder='Contoh: Tagihan Januari 2026'
            value={keterangan}
            onChange={e => setKeterangan(e.target.value)}
            required
          />
        </Grid>

        {editingId && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField select fullWidth label='Status' value={status} onChange={e => setStatus(e.target.value)}>
                <MenuItem value='BELUM TERBAYAR'>Belum Terbayar</MenuItem>
                <MenuItem value='LUNAS'>Lunas</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label='Metode Bayar'
                value={metodeBayar}
                onChange={e => setMetodeBayar(e.target.value)}
              >
                <MenuItem value=''>Pilih Metode</MenuItem>
                <MenuItem value='transfer'>Transfer</MenuItem>
                <MenuItem value='cash'>Cash</MenuItem>
              </CustomTextField>
            </Grid>
          </>
        )}

        <Grid size={{ xs: 12 }}>
          <div className='flex items-center justify-between'>
            <Button variant='tonal' color='secondary' onClick={() => setView('table')}>
              Cancel
            </Button>
            <Button variant='contained' color='primary' onClick={handleSubmit} endIcon={<i className='tabler-check' />}>
              Submit
            </Button>
          </div>
        </Grid>
      </Grid>

      <AppSnackbar snack={snackbar} onClose={closeSnack} />
    </>
  )
}

export default StepTagihanDetails
