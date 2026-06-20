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

// Type Imports
import type { TagihanClient } from '@/src/types/apps/tagihanTypes'

type AsetOption = { id: string; nama: string; jenis: string }
type RuanganOption = { id: string; nama: string; status: string; hargaItemAset?: { jenisHarga: string; harga: number }[] }

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

  // Aset / Ruangan
  const [asetId, setAsetId] = useState('')
  const [ruanganId, setRuanganId] = useState('')
  const [asetList, setAsetList] = useState<AsetOption[]>([])
  const [ruanganList, setRuanganList] = useState<RuanganOption[]>([])

  // Periode sewa (input di form tagihan)
  const [periodeSewa, setPeriodeSewa] = useState<string>('bulanan')

  const [ruanganPricing, setRuanganPricing] = useState({
    hargaHarian: 0,
    hargaBulanan: 0,
    hargaTahunan: 0
  })

  const { snack: snackbar, showSnack: showSnackbar, closeSnack } = useSnackbar()

  useEffect(() => {
    if (penyewaId) fetchTagihan()
    fetchAsets()
  }, [penyewaId])

  useEffect(() => {
    if (asetId) fetchRuangan(asetId)
    else setRuanganList([])
  }, [asetId])

  useEffect(() => {
    const ruangan = ruanganList.find(r => r.id === ruanganId)

    if (ruangan?.hargaItemAset) {
      setRuanganPricing({
        hargaHarian: Number(ruangan.hargaItemAset.find(h => h.jenisHarga === 'HARIAN')?.harga) || 0,
        hargaBulanan: Number(ruangan.hargaItemAset.find(h => h.jenisHarga === 'BULANAN')?.harga) || 0,
        hargaTahunan: Number(ruangan.hargaItemAset.find(h => h.jenisHarga === 'TAHUNAN')?.harga) || 0
      })
    }
  }, [ruanganId, ruanganList])

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
      calculatedNominal = jumlahHari * ruanganPricing.hargaHarian
    } else if (periodeSewa === 'bulanan' && jumlahBulan) {
      calculatedNominal = jumlahBulan * ruanganPricing.hargaBulanan
    } else if (periodeSewa === 'tahunan' && jumlahTahun) {
      calculatedNominal = jumlahTahun * ruanganPricing.hargaTahunan
    }

    setNominal(calculatedNominal)
  }, [mulaiSewa, selesaiSewa, jumlahBulan, jumlahTahun, periodeSewa, ruanganPricing, editingId])

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
      const res = await apiFetchClient<{ data: RuanganOption[] }>(`/api/aset-item?asetId=${id}&limit=100&aktifOnly=true`)

      if (res.data) setRuanganList(res.data)
    } catch (error) {
      console.error('Error fetching ruangan:', error)
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
      await fetchRuangan(item.asetId)
    }
    if (item.ruanganId) setRuanganId(item.ruanganId)
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

  const handleDownloadBukti = async (item: TagihanClient) => {
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const primaryColor: [number, number, number] = [99, 89, 233]
    const successColor: [number, number, number] = [40, 167, 69]
    const grayText: [number, number, number] = [108, 117, 125]
    const lightGray: [number, number, number] = [245, 245, 248]
    const darkText: [number, number, number] = [33, 37, 41]
    const borderColor: [number, number, number] = [220, 220, 228]

    const pageW = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentW = pageW - margin * 2

    const formatRp = (val: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

    const mulai = new Date(item.mulaiSewa).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    const selesai = new Date(item.selesaiSewa).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    const periodeSewa = item.periodeSewa
      ? item.periodeSewa.charAt(0).toUpperCase() + item.periodeSewa.slice(1)
      : 'Harian'

    // Header card
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, 15, contentW, 30, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...darkText)
    doc.text('Bantu Sewa', margin + 5, 27)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...grayText)
    doc.text('Platform Manajemen Sewa', margin + 5, 34)

    // Right: Lunas badge centered in header card
    const rightX = pageW - margin - 5
    doc.setFillColor(...successColor)
    doc.roundedRect(rightX - 22, 27, 22, 7, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('Lunas', rightX - 11, 32, { align: 'center' })

    // Info Transaksi
    let y = 56
    const labelX = margin
    const valueX = margin + 42
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.text('ID Pemesanan', labelX, y)
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.text(item.id.slice(-10).toUpperCase(), valueX, y)

    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayText)
    doc.text('Tanggal Pembayaran', labelX, y)
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.text(mulai, valueX, y)

    y += 10
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageW - margin, y)
    y += 8

    // PEMESAN section
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...grayText)
    doc.text('PEMESAN', margin, y)

    y += 7
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...darkText)
    doc.text(item.penyewa?.nama || '-', margin, y)

    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    if (item.penyewa?.nomorTelepon) { doc.text(item.penyewa.nomorTelepon, margin, y); y += 6 }
    if (item.penyewa?.email) { doc.text(item.penyewa.email, margin, y); y += 6 }

    // Divider
    y += 3
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.4)
    doc.line(margin, y, pageW - margin, y)
    y += 6

    // Tabel ITEM | JUMLAH
    const namaRuangan = (item as any).ruangan?.nama || item.keterangan || '-'
    const itemContent = `${namaRuangan}\n${periodeSewa}\n${mulai} - ${selesai}`

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['ITEM', 'JUMLAH']],
      body: [[
        { content: itemContent, styles: { fontSize: 10, textColor: darkText } },
        { content: formatRp(Number(item.nominal)), styles: { halign: 'right', fontSize: 10, textColor: primaryColor, fontStyle: 'bold' } }
      ]],
      headStyles: { fillColor: lightGray, textColor: grayText, fontSize: 8, fontStyle: 'bold', lineColor: borderColor, lineWidth: 0.3 },
      bodyStyles: { fontSize: 10, textColor: darkText, minCellHeight: 16 },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 45, halign: 'right' } },
      theme: 'plain',
      tableLineColor: borderColor,
      tableLineWidth: 0.3
    })

    // Total
    y = (doc as any).lastAutoTable.finalY + 6
    const totalLabelX = pageW - margin - 60
    const totalValX = pageW - margin
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.4)
    doc.line(totalLabelX, y, totalValX, y)
    y += 7
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...darkText)
    doc.text('Total', totalLabelX, y)
    doc.setTextColor(...primaryColor)
    doc.setFontSize(13)
    doc.text(formatRp(Number(item.nominal)), totalValX, y, { align: 'right' })

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 4, pageW - margin, footerY - 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...grayText)
    const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    doc.text(`Dicetak: ${printDate}`, margin, footerY)
    doc.text('Bantu Sewa — Platform Manajemen Sewa', pageW - margin, footerY, { align: 'right' })

    doc.save('Bukti Bayar Tagihan.pdf')
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
    setRuanganId('')
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
      ruanganId: ruanganId || null
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
            onChange={e => { setAsetId(e.target.value); setRuanganId('') }}>
            {asetList.map(a => <MenuItem key={a.id} value={a.id}>{a.nama}</MenuItem>)}
          </CustomTextField>
        </Grid>

        {/* Nama Item Aset */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField select fullWidth label='Nama Item Aset' value={ruanganId}
            onChange={e => setRuanganId(e.target.value)} disabled={!asetId}>
            {ruanganList.map(r => <MenuItem key={r.id} value={r.id}>{r.nama}</MenuItem>)}
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
