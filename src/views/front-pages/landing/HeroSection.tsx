// Next Imports
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import { useColorScheme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Styles Imports
import styles from '@views/front-pages/landing/styles.module.css'
import frontCommonStyles from '@views/front-pages/styles.module.css'

const HeroSection = ({ mode }: { mode: SystemMode }) => {
  // Vars
  const dashboardImageLight = '/images/front-pages/landing-page/landing-header.png'
  const dashboardImageDark = '/images/front-pages/landing-page/landing-header.png'
  const heroSectionBgLight = '/images/front-pages/landing-page/hero-bg-light.png'
  const heroSectionBgDark = '/images/front-pages/landing-page/hero-bg-dark.png'

  // Hooks
  const { mode: muiMode } = useColorScheme()
  const dashboardImage = useImageVariant(mode, dashboardImageLight, dashboardImageDark)
  const heroSectionBg = useImageVariant(mode, heroSectionBgLight, heroSectionBgDark)

  const _mode = (muiMode === 'system' ? mode : muiMode) || mode

  return (
    <section id='home' className='overflow-hidden pbs-[75px] -mbs-[75px] relative'>
      <img
        src={heroSectionBg}
        alt='hero-bg'
        className={classnames('bs-[130%] sm:bs-[120%] md:bs-[110%]', styles.heroSectionBg, {
          [styles.bgLight]: _mode === 'light',
          [styles.bgDark]: _mode === 'dark'
        })}
      />
      <div className={classnames('pbs-[88px] pbe-12 relative z-[1]', frontCommonStyles.layoutSpacing)}>
        <Grid container spacing={6} alignItems='center'>
          <Grid size={{ xs: 12, lg: 6 }}>
            <div className='flex flex-col gap-6 max-lg:text-center'>
              <Typography
                variant='h2'
                className={classnames('font-extrabold leading-tight', styles.heroText)}
              >
                Kelola bisnis sewa<br />
                tanpa ribet &<br />
                tanpa salah tagih
              </Typography>
              <Typography variant='h6' color='text.secondary' className='font-normal max-is-[520px] max-lg:mli-auto'>
                Dari properti, kendaraan, perlengkapan bayi, hingga perlengkapan acara — semua transaksi, pelanggan,
                dan aset sewa Anda dalam satu dasbor cerdas.
              </Typography>
              <div className='flex gap-4 flex-wrap max-lg:justify-center'>
                <Button
                  component={Link}
                  href='/register'
                  variant='contained'
                  color='primary'
                  size='large'
                >
                  Coba Gratis
                </Button>
              </div>
            </div>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <img
              src={dashboardImage}
              alt='dashboard preview'
              className='is-full'
            />
          </Grid>
        </Grid>
      </div>
    </section>
  )
}

export default HeroSection
