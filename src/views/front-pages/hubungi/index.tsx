'use client'

// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

const HubungiView = ({ mode }: { mode: SystemMode }) => {
  return (
    <section className='plb-[80px] bg-backgroundDefault min-bs-screen'>
      <div className={classnames('flex flex-col gap-14', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center text-center'>
          <Chip size='small' variant='tonal' color='primary' label='Kontak' />
          <Typography color='text.primary' variant='h3' className='font-extrabold'>
            Hubungi Tim Bantu Sewa
          </Typography>
          <Typography className='max-is-[520px]' variant='body1'>
            Kami berkomitmen untuk memberikan pelayanan terbaik. Jangan ragu untuk menghubungi kami kapan saja.
          </Typography>
          <Button
            variant='contained'
            color='primary'
            size='large'
            startIcon={<i className='tabler-brand-whatsapp' />}
            href='https://wa.me/6285110544041'
            target='_blank'
            rel='noopener noreferrer'
            className='mbs-2'
          >
            Chat dengan Tim Kami
          </Button>
        </div>
        <Grid container spacing={6} justifyContent='center'>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card className='text-center h-full'>
              <CardContent className='flex flex-col items-center gap-4 pbs-8 pbe-8'>
                <CustomAvatar variant='rounded' size={56} skin='light' color='success'>
                  <i className='tabler-brand-whatsapp text-2xl' />
                </CustomAvatar>
                <div className='flex flex-col gap-2'>
                  <Typography variant='h6' color='text.primary' className='font-semibold'>
                    WhatsApp
                  </Typography>
                  <Typography color='text.secondary'>+62 851-1054-4041</Typography>
                  <Button
                    variant='tonal'
                    color='success'
                    size='small'
                    href='https://wa.me/6285110544041'
                    target='_blank'
                    rel='noopener noreferrer'
                    startIcon={<i className='tabler-external-link' />}
                    className='mbs-2'
                  >
                    Buka WhatsApp
                  </Button>
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
                <div className='flex flex-col gap-2'>
                  <Typography variant='h6' color='text.primary' className='font-semibold'>
                    Email
                  </Typography>
                  <Typography color='text.secondary'>support@bantusewa.com</Typography>
                  <Button
                    variant='tonal'
                    color='info'
                    size='small'
                    href='mailto:support@bantusewa.com'
                    startIcon={<i className='tabler-external-link' />}
                    className='mbs-2'
                  >
                    Kirim Email
                  </Button>
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
                <div className='flex flex-col gap-2'>
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
        <Card>
          <CardContent className='pli-8 plb-8'>
            <div className='flex flex-col gap-4'>
              <Typography variant='h5' color='text.primary' className='font-semibold'>
                Jam Operasional
              </Typography>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <div className='flex items-center gap-3'>
                    <i className='tabler-clock text-primary text-xl' />
                    <div>
                      <Typography color='text.primary' className='font-medium'>Senin - Jumat</Typography>
                      <Typography color='text.secondary' variant='body2'>08.00 - 17.00 WIB</Typography>
                    </div>
                  </div>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <div className='flex items-center gap-3'>
                    <i className='tabler-clock text-warning text-xl' />
                    <div>
                      <Typography color='text.primary' className='font-medium'>Sabtu</Typography>
                      <Typography color='text.secondary' variant='body2'>08.00 - 12.00 WIB</Typography>
                    </div>
                  </div>
                </Grid>
              </Grid>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default HubungiView
