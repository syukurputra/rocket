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
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import DirectionalIcon from '@components/DirectionalIcon'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import { BIAYA_LAYANAN_PARAM_IDS, hitungBiayaLayanan, type TarifBiayaLayanan } from '@/src/libs/biayaLayanan'
import { isPromoBerlaku } from '@/src/libs/hargaPromo'

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
  promoAktif: boolean
  hargaPromo: number
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
  const [tarifLayanan, setTarifLayanan] = useState<TarifBiayaLayanan>({})

  // Form state
  const [selectedItemAsetId, setSelectedItemAsetId] = useState('')
  const [jenisHarga, setJenisHarga] = useState('HARIAN')
  const [harga, setHarga] = useState('')
  const [promoAktif, setPromoAktif] = useState(false)
  const [hargaPromo, setHargaPromo] = useState('')

  const hargaNum = Number(parseNumber(harga)) || 0
  const hargaPromoNum = Number(parseNumber(hargaPromo)) || 0

  // Saat promo aktif, harga promo yang ditagihkan — jadi biaya layanan dan harga
  // merchant ikut dihitung dari nilai itu.
  const hargaBerlaku = promoAktif && hargaPromoNum > 0 ? hargaPromoNum : hargaNum

  // Biaya layanan mengikuti jenjang harga di Master Parameter, jadi ikut berubah
  // begitu harga diketik
  const biayaLayanan = hitungBiayaLayanan(hargaBerlaku, tarifLayanan)
  const nilaiMerchant = Math.max(0, hargaBerlaku - biayaLayanan)

  useEffect(() => {
    if (asetId) {
      fetchItemAsets()
      fetchHarga()
    }

    apiFetchClient<{ data: Record<string, string> }>(`/api/parameter?ids=${BIAYA_LAYANAN_PARAM_IDS.join(',')}`)
      .then(res => setTarifLayanan(res.data || {}))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asetId])

  const fetchItemAsets = async () => {
    try {
      const res = await apiFetchClient<{ data: ItemAsetData[] }>(`/api/aset-item?asetId=${asetId}`)

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
    setSelectedItemAsetId('')
    setJenisHarga('HARIAN')
    setHarga('')
    setPromoAktif(false)
    setHargaPromo('')
    setEditingId(null)
  }

  const handleAdd = () => { resetForm(); setView('form') }

  const handleEdit = (item: HargaData) => {
    setEditingId(item.id)
    setSelectedItemAsetId(item.ruanganId)
    setJenisHarga(item.jenisHarga)
    setHarga(formatNumber(String(Math.floor(Number(item.harga)))))
    setPromoAktif(item.promoAktif ?? false)
    setHargaPromo(Number(item.hargaPromo) > 0 ? formatNumber(String(Math.floor(Number(item.hargaPromo)))) : '')
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
    if (!selectedItemAsetId || !jenisHarga || !harga) {
      onShowMessage?.('Semua field harus diisi.', 'error')

      return
    }

    if (promoAktif && hargaPromoNum <= 0) {
      onShowMessage?.('Harga promo harus diisi saat promo aktif.', 'error')

      return
    }

    try {
      const payload = {
        ruanganId: selectedItemAsetId,
        jenisHarga,
        harga: Number(parseNumber(harga)),
        promoAktif,
        hargaPromo: hargaPromoNum
      }

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
                      <TableCell>
                        {isPromoBerlaku(item) ? (
                          <div className='flex items-center gap-2 flex-wrap'>
                            <Typography variant='body2' color='text.disabled' sx={{ textDecoration: 'line-through' }}>
                              {formatRupiah(item.harga)}
                            </Typography>
                            <Typography variant='body2' fontWeight={600}>
                              {formatRupiah(item.hargaPromo)}
                            </Typography>
                            <Chip label='Promo' color='error' size='small' variant='tonal' />
                          </div>
                        ) : (
                          formatRupiah(item.harga)
                        )}
                      </TableCell>
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
        <Typography variant='h5'>{editingId ? 'Ubah Harga Item Aset' : 'Tambah Harga Item Aset'}</Typography>
        <Typography>Silakan lengkapi detail harga item aset.</Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          select
          fullWidth
          label='Pilih Item Aset'
          value={selectedItemAsetId}
          onChange={e => setSelectedItemAsetId(e.target.value)}
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

      <Grid size={{ xs: 12, md: 6 }}>
        <div className='flex flex-col'>
          <FormControlLabel
            control={<Switch checked={promoAktif} onChange={e => setPromoAktif(e.target.checked)} size='small' />}
            label={<Typography variant='body2'>Promo — {promoAktif ? 'Aktif' : 'Non Aktif'}</Typography>}
          />
          <Typography variant='caption' color='text.secondary'>
            Kalau aktif, harga promo yang tampil di publish dan yang ditagihkan saat booking.
          </Typography>
        </div>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          fullWidth
          label='Harga Promo'
          placeholder='0'
          value={hargaPromo}
          onChange={e => setHargaPromo(formatNumber(e.target.value))}
          disabled={!promoAktif}
          inputProps={{ inputMode: 'numeric' }}
          error={promoAktif && hargaPromoNum > 0 && hargaPromoNum >= hargaNum}
          helperText={
            promoAktif && hargaPromoNum > 0 && hargaPromoNum >= hargaNum
              ? 'Harga promo sebaiknya lebih rendah dari harga normal'
              : ' '
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          fullWidth
          label='Biaya Layanan'
          value={biayaLayanan > 0 ? formatNumber(String(biayaLayanan)) : '0'}
          disabled
          InputProps={{ readOnly: true }}
          helperText={hargaBerlaku > 0 ? 'Biaya layanan setiap 1 booking transaksi' : ' '}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          fullWidth
          label='Harga Merchant'
          value={hargaBerlaku > 0 ? formatNumber(String(nilaiMerchant)) : '0'}
          disabled
          InputProps={{ readOnly: true }}
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
            disabled={!selectedItemAsetId || !harga}
          >
            Submit
          </Button>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepHargaItemAset
