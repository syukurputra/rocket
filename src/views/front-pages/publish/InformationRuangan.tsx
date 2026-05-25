'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid2'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'

interface InformationRuanganProps {
  data: any
}

const InformationRuangan = ({ data }: InformationRuanganProps) => {
  const [openGallery, setOpenGallery] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

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
              {images.length > 0 ? (
                <>
                  <img
                    src={images[0].filepath}
                    alt={data.nama}
                    onClick={() => handleOpenGallery(0)}
                    className='rounded cursor-pointer hover:opacity-80 transition-opacity w-full'
                    style={{ objectFit: 'cover', maxHeight: 200 }}
                  />
                  {images.length > 1 && (
                    <div className='flex gap-1 flex-wrap justify-start w-full'>
                      {images.slice(1).map((img: any, i: number) => (
                        <img
                          key={i}
                          src={img.filepath}
                          alt={`${data.nama} ${i + 2}`}
                          onClick={() => handleOpenGallery(i + 1)}
                          className='rounded cursor-pointer hover:opacity-80 transition-opacity'
                          style={{ width: 60, height: 60, objectFit: 'cover' }}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <img
                  src='/images/publish-gallery-1.png'
                  className='rounded w-full'
                  alt={data.nama}
                  style={{ objectFit: 'cover', maxHeight: 200 }}
                />
              )}
            </CardContent>
          </Grid>
        </Grid>
      </Card>

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

export default InformationRuangan
