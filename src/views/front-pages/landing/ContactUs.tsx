// React Imports
import { useEffect, useRef } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Hook Imports
import { useIntersection } from '@/src/hooks/useIntersection'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

const ContactUs = () => {
  // Refs
  const skipIntersection = useRef(true)
  const ref = useRef<null | HTMLDivElement>(null)

  // Hooks
  const { updateIntersections } = useIntersection()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (skipIntersection.current) {
          skipIntersection.current = false

          return
        }

        updateIntersections({ [entry.target.id]: entry.isIntersecting })
      },
      { threshold: 0.35 }
    )

    ref.current && observer.observe(ref.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id='contact-us' className='plb-[100px] bg-backgroundDefault' ref={ref}>
      <div className={classnames('flex flex-col gap-14', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center text-center'>
          <Chip size='small' variant='tonal' color='primary' label='Hubungi Kami' />
          <Typography color='text.primary' variant='h4' className='font-extrabold'>
            Hubungi Tim Bantu Sewa
          </Typography>
          <Typography className='max-is-[520px]'>
            Kami berkomitmen untuk memberikan pelayanan terbaik. Jangan ragu untuk menghubungi kami kapan saja.
          </Typography>
          <Button
            variant='contained'
            color='primary'
            size='large'
            startIcon={<i className='tabler-brand-whatsapp' />}
            href='https://wa.me/6285110544040'
            target='_blank'
            rel='noopener noreferrer'
            className='mbs-2'
          >
            Chat dengan Tim Kami
          </Button>
        </div>
        <Grid container spacing={6} justifyContent='center'>
          {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card className='text-center h-full'>
              <CardContent className='flex flex-col items-center gap-4 pbs-8 pbe-8'>
                <CustomAvatar variant='rounded' size={56} skin='light' color='primary'>
                  <i className='tabler-building text-2xl' />
                </CustomAvatar>
                <div className='flex flex-col gap-1'>
                  <Typography variant='h6' color='text.primary' className='font-semibold'>
                    Perusahaan
                  </Typography>
                  <Typography color='text.secondary'>PT Syukur</Typography>
                </div>
              </CardContent>
            </Card>
          </Grid> */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card className='text-center h-full'>
              <CardContent className='flex flex-col items-center gap-4 pbs-8 pbe-8'>
                <CustomAvatar variant='rounded' size={56} skin='light' color='success'>
                  <i className='tabler-brand-whatsapp text-2xl' />
                </CustomAvatar>
                <div className='flex flex-col gap-1'>
                  <Typography variant='h6' color='text.primary' className='font-semibold'>
                    WhatsApp
                  </Typography>
                  <Typography color='text.secondary'>+62 851-1054-4040</Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card className='text-center h-full'>
              <CardContent className='flex flex-col items-center gap-4 pbs-8 pbe-8'>
                <CustomAvatar variant='rounded' size={56} skin='light' color='info'>
                  <i className='tabler-mail text-2xl' />
                </CustomAvatar>
                <div className='flex flex-col gap-1'>
                  <Typography variant='h6' color='text.primary' className='font-semibold'>
                    Email
                  </Typography>
                  <Typography color='text.secondary'>support@bantusewa.com</Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card className='text-center h-full'>
              <CardContent className='flex flex-col items-center gap-4 pbs-8 pbe-8'>
                <CustomAvatar variant='rounded' size={56} skin='light' color='warning'>
                  <i className='tabler-map-pin text-2xl' />
                </CustomAvatar>
                <div className='flex flex-col gap-1'>
                  <Typography variant='h6' color='text.primary' className='font-semibold'>
                    Alamat
                  </Typography>
                  <Typography color='text.secondary'>
                    Aryana Karawaci Cluster Flora Blok E6-08, Kab. Tangerang
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </section>
  )
}

export default ContactUs
