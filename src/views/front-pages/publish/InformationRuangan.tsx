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
import Box from '@mui/material/Box'

// Third-party Imports
import { useKeenSlider } from 'keen-slider/react'
import type { KeenSliderPlugin } from 'keen-slider/react'

// Component Imports
import AppKeenSlider from '@/src/libs/styles/AppKeenSlider'

function ThumbnailPlugin(mainRef: any): KeenSliderPlugin {
  return slider => {
    function removeActive() {
      slider.slides.forEach(slide => {
        slide.classList.remove('active')
      })
    }

    function addActive(idx: number) {
      slider.slides[idx].classList.add('active')
    }

    function addClickEvents() {
      slider.slides.forEach((slide, idx) => {
        slide.addEventListener('click', () => {
          if (mainRef.current) mainRef.current.moveToIdx(idx)
        })
      })
    }

    slider.on('created', () => {
      if (!mainRef.current) return
      addActive(slider.track.details.rel)
      addClickEvents()
      mainRef.current.on('animationStarted', (main: any) => {
        removeActive()
        const next = main.animator.targetIdx || 0

        addActive(main.track.absToRel(next))
        slider.moveToIdx(Math.min(slider.track.details.maxIdx, next))
      })
    })
  }
}

interface InformationRuanganProps {
  data: any
}

const InformationRuangan = ({ data }: InformationRuanganProps) => {
  const [openGallery, setOpenGallery] = useState(false)

  // Hooks for KeenSlider
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0
  })

  const [thumbnailRef] = useKeenSlider<HTMLDivElement>(
    {
      initial: 0,
      slides: {
        perView: 4,
        spacing: 10
      }
    },
    [ThumbnailPlugin(instanceRef)]
  )

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
      Number(amount)
    )
  }

  const images = data.images && data.images.length > 0 ? data.images : []
  const imageSrc = images.length > 0 ? images[0].filepath : '/images/publish-gallery-1.png'

  const handleOpenGallery = () => {
    if (images.length > 0) {
      setOpenGallery(true)
    }
  }

  const handleCloseGallery = () => {
    setOpenGallery(false)
  }

  return (
    <>
      <Card>
        <Grid container spacing={0}>
          {/* Left Column: Judul + Deskripsi */}
          <Grid size={{ xs: 12, md: 10 }}>
            <CardContent>
              <Typography variant='h5' className='mbe-2'>
                {data.nama}
              </Typography>
              <Typography color='text.secondary'>{data.deskripsi || 'Tidak ada deskripsi'}</Typography>
            </CardContent>
          </Grid>

          {/* Right Column: Image */}
          <Grid size={{ xs: 12, md: 2 }} sx={{ order: { xs: -1, md: 0 } }}>
            <CardContent className='flex items-center justify-center' sx={{ height: '100%' }}>
              <img
                src={imageSrc}
                className='rounded object-cover is-full cursor-pointer hover:opacity-80 transition-opacity'
                alt={data.nama}
                onClick={handleOpenGallery}
                style={{ cursor: images.length > 0 ? 'pointer' : 'default', maxHeight: '250px' }}
              />
            </CardContent>
          </Grid>

          {/* Row 3: Harga (Full Width) */}
          <Grid size={{ xs: 12 }}>
            <CardContent>
              <Typography variant='h5' className='mbe-2'>
                Harga Sewa
              </Typography>
              <Grid container spacing={2}>
                {Number(data.hargaHarian) > 0 && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography color='text.secondary'>Harian: {formatCurrency(data.hargaHarian)}</Typography>
                  </Grid>
                )}
                {Number(data.hargaBulanan) > 0 && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography color='text.secondary'>Bulanan: {formatCurrency(data.hargaBulanan)}</Typography>
                  </Grid>
                )}
                {Number(data.hargaTahunan) > 0 && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography color='text.secondary'>Tahunan: {formatCurrency(data.hargaTahunan)}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Grid>

          {/* Row 4: Fasilitas (Full Width) */}
          {data.fasilitasRuangan && data.fasilitasRuangan.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <CardContent sx={{ paddingTop: 0 }}>
                <Typography variant='h5' className='mbe-2'>
                  Fasilitas
                </Typography>
                <Grid container spacing={2}>
                  {data.fasilitasRuangan.map((fasilitas: any) => (
                    <Grid key={fasilitas.id} size={{ xs: 12, md: 4 }}>
                      <div className='flex items-center gap-2'>
                        <i className={`${fasilitas.icon?.code || 'tabler-circle'} text-lg text-textSecondary`} />
                        <Typography color='text.secondary'>{fasilitas.nama}</Typography>
                      </div>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Grid>
          )}
        </Grid>
      </Card>

      {/* Image Gallery Modal */}
      <Dialog open={openGallery} onClose={handleCloseGallery} maxWidth='lg' fullWidth>
        <DialogContent sx={{ p: 3 }}>
          {/* Close Button */}
          <IconButton
            onClick={handleCloseGallery}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1
            }}
          >
            <i className='tabler-x' />
          </IconButton>

          {/* KeenSlider Gallery */}
          <AppKeenSlider>
            <Box className='navigation-wrapper'>
              <div ref={sliderRef} className='keen-slider'>
                {images.map((image: any, idx: number) => (
                  <div key={idx} className='keen-slider__slide'>
                    <img
                      src={image.filepath}
                      alt={`${data.nama} - ${idx + 1}`}
                      className='is-full object-contain rounded'
                    />
                  </div>
                ))}
              </div>
            </Box>

            <div ref={thumbnailRef} className='keen-slider thumbnail mbs-4'>
              {images.map((image: any, idx: number) => (
                <div key={idx} className='keen-slider__slide cursor-pointer'>
                  <img
                    src={image.filepath}
                    alt={`thumb-${idx}`}
                    className='object-contain bs-[100px] rounded bg-actionHover'
                  />
                </div>
              ))}
            </div>
          </AppKeenSlider>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default InformationRuangan
