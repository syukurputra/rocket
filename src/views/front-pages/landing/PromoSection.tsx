'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'

import { useKeenSlider } from 'keen-slider/react'
import CustomIconButton from '@core/components/mui/IconButton'
import AppKeenSlider from '@/src/libs/styles/AppKeenSlider'

import classnames from 'classnames'

import frontCommonStyles from '@views/front-pages/styles.module.css'

type BannerPromo = {
  id: string
  judul: string
  deskripsi?: string | null
  imageUrl?: string | null
  periodeAwal: string
  periodeAkhir: string
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const PromoSection = () => {
  const [promos, setPromos] = useState<BannerPromo[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      slides: { perView: 'auto', spacing: 16 }
    },
    [
      slider => {
        let timeout: ReturnType<typeof setTimeout>

        function next() {
          clearTimeout(timeout)
          timeout = setTimeout(() => slider.next(), 3000)
        }

        slider.on('created', next)
        slider.on('dragStarted', () => clearTimeout(timeout))
        slider.on('animationEnded', next)
        slider.on('updated', next)
      }
    ]
  )

  useEffect(() => {
    fetch('/api/public/banner-promo')
      .then(r => r.json())
      .then(result => setPromos(result.data || []))
      .catch(() => setPromos([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && promos.length === 0) return null

  return (
    <>
    <section className='flex flex-col gap-8 plb-[50px] bg-backgroundDefault'>
      <div className={classnames('flex max-md:flex-col max-sm:flex-wrap is-full gap-6', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-1 bs-full justify-center items-center lg:items-start is-full md:is-[30%] mlb-auto sm:pbs-2'>
          <Chip label='Promo Terbaru' variant='tonal' color='primary' size='small' className='mbe-3' />
          <div className='flex flex-col gap-y-1 flex-wrap max-lg:text-center'>
            <Typography color='text.primary' variant='h4'>
              <span className='relative z-[1] font-extrabold'>
                Promo Spesial
                <img
                  src='/images/front-pages/landing-page/bg-shape.png'
                  alt='bg-shape'
                  className='absolute block-end-0 z-[1] bs-[40%] is-[132%] inline-start-[-8%] block-start-[17px]'
                />
              </span>
            </Typography>
            <Typography>Dapatkan penawaran terbaik dari layanan kami untuk bisnis sewa Anda.</Typography>
          </div>
          <div className='flex gap-x-4 mbs-11'>
            <CustomIconButton color='primary' variant='tonal' onClick={() => instanceRef.current?.prev()}>
              <i className='tabler-chevron-left' />
            </CustomIconButton>
            <CustomIconButton color='primary' variant='tonal' onClick={() => instanceRef.current?.next()}>
              <i className='tabler-chevron-right' />
            </CustomIconButton>
          </div>
        </div>

        <div className='is-full md:is-[70%]'>
          {loading ? (
            <div className='flex gap-4'>
              {[1, 2].map(i => (
                <Card key={i} elevation={4} className='flex-1'>
                  <Skeleton variant='rectangular' width={300} height={350} />
                  <CardContent>
                    <Skeleton variant='text' width='70%' height={28} />
                    <Skeleton variant='text' width='100%' />
                    <Skeleton variant='text' width='60%' />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <AppKeenSlider>
              <div ref={sliderRef} className='keen-slider mbe-6'>
                {promos.map(promo => (
                  <div key={promo.id} className='keen-slider__slide py-2' style={{ width: 400 }}>
                    <Card elevation={8} className='flex flex-col' style={{ width: '100%' }}>
                      {promo.imageUrl ? (
                        <Box
                          sx={{ cursor: 'zoom-in', overflow: 'hidden', lineHeight: 0 }}
                          onClick={() => setLightbox(promo.imageUrl!)}
                        >
                          <img
                            src={promo.imageUrl}
                            alt={promo.judul}
                            style={{ display: 'block', width: '100%', height: 'auto' }}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{ width: 300, height: 300, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <i className='tabler-speakerphone text-5xl text-primary opacity-30' />
                        </Box>
                      )}
                      <CardContent className='flex flex-col gap-3 flex-1'>
                        <Typography variant='h6' fontWeight={700} className='line-clamp-2'>
                          {promo.judul}
                        </Typography>
                        {promo.deskripsi && (
                          <Typography variant='body2' color='text.secondary' className='line-clamp-3 flex-1'>
                            {promo.deskripsi}
                          </Typography>
                        )}
                        <div className='flex items-center gap-1 mt-auto'>
                          <i className='tabler-calendar text-sm text-textSecondary' />
                          <Typography variant='caption' color='text.secondary'>
                            {formatDate(promo.periodeAwal)} – {formatDate(promo.periodeAkhir)}
                          </Typography>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </AppKeenSlider>
          )}
        </div>
      </div>
    </section>

    <Dialog open={!!lightbox} onClose={() => setLightbox(null)} maxWidth='md'>
      <DialogContent sx={{ p: 2, position: 'relative', bgcolor: 'background.paper' }}>
        <IconButton onClick={() => setLightbox(null)} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <i className='tabler-x' />
        </IconButton>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
          {lightbox && (
            <img
              src={lightbox}
              alt='preview'
              style={{ maxHeight: '80vh', maxWidth: '100%', objectFit: 'contain', borderRadius: 8, display: 'block' }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default PromoSection
