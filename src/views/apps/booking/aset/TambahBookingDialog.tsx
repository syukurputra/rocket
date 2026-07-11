'use client'

import { useState, useEffect } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import CustomTextField from '@core/components/mui/TextField'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type AsetItem = { id: string; nama: string; jenis?: string }
type ItemAsetItem = { id: string; nama: string; asetId: string; hargaItemAset: { id: string; jenisHarga: string; harga: number }[] }
type PenyewaItem = { id: string; nama: string; nomorTelepon?: string; email?: string }

const JENIS_LABEL: Record<string, string> = {
  JAM: 'Jam',
  HARIAN: 'Hari',
  BULANAN: 'Bulan',
  TAHUNAN: 'Tahun'
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const addDuration = (date: Date, durasi: number, jenis: string): Date => {
  const d = new Date(date)

  if (jenis === 'JAM') d.setHours(d.getHours() + durasi)
  else if (jenis === 'HARIAN') d.setDate(d.getDate() + durasi)
  else if (jenis === 'BULANAN') d.setMonth(d.getMonth() + durasi)
  else if (jenis === 'TAHUNAN') d.setFullYear(d.getFullYear() + durasi)

  return d
}

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const TambahBookingDialog = ({ open, onClose, onSuccess }: Props) => {
  const [penyewaMode, setPenyewaMode] = useState<'pilih' | 'baru'>('pilih')
  const [penyewaId, setPenyewaId] = useState('')
  const [namaPemesan, setNamaPemesan] = useState('')
  const [telepon, setTelepon] = useState('')
  const [email, setEmail] = useState('')

  const [asetId, setAsetId] = useState('')
  const [itemAsetId, setItemAsetId] = useState('')
  const [jenisHarga, setJenisHarga] = useState('')
  const [mulaiSewa, setMulaiSewa] = useState('')
  const [durasi, setDurasi] = useState(1)
  const [catatan, setCatatan] = useState('')
  const [statusBooking, setStatusBooking] = useState<'BELUM TERBAYAR' | 'LUNAS'>('BELUM TERBAYAR')

  const [asetList, setAsetList] = useState<AsetItem[]>([])
  const [itemAsetList, setItemAsetList] = useState<ItemAsetItem[]>([])
  const [penyewaList, setPenyewaList] = useState<PenyewaItem[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [nomorBooking, setNomorBooking] = useState('')

  const selectedItemAset = itemAsetList.find(r => r.id === itemAsetId)
  const selectedHarga = selectedItemAset?.hargaItemAset.find(h => h.jenisHarga === jenisHarga)
  const hargaSatuan = selectedHarga?.harga || 0
  const total = hargaSatuan * durasi
  const selesaiSewa = mulaiSewa && jenisHarga ? addDuration(new Date(mulaiSewa), durasi, jenisHarga) : null

  useEffect(() => {
    if (!open) return
    apiFetchClient<{ data: AsetItem[] }>('/api/aset/dp', undefined, { redirectOn401: '/login' })
      .then(res => setAsetList(res.data || []))
      .catch(() => {})
    apiFetchClient<{ data: PenyewaItem[] }>('/api/penyewa/dp', undefined, { redirectOn401: '/login' })
      .then(res => setPenyewaList(res.data || []))
      .catch(() => {})
  }, [open])

  useEffect(() => {
    if (!asetId) { setItemAsetList([]); setItemAsetId(''); setJenisHarga(''); return }
    apiFetchClient<{ data: ItemAsetItem[] }>(`/api/aset-item/dp?asetId=${asetId}`, undefined, { redirectOn401: '/login' })
      .then(res => { setItemAsetList(res.data || []); setItemAsetId(''); setJenisHarga('') })
      .catch(() => {})
  }, [asetId])

  useEffect(() => {
    if (selectedItemAset?.hargaItemAset.length) {
      setJenisHarga(selectedItemAset.hargaItemAset[0].jenisHarga)
    } else {
      setJenisHarga('')
    }
  }, [itemAsetId])

  const handleReset = () => {
    setPenyewaMode('pilih')
    setPenyewaId('')
    setNamaPemesan('')
    setTelepon('')
    setEmail('')
    setAsetId('')
    setItemAsetId('')
    setJenisHarga('')
    setMulaiSewa('')
    setDurasi(1)
    setCatatan('')
    setStatusBooking('BELUM TERBAYAR')
    setError('')
    setSuccess(false)
    setNomorBooking('')
  }

  const handleClose = () => {
    if (loading) return
    handleReset()
    onClose()
  }

  const handleSubmit = async () => {
    setError('')

    if (!itemAsetId) { setError('Pilih item aset terlebih dahulu'); return }
    if (!jenisHarga) { setError('Pilih jenis harga'); return }
    if (!mulaiSewa) { setError('Masukkan tanggal mulai sewa'); return }
    if (penyewaMode === 'pilih' && !penyewaId) { setError('Pilih penyewa'); return }
    if (penyewaMode === 'baru' && (!namaPemesan || !telepon)) { setError('Nama pemesan dan telepon wajib diisi'); return }

    setLoading(true)
    try {
      const payload: any = {
        ruanganId: itemAsetId,
        jenisHarga,
        mulaiSewa,
        selesaiSewa: selesaiSewa?.toISOString(),
        durasi,
        hargaSatuan,
        total,
        catatan,
        status: statusBooking
      }

      if (penyewaMode === 'pilih') {
        payload.penyewaId = penyewaId
      } else {
        payload.namaPemesan = namaPemesan
        payload.telepon = telepon
        payload.email = email
      }

      const res = await apiFetchClient<{ data: { nomorBooking: string } }>(
        '/api/booking/dashboard',
        { method: 'POST', body: JSON.stringify(payload) },
        { redirectOn401: '/login' }
      )

      setNomorBooking(res.data?.nomorBooking || '')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Gagal membuat booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center bg-primary rounded p-2'>
              <i className='tabler-calendar-plus text-white text-xl' />
            </div>
            <div>
              <Typography variant='h5'>Tambah Booking</Typography>
              <Typography variant='caption' color='text.secondary'>Buat booking baru untuk aset perusahaan</Typography>
            </div>
          </div>
          <IconButton onClick={handleClose} disabled={loading}>
            <i className='tabler-x' />
          </IconButton>
        </div>
      </DialogTitle>

      <Divider sx={{ mt: 3 }} />

      <DialogContent sx={{ pt: 4 }}>
        {success ? (
          <div className='flex flex-col items-center gap-4 py-8'>
            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-success/10'>
              <i className='tabler-circle-check text-success text-5xl' />
            </div>
            <Typography variant='h5' color='success.main'>Booking Berhasil Dibuat!</Typography>
            <Chip label={`Nomor Booking: ${nomorBooking}`} color='primary' variant='tonal' />
            <Chip
              label={statusBooking === 'LUNAS' ? 'Status: Lunas' : 'Status: Belum Terbayar'}
              color={statusBooking === 'LUNAS' ? 'success' : 'warning'}
              variant='tonal'
            />
          </div>
        ) : (
          <Grid container spacing={5}>
            {/* Penyewa */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='h6' className='mbe-3'>
                <i className='tabler-user mie-2' />
                Penyewa
              </Typography>
              <ToggleButtonGroup
                value={penyewaMode}
                exclusive
                onChange={(_, v) => { if (v) { setPenyewaMode(v); setPenyewaId(''); setNamaPemesan(''); setTelepon(''); setEmail('') } }}
                size='small'
                sx={{ mb: 3 }}
              >
                <ToggleButton value='pilih'>Pilih Penyewa</ToggleButton>
                <ToggleButton value='baru'>Penyewa Baru</ToggleButton>
              </ToggleButtonGroup>

              {penyewaMode === 'pilih' ? (
                <CustomTextField
                  select
                  fullWidth
                  label='Pilih Penyewa *'
                  value={penyewaId}
                  onChange={e => setPenyewaId(e.target.value)}
                >
                  <MenuItem value=''>-- Pilih Penyewa --</MenuItem>
                  {penyewaList.map(p => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nama} {p.nomorTelepon ? `— ${p.nomorTelepon}` : ''}
                    </MenuItem>
                  ))}
                </CustomTextField>
              ) : (
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField fullWidth label='Nama Lengkap *' value={namaPemesan} onChange={e => setNamaPemesan(e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField fullWidth label='No. Telepon *' value={telepon} onChange={e => setTelepon(e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField fullWidth label='Email' type='email' value={email} onChange={e => setEmail(e.target.value)} />
                  </Grid>
                </Grid>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Aset & Item Aset */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='h6' className='mbe-3'>
                <i className='tabler-building mie-2' />
                Aset
              </Typography>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Pilih Aset *'
                    value={asetId}
                    onChange={e => setAsetId(e.target.value)}
                  >
                    <MenuItem value=''>-- Pilih Aset --</MenuItem>
                    {asetList.map(a => (
                      <MenuItem key={a.id} value={a.id}>{a.nama}</MenuItem>
                    ))}
                  </CustomTextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Pilih Item Aset *'
                    value={itemAsetId}
                    onChange={e => setItemAsetId(e.target.value)}
                    disabled={!asetId || itemAsetList.length === 0}
                  >
                    <MenuItem value=''>-- Pilih Item Aset --</MenuItem>
                    {itemAsetList.map(r => (
                      <MenuItem key={r.id} value={r.id}>{r.nama}</MenuItem>
                    ))}
                  </CustomTextField>
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Detail Sewa */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='h6' className='mbe-3'>
                <i className='tabler-calendar mie-2' />
                Detail Sewa
              </Typography>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Jenis Harga *'
                    value={jenisHarga}
                    onChange={e => { setJenisHarga(e.target.value); setDurasi(1) }}
                    disabled={!itemAsetId || !selectedItemAset?.hargaItemAset.length}
                  >
                    <MenuItem value=''>-- Pilih Jenis Harga --</MenuItem>
                    {selectedItemAset?.hargaItemAset.map(h => (
                      <MenuItem key={h.id} value={h.jenisHarga}>
                        {JENIS_LABEL[h.jenisHarga] || h.jenisHarga} — {formatCurrency(h.harga)}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Tanggal Mulai *'
                    type={jenisHarga === 'JAM' ? 'datetime-local' : 'date'}
                    value={mulaiSewa}
                    onChange={e => setMulaiSewa(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={!jenisHarga}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CustomTextField
                    fullWidth
                    label={`Durasi (${jenisHarga ? JENIS_LABEL[jenisHarga] || jenisHarga : 'Hari'})`}
                    type='number'
                    value={durasi}
                    onChange={e => setDurasi(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1 }}
                    disabled={!jenisHarga}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CustomTextField
                    fullWidth
                    label='Selesai Sewa'
                    value={selesaiSewa ? (jenisHarga === 'JAM'
                      ? selesaiSewa.toISOString().slice(0, 16).replace('T', ' ')
                      : selesaiSewa.toLocaleDateString('id-ID')) : '-'}
                    InputLabelProps={{ shrink: true }}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CustomTextField
                    fullWidth
                    label='Total'
                    value={total > 0 ? formatCurrency(total) : '-'}
                    InputLabelProps={{ shrink: true }}
                    disabled
                    inputProps={{ style: { fontWeight: 700, color: '#6359e9' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <CustomTextField
                    fullWidth
                    multiline
                    rows={2}
                    label='Catatan'
                    placeholder='Catatan tambahan (opsional)'
                    value={catatan}
                    onChange={e => setCatatan(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Status */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='h6' className='mbe-3'>
                <i className='tabler-credit-card mie-2' />
                Status Pembayaran
              </Typography>
              <CustomTextField
                select
                fullWidth
                label='Status *'
                value={statusBooking}
                onChange={e => setStatusBooking(e.target.value as any)}
              >
                <MenuItem value='BELUM TERBAYAR'>Belum Terbayar</MenuItem>
                <MenuItem value='LUNAS'>Lunas</MenuItem>
              </CustomTextField>
            </Grid>

            {error && (
              <Grid size={{ xs: 12 }}>
                <Alert severity='error'>{error}</Alert>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 6, pb: 4 }}>
        {success ? (
          <>
            <Button variant='outlined' color='secondary' onClick={handleReset}>
              Tambah Lagi
            </Button>
            <Button variant='contained' onClick={() => { handleReset(); onSuccess(); onClose() }}>
              Selesai
            </Button>
          </>
        ) : (
          <>
            <Button variant='outlined' color='secondary' onClick={handleClose} disabled={loading}>
              Batal
            </Button>
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-check' />}
            >
              {loading ? 'Menyimpan...' : 'Simpan Booking'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default TambahBookingDialog
