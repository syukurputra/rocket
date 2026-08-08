'use client'

import { useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'

import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import { downloadPdfFromApi } from '@/src/utils/downloadPdf'

type TagihanBooking = {
  id: string
  nomorTagihan?: string | null
  keterangan: string
  nominal: number
  status: string
  periodeSewa?: string | null
  mulaiSewa: string
  selesaiSewa: string
  metodeBayar?: string | null
  alasanBatal?: string | null
  buktiPembayaran?: string | null
  ipaymuSessionId?: string | null
  aset?: { id: string; nama: string; alamatPemesanAktif?: boolean } | null
  itemAset?: { id: string; nama: string } | null
  penyewa?: { id: string; nama: string; nomorTelepon?: string; email?: string }

  /** Alamat dari profil user penyewa, hanya diisi kalau aset mewajibkannya */
  alamatPemesan?: string | null
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

const BookingDetailView = ({ bookingId }: { bookingId: string }) => {
  const router = useRouter()

  const [tagihan, setTagihan] = useState<TagihanBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [checking, setChecking] = useState(false)

  // Ulasan
  const [reviewOpen, setReviewOpen] = useState(false)
  const [existingReview, setExistingReview] = useState<{ rating: number; komentar: string | null } | null>(null)
  const [rating, setRating] = useState(5)
  const [komentar, setKomentar] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const { snack, showSnack, closeSnack } = useSnackbar()

  const isLunas = tagihan?.status === 'LUNAS'
  const isCancelled = tagihan?.status === 'DIBATALKAN'

  // Booking pada item yang butuh persetujuan pemilik: belum boleh dibayar
  const isMenungguKonfirmasi = tagihan?.status === 'MENUNGGU KONFIRMASI'

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetchClient<{ data: TagihanBooking }>(`/api/booking/${bookingId}`, undefined, {
        redirectOn401: '/login'
      })

      setTagihan(res.data)
    } catch (err: any) {
      console.error('Fetch booking detail error:', err)
      setLoadError(err?.message || 'Gagal memuat detail booking')
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  // Cek ulasan yang sudah ada
  useEffect(() => {
    if (!tagihan?.id || !isLunas) {
      setExistingReview(null)

      return
    }

    apiFetchClient<{ data: { rating: number; komentar: string | null } | null }>(
      `/api/ulasan?tagihanId=${tagihan.id}`,
      undefined,
      { redirectOn401: false }
    )
      .then(res => {
        if (res.data) {
          setExistingReview(res.data)
          setRating(res.data.rating)
          setKomentar(res.data.komentar || '')
        } else {
          setExistingReview(null)
          setRating(5)
          setKomentar('')
        }
      })
      .catch(() => setExistingReview(null))
  }, [tagihan?.id, isLunas])

  const handleSubmitReview = async () => {
    if (!tagihan?.id) return

    setSubmittingReview(true)

    try {
      await apiFetchClient(`/api/ulasan`, {
        method: 'POST',
        body: JSON.stringify({ tagihanId: tagihan.id, rating, komentar })
      })
      setExistingReview({ rating, komentar })
      setReviewOpen(false)
      showSnack('Terima kasih atas ulasan Anda', 'success')
    } catch (err: any) {
      showSnack(err?.message || 'Gagal mengirim ulasan', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleBayar = async () => {
    try {
      setPaying(true)

      const result = await apiFetchClient<{ data: { paymentUrl: string } }>(
        '/api/tagihan/payment',
        { method: 'POST', body: JSON.stringify({ tagihanId: tagihan?.id }) },
        { redirectOn401: '/login' }
      )

      if (result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl
      } else {
        throw new Error('Payment URL tidak ditemukan')
      }
    } catch (err) {
      showSnack(err instanceof Error ? err.message : 'Gagal membuat link pembayaran', 'error')
      setPaying(false)
    }
  }

  const handleCheckTransaction = async () => {
    try {
      setChecking(true)

      const result = await apiFetchClient<{ data: { status: string }; message: string }>(
        `/api/tagihan/${tagihan?.id}/check`,
        { method: 'POST' },
        { redirectOn401: '/login' }
      )

      if (result.data?.status === 'LUNAS') {
        showSnack(result.message || 'Pembayaran berhasil!', 'success')
        fetchBooking()
      } else {
        showSnack(result.message || 'Transaksi belum selesai', 'warning')
      }
    } catch (err) {
      showSnack(err instanceof Error ? err.message : 'Gagal mengecek transaksi', 'error')
    } finally {
      setChecking(false)
    }
  }

  const handleBatal = async () => {
    try {
      setCancelling(true)

      await apiFetchClient(
        `/api/tagihan/${tagihan?.id}`,
        { method: 'PUT', body: JSON.stringify({ status: 'DIBATALKAN' }) },
        { redirectOn401: '/login' }
      )

      showSnack('Booking berhasil dibatalkan', 'success')
      setConfirmCancel(false)
      fetchBooking()
    } catch (err) {
      showSnack(err instanceof Error ? err.message : 'Gagal membatalkan booking', 'error')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='60vh'>
        <CircularProgress />
      </Box>
    )
  }

  if (loadError || !tagihan) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>{loadError || 'Booking tidak ditemukan.'}</Alert>
          <Button className='mt-4' variant='tonal' color='secondary' onClick={() => router.push('/booking/saya')}>
            Kembali
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Header halaman */}
      <div className='flex items-center gap-3 mbe-6'>
        <div className='flex flex-col items-center justify-center bg-primary rounded p-2'>
          <i className='tabler-receipt text-white text-xl' />
        </div>
        <Typography variant='h4'>Detail Booking</Typography>
      </div>

      <Grid container spacing={6}>
        {/* Kiri: Detail */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box className='p-4 rounded mb-4' sx={{ bgcolor: 'action.hover' }}>
                <div className='flex justify-between items-start gap-4 flex-wrap'>
                  <div>
                    <Typography variant='h6' fontWeight={700} color='primary'>Bantu Sewa</Typography>
                    <Typography variant='body2' color='text.secondary'>Platform Manajemen Sewa</Typography>
                  </div>
                  <div className='flex flex-col items-end gap-1'>
                    <div className='flex items-center gap-2'>
                      <Typography variant='body2' fontWeight={600}>Tagihan Booking</Typography>
                      <Chip
                        label={isLunas ? 'Lunas' : isCancelled ? 'Dibatalkan' : 'Belum Terbayar'}
                        color={isLunas ? 'success' : isCancelled ? 'error' : 'warning'}
                        size='small'
                        variant='tonal'
                      />
                    </div>
                    <Typography variant='caption' color='text.secondary'>
                      {formatDate(tagihan.mulaiSewa)} s/d {formatDate(tagihan.selesaiSewa)}
                    </Typography>
                  </div>
                </div>
              </Box>

              {/* Informasi Booking */}
              <div className='flex flex-col gap-2 mb-4 px-4'>
                <div className='flex justify-between gap-4'>
                  <Typography variant='body2' color='text.secondary'>ID Transaksi</Typography>
                  <Typography variant='body2' fontWeight={500}>{tagihan.id}</Typography>
                </div>
                <div className='flex justify-between gap-4'>
                  <Typography variant='body2' color='text.secondary'>ID Tagihan</Typography>
                  <Typography variant='body2' fontWeight={500}>{tagihan.nomorTagihan || '-'}</Typography>
                </div>
                <div className='flex justify-between gap-4'>
                  <Typography variant='body2' color='text.secondary'>Nama</Typography>
                  <Typography variant='body2' fontWeight={500}>{tagihan.penyewa?.nama || '-'}</Typography>
                </div>
                <div className='flex justify-between gap-4'>
                  <Typography variant='body2' color='text.secondary'>Email</Typography>
                  <Typography variant='body2' fontWeight={500}>{tagihan.penyewa?.email || '-'}</Typography>
                </div>
                <div className='flex justify-between gap-4'>
                  <Typography variant='body2' color='text.secondary'>Nomor Telepon</Typography>
                  <Typography variant='body2' fontWeight={500}>{tagihan.penyewa?.nomorTelepon || '-'}</Typography>
                </div>
                {tagihan.aset?.alamatPemesanAktif && (
                  <div className='flex justify-between gap-4'>
                    <Typography variant='body2' color='text.secondary' className='shrink-0'>Alamat</Typography>
                    <Typography variant='body2' fontWeight={500} className='text-right'>
                      {tagihan.alamatPemesan || '-'}
                    </Typography>
                  </div>
                )}
                <div className='flex justify-between gap-4'>
                  <Typography variant='body2' color='text.secondary'>Periode Booking</Typography>
                  <Typography variant='body2' fontWeight={500}>
                    {formatDate(tagihan.mulaiSewa)} - {formatDate(tagihan.selesaiSewa)}
                  </Typography>
                </div>
              </div>

              <Divider sx={{ my: 3 }} />

              {/* Item */}
              <div className='border rounded overflow-hidden mb-4'>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                        <Typography variant='caption' fontWeight={600}>ITEM</Typography>
                      </th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <Typography variant='caption' fontWeight={600}>JUMLAH</Typography>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px 16px' }}>
                        <Typography fontWeight={500}>{tagihan.keterangan}</Typography>
                        {tagihan.periodeSewa && (
                          <Chip
                            label={tagihan.periodeSewa}
                            size='small'
                            variant='tonal'
                            sx={{ mt: 0.5, textTransform: 'capitalize' }}
                          />
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Typography fontWeight={600} color='primary.main'>
                          {formatCurrency(tagihan.nominal)}
                        </Typography>
                      </td>
                    </tr>
                    <tr style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <Typography fontWeight={600}>Total</Typography>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Typography fontWeight={600} color='primary.main'>
                          {formatCurrency(Number(tagihan.nominal))}
                        </Typography>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bukti yang sudah ada */}
              {tagihan.buktiPembayaran && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <div className='flex items-center gap-3'>
                    <i className='tabler-file-check text-success text-xl' />
                    <div>
                      <Typography variant='body2' fontWeight={500}>Bukti Pembayaran</Typography>
                      <Button
                        size='small'
                        variant='text'
                        startIcon={<i className='tabler-eye' />}
                        onClick={() => window.open(tagihan.buktiPembayaran!, '_blank')}
                      >
                        Lihat Bukti
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Kanan: Aksi */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <div className='flex flex-col gap-3'>
                {isLunas && (
                  <>
                    <Box
                      className='p-2 rounded flex items-center gap-3'
                      sx={{ bgcolor: 'primary.light', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1 }}
                      onClick={async () => {
                        if (downloading) return
                        try {
                          setDownloading(true)
                          await downloadPdfFromApi(
                            `/api/tagihan/${tagihan.id}/pdf`,
                            `booking-${tagihan.nomorTagihan || tagihan.id.slice(-8).toUpperCase()}.pdf`
                          )
                        } catch {
                          showSnack('Gagal mengunduh bukti pembayaran', 'error')
                        } finally {
                          setDownloading(false)
                        }
                      }}
                    >
                      {downloading
                        ? <CircularProgress size={22} sx={{ color: 'white' }} />
                        : <i className='tabler-download text-white text-2xl' />}
                      <Typography color='white' fontWeight={600}>
                        {downloading ? 'Menyiapkan...' : 'Download Bukti'}
                      </Typography>
                    </Box>

                    <Box
                      className='p-2 rounded flex items-center gap-3 cursor-pointer'
                      sx={{ bgcolor: 'warning.main' }}
                      onClick={() => setReviewOpen(true)}
                    >
                      <i className='tabler-star text-white text-2xl' />
                      <Typography color='white' fontWeight={600}>
                        {existingReview ? 'Ubah Ulasan' : 'Beri Ulasan'}
                      </Typography>
                    </Box>
                  </>
                )}

                {isCancelled && (
                  <>
                    <Box className='p-4 rounded flex items-center gap-3' sx={{ bgcolor: 'error.light' }}>
                      <i className='tabler-circle-x text-white text-2xl' />
                      <Typography color='white' fontWeight={600}>Booking Dibatalkan</Typography>
                    </Box>
                    {tagihan?.alasanBatal && (
                      <Alert severity='warning'>
                        <Typography variant='body2' fontWeight={600}>
                          Alasan Pembatalan
                        </Typography>
                        <Typography variant='body2'>{tagihan.alasanBatal}</Typography>
                      </Alert>
                    )}
                  </>
                )}

                {confirmCancel && (
                  <Box className='p-3 rounded flex flex-col gap-2' sx={{ border: '1px solid', borderColor: 'error.main' }}>
                    <Typography variant='body2' fontWeight={600} color='error.main'>
                      Yakin ingin membatalkan booking ini?
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Tindakan ini tidak dapat dibatalkan.
                    </Typography>
                    <div className='flex gap-2 mt-1'>
                      <Button
                        fullWidth
                        variant='contained'
                        color='error'
                        size='small'
                        startIcon={cancelling ? <CircularProgress size={14} color='inherit' /> : <i className='tabler-check' />}
                        onClick={handleBatal}
                        disabled={cancelling}
                      >
                        {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
                      </Button>
                      <Button fullWidth variant='tonal' color='secondary' size='small' onClick={() => setConfirmCancel(false)} disabled={cancelling}>
                        Tidak
                      </Button>
                    </div>
                  </Box>
                )}

                {isMenungguKonfirmasi && !confirmCancel && (
                  <Alert severity='info'>
                    Booking sedang menunggu persetujuan pemilik. Tombol pembayaran akan muncul setelah disetujui.
                  </Alert>
                )}

                {!isLunas && !isCancelled && !isMenungguKonfirmasi && !confirmCancel && (
                  <>
                    <Button
                      fullWidth
                      variant='contained'
                      color='success'
                      startIcon={paying ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-credit-card' />}
                      onClick={handleBayar}
                      disabled={paying || checking}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {paying ? 'Memproses...' : 'Bayar Sekarang'}
                    </Button>
                    <Button
                      fullWidth
                      variant='contained'
                      color='primary'
                      startIcon={checking ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-refresh' />}
                      onClick={handleCheckTransaction}
                      disabled={paying || checking || !tagihan?.ipaymuSessionId}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {checking ? 'Mengecek...' : 'Check Transaksi'}
                    </Button>
                    <Button
                      fullWidth
                      variant='tonal'
                      color='error'
                      startIcon={<i className='tabler-x' />}
                      onClick={() => setConfirmCancel(true)}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Batalkan Booking
                    </Button>
                  </>
                )}

                <Divider />

                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-2'>
                    <i className='tabler-shield-check text-success' />
                    <Typography variant='caption' color='text.secondary'>Transaksi aman & terenkripsi</Typography>
                  </div>
                  <div className='flex items-center gap-2'>
                    <i className='tabler-headset text-primary' />
                    <Typography variant='caption' color='text.secondary'>Butuh bantuan? Hubungi kami</Typography>
                  </div>
                </div>

                <Button
                  fullWidth
                  variant='tonal'
                  color='secondary'
                  onClick={() => router.push('/booking/saya')}
                  startIcon={<i className='tabler-arrow-left' />}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Kembali
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog Beri Ulasan */}
      <Dialog open={reviewOpen} onClose={() => !submittingReview && setReviewOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{existingReview ? 'Ubah Ulasan' : 'Beri Ulasan'}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' className='mbe-3'>
            Bagaimana pengalaman booking Anda?
          </Typography>
          <div className='flex items-center gap-1 mbe-4'>
            {[1, 2, 3, 4, 5].map(i => (
              <IconButton key={i} size='small' onClick={() => setRating(i)} sx={{ p: 0.5 }}>
                <i
                  className={i <= rating ? 'tabler-star-filled' : 'tabler-star'}
                  style={{ fontSize: 30, color: i <= rating ? '#ffb400' : '#d1d5db' }}
                />
              </IconButton>
            ))}
          </div>
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Komentar (opsional)'
            placeholder='Ceritakan pengalaman Anda...'
            value={komentar}
            onChange={e => setKomentar(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setReviewOpen(false)} disabled={submittingReview}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleSubmitReview} disabled={submittingReview}>
            {submittingReview ? <CircularProgress size={20} /> : 'Kirim'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default BookingDetailView
