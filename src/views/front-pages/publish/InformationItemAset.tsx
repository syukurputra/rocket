'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid2'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import BookingDialog from './BookingDialog'
import ScheduleDialog from './ScheduleDialog'

interface InformationItemAsetProps {
  data: any
  asetNama?: string
}

const InformationItemAset = ({ data, asetNama = '' }: InformationItemAsetProps) => {
  const [openGallery, setOpenGallery] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [openBooking, setOpenBooking] = useState(false)
  const [openSchedule, setOpenSchedule] = useState(false)
  const [pendingBookingData, setPendingBookingData] = useState<any>(null)
  const [autoProcessing, setAutoProcessing] = useState(false)

  // Auto-proses booking setelah redirect dari login
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) return

    try {
      const raw = localStorage.getItem('pendingBooking')

      if (!raw) return

      const pending = JSON.parse(raw)

      if (pending.ruanganId !== data.id) return

      // Ada pendingBooking untuk item aset ini + user sudah login → proses otomatis
      setAutoProcessing(true)

      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null

      if (!user) {
        setAutoProcessing(false)
        setPendingBookingData(pending)
        setOpenBooking(true)

        return
      }

      fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruanganId: pending.ruanganId,
          namaPemesan: user.username || user.nama || '',
          email: user.email || '',
          telepon: user.nomorTelepon || '',
          jenisHarga: pending.jenisHarga,
          mulaiSewa: pending.mulaiSewa,
          selesaiSewa: pending.selesaiSewa,
          durasi: pending.durasi,
          hargaSatuan: pending.hargaSatuan,
          total: pending.total,
          catatan: pending.catatan || '',
          userId: user.id
        })
      })
        .then(res => res.json().then(d => ({ ok: res.ok, data: d })))
        .then(({ ok, data: bookingData }) => {
          localStorage.removeItem('pendingBooking')

          if (ok) {
            const paymentUrl = bookingData.data?.tagihan?.paymentUrl

            if (paymentUrl) {
              window.location.href = paymentUrl
            } else {
              window.location.href = '/booking'
            }
          } else {
            // Gagal → buka dialog dengan error
            setPendingBookingData({ ...pending, errorMessage: bookingData.message || 'Gagal memproses booking' })
            setAutoProcessing(false)
            setOpenBooking(true)
          }
        })
        .catch(() => {
          setPendingBookingData({ ...pending, errorMessage: 'Terjadi kesalahan jaringan, silakan coba lagi.' })
          setAutoProcessing(false)
          setOpenBooking(true)
        })
    } catch {
      setAutoProcessing(false)
    }
  }, [])

  const images = data.images && data.images.length > 0 ? data.images : []

  const formatCurrency = (amount: any) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount))

  const jenisLabel = (j: string) => ({ JAM: 'Jam', HARIAN: 'Harian', BULANAN: 'Bulanan', TAHUNAN: 'Tahunan' }[j] ?? j)

  const jenisColor = (j: string): 'default' | 'info' | 'success' | 'warning' =>
    ({ JAM: 'default', HARIAN: 'info', BULANAN: 'success', TAHUNAN: 'warning' } as any)[j] ?? 'default'

  const handleOpenGallery = (idx = 0) => {
    if (images.length > 0) {
      setActiveIdx(idx)
      setOpenGallery(true)
    }
  }

  const handleCloseGallery = () => setOpenGallery(false)

  const handlePrev = () => setActiveIdx(i => (i - 1 + images.length) % images.length)
  const handleNext = () => setActiveIdx(i => (i + 1) % images.length)

  if (autoProcessing) {
    return (
      <Card>
        <CardContent>
          <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' gap={3} py={6}>
            <CircularProgress size={48} />
            <Typography variant='h6'>Memproses booking Anda...</Typography>
            <Typography color='text.secondary' align='center'>
              Mohon tunggu, kami sedang menyiapkan pembayaran untuk {data.nama}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <Grid container spacing={0}>
          {/* Left Column: Judul, Harga, Fasilitas */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Judul + Deskripsi */}
            <CardContent>
              <Typography variant='h5' className='mbe-2'>{data.nama}</Typography>
              <Typography color='text.secondary'>{data.deskripsi || 'Tidak ada deskripsi'}</Typography>
            </CardContent>

            {/* Harga Sewa */}
            {data.hargaItemAset && data.hargaItemAset.length > 0 && (
              <CardContent sx={{ pt: 0 }}>
                <Typography variant='h5' className='mbe-2'>Harga Sewa</Typography>
                <Grid container spacing={2}>
                  {data.hargaItemAset.map((h: any) => (
                    <Grid key={h.id}>
                      <Chip
                        label={`${jenisLabel(h.jenisHarga)}: ${formatCurrency(h.harga)}`}
                        color='info'
                        size='small'
                        variant='tonal'
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            )}

            {/* Fasilitas */}
            {data.fasilitasRuangan && data.fasilitasRuangan.length > 0 && (
              <CardContent sx={{ pt: 0 }}>
                <Typography variant='h5' className='mbe-2'>Fasilitas</Typography>
                <Grid container spacing={2}>
                  {data.fasilitasRuangan.map((fasilitas: any) => (
                    <Grid key={fasilitas.id}>
                      <Chip
                        color='success'
                        size='small'
                        variant='tonal'
                        icon={<i className={fasilitas.icon?.code || 'tabler-circle'} />}
                        label={fasilitas.nama}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            )}

          </Grid>

          {/* Right Column: Image */}
          <Grid size={{ xs: 12, md: 4 }}>
            <CardContent className='flex flex-col items-center justify-center h-full gap-2'>
              {images.length > 0 && (
                <>
                  <Box sx={{ width: '100%', overflow: 'hidden', borderRadius: 1 }}>
                    <img
                      src={images[0].filepath}
                      alt={data.nama}
                      onClick={() => handleOpenGallery(0)}
                      className='cursor-pointer hover:opacity-80 transition-opacity'
                      style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                    />
                  </Box>
                  {images.length > 1 && (
                    <div className='flex gap-1 flex-wrap justify-start w-full'>
                      {images.slice(1).map((img: any, i: number) => (
                        <img
                          key={i}
                          src={img.filepath}
                          alt={`${data.nama} ${i + 2}`}
                          onClick={() => handleOpenGallery(i + 1)}
                          className='rounded cursor-pointer hover:opacity-80 transition-opacity'
                          style={{ width: 60, height: 60, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
              {data.hargaItemAset && data.hargaItemAset.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1, width: '100%' }}>
                  <Button
                    variant='outlined'
                    color='secondary'
                    fullWidth
                    startIcon={<i className='tabler-calendar' />}
                    onClick={() => setOpenSchedule(true)}
                  >
                    Schedule
                  </Button>
                  <Button
                    variant='contained'
                    fullWidth
                    startIcon={<i className='tabler-calendar-check' />}
                    onClick={() => setOpenBooking(true)}
                  >
                    Booking
                  </Button>
                </Box>
              )}
            </CardContent>
          </Grid>
        </Grid>
      </Card>

      {/* Booking Dialog */}
      {data.hargaItemAset && data.hargaItemAset.length > 0 && (
        <BookingDialog
          open={openBooking}
          onClose={() => { setOpenBooking(false); setPendingBookingData(null) }}
          itemAset={{ id: data.id, nama: data.nama, hargaItemAset: data.hargaItemAset }}
          asetNama={asetNama}
          initialData={pendingBookingData || undefined}
        />
      )}

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        itemAsetId={data.id}
        itemAsetNama={data.nama}
      />

      {/* Image Gallery Modal */}
      <Dialog open={openGallery} onClose={handleCloseGallery} maxWidth='md' fullWidth>
        <DialogContent sx={{ p: 2, position: 'relative', bgcolor: 'background.paper' }}>
          <IconButton onClick={handleCloseGallery} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
            <i className='tabler-x' />
          </IconButton>

          {/* Main image */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
            {images.length > 1 && (
              <IconButton onClick={handlePrev} sx={{ position: 'absolute', left: 0, zIndex: 1 }}>
                <i className='tabler-chevron-left' />
              </IconButton>
            )}
            <img
              src={images[activeIdx]?.filepath}
              alt={`${data.nama} - ${activeIdx + 1}`}
              style={{ maxHeight: 400, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
            />
            {images.length > 1 && (
              <IconButton onClick={handleNext} sx={{ position: 'absolute', right: 0, zIndex: 1 }}>
                <i className='tabler-chevron-right' />
              </IconButton>
            )}
          </div>

          {/* Counter */}
          <Typography align='center' variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
            {activeIdx + 1} / {images.length}
          </Typography>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className='flex gap-2 justify-center flex-wrap' style={{ marginTop: 12 }}>
              {images.map((img: any, idx: number) => (
                <img
                  key={idx}
                  src={img.filepath}
                  alt={`thumb-${idx}`}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    width: 64, height: 64, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
                    border: idx === activeIdx ? '2px solid var(--mui-palette-primary-main)' : '2px solid transparent',
                    opacity: idx === activeIdx ? 1 : 0.6
                  }}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default InformationItemAset
