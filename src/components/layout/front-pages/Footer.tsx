'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'

// Util Imports
import { frontLayoutClasses } from '@layouts/utils/layoutClasses'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

const Footer = ({ mode }: { mode: Mode }) => {
  return (
    <footer className={frontLayoutClasses.footer}>
      <div className='bg-[#211B2C] plb-10'>
        <div className={classnames('flex flex-col gap-8', frontCommonStyles.layoutSpacing)}>
          <Grid container spacing={8}>
            <Grid size={{ xs: 12, md: 4 }}>
              <div className='flex flex-col gap-4'>
                <Link href='/'>
                  <Logo color='var(--mui-palette-common-white)' />
                </Link>
                <Typography color='white' variant='body2' className='opacity-[0.78] max-is-[300px]'>
                  Platform manajemen sewa yang membantu mengelola aset, penyewa, dan pembayaran secara digital.
                </Typography>
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
              <Typography component={Link} href='/contact' color='white' className='font-semibold mbe-4 hover:opacity-80'>
                Kontak Kami
              </Typography>
              <div className='flex flex-col gap-3'>
                <div className='flex items-start gap-2'>
                  <i className='tabler-brand-whatsapp text-white opacity-70 mbs-[2px]' />
                  <Typography
                    component='a'
                    href='https://wa.me/6285110544040'
                    target='_blank'
                    rel='noopener noreferrer'
                    color='white'
                    variant='body2'
                    className='opacity-[0.78] hover:opacity-100'
                  >
                    +62 851-1054-4040
                  </Typography>
                </div>
                <div className='flex items-start gap-2'>
                  <i className='tabler-mail text-white opacity-70 mbs-[2px]' />
                  <Typography
                    component='a'
                    href='mailto:support@bantusewa.com'
                    color='white'
                    variant='body2'
                    className='opacity-[0.78] hover:opacity-100'
                  >
                    support@bantusewa.com
                  </Typography>
                </div>
                <div className='flex items-start gap-2'>
                  <i className='tabler-map-pin text-white opacity-70 mbs-[2px]' />
                  <Typography color='white' variant='body2' className='opacity-[0.78]'>
                    Aryana Karawaci Cluster Flora Blok E6-08, Kab. Tangerang
                  </Typography>
                </div>
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <Typography component={Link} href='/faq' color='white' className='font-semibold mbe-4 hover:opacity-80'>
                FAQ
              </Typography>
              <div className='flex flex-col gap-3'>
                <Typography component={Link} href='/faq' color='white' variant='body2' className='opacity-[0.78] hover:opacity-100'>
                  Tentang Bantu Sewa
                </Typography>
                <Typography component={Link} href='/faq' color='white' variant='body2' className='opacity-[0.78] hover:opacity-100'>
                  Cara Pendaftaran
                </Typography>
                <Typography component={Link} href='/faq' color='white' variant='body2' className='opacity-[0.78] hover:opacity-100'>
                  Pembayaran & Refund
                </Typography>
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3.5 }}>
              <Typography component={Link} href='/term-condition' color='white' className='font-semibold mbe-4 hover:opacity-80'>
                Syarat dan Ketentuan
              </Typography>
              <div className='flex flex-col gap-3'>
                <Typography component={Link} href='/term-condition' color='white' variant='body2' className='opacity-[0.78] hover:opacity-100'>
                  Ketentuan Penggunaan
                </Typography>
                <Typography component={Link} href='/term-condition' color='white' variant='body2' className='opacity-[0.78] hover:opacity-100'>
                  Kebijakan Privasi
                </Typography>
                <Typography component={Link} href='/term-condition' color='white' variant='body2' className='opacity-[0.78] hover:opacity-100'>
                  Kebijakan Refund
                </Typography>
              </div>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <Typography className='text-white' variant='body2'>
              &copy; 2025, Bantu Sewa. All Rights Reserved.
            </Typography>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
