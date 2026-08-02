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
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'

// Component Imports
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import DirectionalIcon from '@components/DirectionalIcon'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/src/libs/styles/AppReactDatepicker'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import ConfirmDialog, { useConfirm } from '@/src/components/ConfirmDialog'
import { downloadPdfFromApi } from '@/src/utils/downloadPdf'

// Type Imports
import type { TagihanClient } from '@/src/types/apps/tagihanTypes'

type AsetOption = { id: string; nama: string; jenis: string }
type ItemAsetOption = { id: string; nama: string; status: string; hargaItemAset?: { jenisHarga: string; harga: number }[] }

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
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; item: TagihanClient } | null>(null)

  // Form State
  const [keterangan, setKeterangan] = useState('')
  const [status, setStatus] = useState('BELUM TERBAYAR')
  const [metodeBayar, setMetodeBayar] = useState('')
  const [buktiPembayaran, setBuktiPembayaran] = useState('')
  const [mulaiSewa, setMulaiSewa] = useState<Date | null>(new Date())
  const [selesaiSewa, setSelesaiSewa] = useState<Date | null>(new Date())
  const [nominal, setNominal] = useState(0)
  const [jumlahHari, setJumlahHari] = useState(1)
  const [jumlahBulan, setJumlahBulan] = useState(1)
  const [jumlahTahun, setJumlahTahun] = useState(1)

  // Aset / Item Aset
  const [asetId, setAsetId] = useState('')
  const [itemAsetId, setItemAsetId] = useState('')
  const [asetList, setAsetList] = useState<AsetOption[]>([])
  const [itemAsetList, setItemAsetList] = useState<ItemAsetOption[]>([])

  // Periode sewa (input di form tagihan)
  const [periodeSewa, setPeriodeSewa] = useState<string>('bulanan')

  const [itemAsetPricing, setItemAsetPricing] = useState({
    hargaHarian: 0,
    hargaBulanan: 0,
    hargaTahunan: 0
  })

  const { snack: snackbar, showSnack: showSnackbar, closeSnack } = useSnackbar()
  const { confirm, confirmProps } = useConfirm()

  useEffect(() => {
    if (penyewaId) fetchTagihan()
    fetchAsets()
  }, [penyewaId])

  useEffect(() => {
    if (asetId) fetchItemAset(asetId)
    else setItemAsetList([])
  }, [asetId])

  useEffect(() => {
    const itemAset = itemAsetList.find(r => r.id === itemAsetId)

    if (itemAset?.hargaItemAset) {
      setItemAsetPricing({
        hargaHarian: Number(itemAset.hargaItemAset.find(h => h.jenisHarga === 'HARIAN')?.harga) || 0,
        hargaBulanan: Number(itemAset.hargaItemAset.find(h => h.jenisHarga === 'BULANAN')?.harga) || 0,
        hargaTahunan: Number(itemAset.hargaItemAset.find(h => h.jenisHarga === 'TAHUNAN')?.harga) || 0
      })
    }
  }, [itemAsetId, itemAsetList])

  // Auto-calculate end date
  useEffect(() => {
    if (!mulaiSewa) return

    if (periodeSewa === 'harian' && jumlahHari) {
      const endDate = new Date(mulaiSewa)

      endDate.setDate(endDate.getDate() + jumlahHari - 1)
      setSelesaiSewa(endDate)
    } else if (periodeSewa === 'bulanan' && jumlahBulan) {
      const endDate = new Date(mulaiSewa)

      endDate.setMonth(endDate.getMonth() + jumlahBulan)
      setSelesaiSewa(endDate)
    } else if (periodeSewa === 'tahunan' && jumlahTahun) {
      const endDate = new Date(mulaiSewa)

      endDate.setFullYear(endDate.getFullYear() + jumlahTahun)
      setSelesaiSewa(endDate)
    }
  }, [mulaiSewa, jumlahHari, jumlahBulan, jumlahTahun, periodeSewa])

  // Auto-calculate nominal based on periode sewa (only when adding, not editing)
  useEffect(() => {
    if (editingId) return
    if (!mulaiSewa || !selesaiSewa) return

    let calculatedNominal = 0

    if (periodeSewa === 'harian' && jumlahHari) {
      calculatedNominal = jumlahHari * itemAsetPricing.hargaHarian
    } else if (periodeSewa === 'bulanan' && jumlahBulan) {
      calculatedNominal = jumlahBulan * itemAsetPricing.hargaBulanan
    } else if (periodeSewa === 'tahunan' && jumlahTahun) {
      calculatedNominal = jumlahTahun * itemAsetPricing.hargaTahunan
    }

    setNominal(calculatedNominal)
  }, [mulaiSewa, selesaiSewa, jumlahBulan, jumlahTahun, periodeSewa, itemAsetPricing, editingId])

  const fetchAsets = async () => {
    try {
      const res = await apiFetchClient<{ data: AsetOption[] }>('/api/aset')

      if (res.data) setAsetList(res.data)
    } catch (error) {
      console.error('Error fetching asets:', error)
    }
  }

  const fetchItemAset = async (id: string) => {
    try {
      const res = await apiFetchClient<{ data: ItemAsetOption[] }>(`/api/aset-item?asetId=${id}&limit=100&aktifOnly=true`)

      if (res.data) setItemAsetList(res.data)
    } catch (error) {
      console.error('Error fetching item aset:', error)
    }
  }

  const fetchTagihan = async () => {
    try {
      setLoading(true)
      const res = await apiFetchClient<{ data: TagihanClient[] }>(`/api/tagihan?penyewaId=${penyewaId}`)

      if (res.data) {
        // Hanya tampilkan yang LUNAS, urutkan selesai sewa terbaru paling atas (desc)
        const lunas = res.data
          .filter(t => t.status === 'LUNAS')
          .sort((a, b) => new Date(b.selesaiSewa).getTime() - new Date(a.selesaiSewa).getTime())

        setTagihan(lunas)
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

  const handleEdit = async (item: TagihanClient) => {
    setEditingId(item.id)
    setKeterangan(item.keterangan || '')
    setStatus(item.status || 'BELUM TERBAYAR')
    setMetodeBayar(item.metodeBayar || '')
    setBuktiPembayaran(item.buktiPembayaran || '')
    setPeriodeSewa(item.periodeSewa || 'bulanan')
    setMulaiSewa(item.mulaiSewa ? new Date(item.mulaiSewa) : new Date())
    setSelesaiSewa(item.selesaiSewa ? new Date(item.selesaiSewa) : new Date())
    setNominal(Number(item.nominal) || 0)
    if (item.asetId) {
      setAsetId(item.asetId)
      await fetchItemAset(item.asetId)
    }
    if (item.ruanganId) setItemAsetId(item.ruanganId)
    setView('form')
  }

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: 'Hapus Tagihan', message: 'Apakah Anda yakin ingin menghapus tagihan ini?' }))) return

    try {
      await apiFetchClient(`/api/tagihan/${id}`, { method: 'DELETE' })
      fetchTagihan()
      showSnackbar('Tagihan berhasil dihapus', 'success')
    } catch (error) {
      console.error('Error deleting tagihan:', error)
      showSnackbar('Gagal menghapus tagihan', 'error')
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

  const handleDownloadBukti = async (item: TagihanClient) => {
    await downloadPdfFromApi(`/api/tagihan/${item.id}/pdf`, `bukti-tagihan-${item.id.slice(-8).toUpperCase()}.pdf`)
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
    setJumlahHari(1)
    setJumlahBulan(1)
    setJumlahTahun(1)
    setAsetId('')
    setItemAsetId('')
  }

  const handleSubmit = async () => {
    if (!mulaiSewa || !selesaiSewa) {
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
      nominal,
      asetId: asetId || null,
      ruanganId: itemAsetId || null
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
    } catch (error: any) {
      console.error('Error saving tagihan:', error)
      showSnackbar(error?.message || 'Gagal menyimpan tagihan', 'error')
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
                    <TableCell>Nama Aset</TableCell>
                    <TableCell>Nama Item Aset</TableCell>
                    <TableCell>Periode Sewa</TableCell>
                    <TableCell>Mulai Sewa</TableCell>
                    <TableCell>Selesai Sewa</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tagihan.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align='center'>
                        Belum ada data tagihan
                      </TableCell>
                    </TableRow>
                  ) : (
                    tagihan.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{(item as any).aset?.nama || '-'}</TableCell>
                        <TableCell>{(item as any).ruangan?.nama || '-'}</TableCell>
                        <TableCell>{item.periodeSewa ? item.periodeSewa.charAt(0).toUpperCase() + item.periodeSewa.slice(1) : '-'}</TableCell>
                        <TableCell>{new Date(item.mulaiSewa).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{new Date(item.selesaiSewa).toLocaleDateString('id-ID')}</TableCell>
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
                          <IconButton size='small' onClick={e => setMenuAnchor({ el: e.currentTarget, item })}>
                            <i className='tabler-dots-vertical' />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Menu
              anchorEl={menuAnchor?.el}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => { handleEdit(menuAnchor!.item); setMenuAnchor(null) }}>
                <i className='tabler-edit mr-2' /> Ubah
              </MenuItem>
              <MenuItem onClick={() => { handleSendEmail(menuAnchor!.item.id); setMenuAnchor(null) }}>
                <i className='tabler-mail mr-2' /> Kirim Email
              </MenuItem>
              <MenuItem onClick={() => { handleDownloadBukti(menuAnchor!.item); setMenuAnchor(null) }}>
                <i className='tabler-download mr-2' /> Download Bukti
              </MenuItem>
              <MenuItem sx={{ color: 'error.main' }} onClick={() => { handleDelete(menuAnchor!.item.id); setMenuAnchor(null) }}>
                <i className='tabler-trash mr-2' /> Hapus
              </MenuItem>
            </Menu>
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
        <ConfirmDialog {...confirmProps} />
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

        {/* Nama Aset */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField select fullWidth label='Nama Aset' value={asetId}
            onChange={e => { setAsetId(e.target.value); setItemAsetId('') }}>
            {asetList.map(a => <MenuItem key={a.id} value={a.id}>{a.nama}</MenuItem>)}
          </CustomTextField>
        </Grid>

        {/* Nama Item Aset */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField select fullWidth label='Nama Item Aset' value={itemAsetId}
            onChange={e => setItemAsetId(e.target.value)} disabled={!asetId}>
            {itemAsetList.map(r => <MenuItem key={r.id} value={r.id}>{r.nama}</MenuItem>)}
          </CustomTextField>
        </Grid>

        {/* Periode Sewa */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField
            select
            fullWidth
            label='Periode Sewa'
            value={periodeSewa}
            onChange={e => { setPeriodeSewa(e.target.value); setJumlahHari(1); setJumlahBulan(1); setJumlahTahun(1) }}
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
              <CustomTextField
                fullWidth
                type='number'
                label='Jumlah Hari'
                value={jumlahHari}
                onChange={e => setJumlahHari(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AppReactDatepicker
                selected={mulaiSewa}
                onChange={(date: Date | null) => setMulaiSewa(date)}
                placeholderText='DD-MM-YYYY'
                dateFormat='dd-MM-yyyy'
                customInput={<CustomTextField fullWidth label='Tanggal Mulai' />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Tanggal Selesai (Otomatis)'
                value={selesaiSewa ? selesaiSewa.toLocaleDateString('id-ID') : ''}
                disabled
              />
            </Grid>
          </>
        )}

        {periodeSewa === 'bulanan' && (
          <>
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
                label='Tanggal Selesai (Otomatis)'
                value={selesaiSewa ? selesaiSewa.toLocaleDateString('id-ID') : ''}
                disabled
              />
            </Grid>
          </>
        )}

        <Grid size={{ xs: 12, sm: 6 }}>
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField
            fullWidth
            label='Keterangan'
            placeholder='Contoh: Tagihan Januari 2026'
            value={keterangan}
            onChange={e => setKeterangan(e.target.value)}
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
