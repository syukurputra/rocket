'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import { useAuth } from '@/src/hooks/useAuth'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import styles from './styles.module.css'

/**
 * Bagian harga di landing page.
 *
 * Bantu Sewa kini 100% gratis — tidak ada lagi paket berlangganan, sehingga
 * bagian ini cukup menegaskan bahwa semua fitur terbuka tanpa biaya. Id
 * `pricing-plans` dipertahankan supaya tautan `/#pricing-plans` tetap jalan.
 */
const fitur = [
  { ikon: 'tabler-building-store', judul: 'Aset & item sewa tanpa batas', isi: 'Properti, kendaraan, peralatan, hingga perlengkapan acara.' },
  { ikon: 'tabler-calendar-event', judul: 'Booking & kalender', isi: 'Booking online, konfirmasi, dan jadwal sewa dalam satu kalender.' },
  { ikon: 'tabler-users', judul: 'Manajemen penyewa', isi: 'Data penyewa, riwayat sewa, dan pengingat tagihan.' },
  { ikon: 'tabler-credit-card', judul: 'Pembayaran online', isi: 'Penyewa membayar langsung lewat aplikasi.' },
  { ikon: 'tabler-chart-histogram', judul: 'Laporan keuangan', isi: 'Catat pemasukan & pengeluaran, pantau saldo usaha.' },
  { ikon: 'tabler-world', judul: 'Website usaha sendiri', isi: 'Halaman publik untuk memajang aset Anda.' }
]

const PricingPlan = () => {
  const { user } = useAuth()

  return (
    <section
      id='pricing-plans'
      className={classnames(
        'flex flex-col gap-8 lg:gap-12 plb-[100px] bg-backgroundDefault',
        styles.sectionStartRadius
      )}
    >
      <div className={classnames('is-full flex flex-col gap-10', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center'>
          <Chip size='small' variant='tonal' color='success' label='100% Gratis' />
          <div className='flex flex-col items-center gap-y-1 justify-center flex-wrap'>
            <Typography color='text.primary' variant='h4' className='text-center'>
              <span className='relative z-[1] font-extrabold'>
                100% Gratis
                <img
                  src='/images/front-pages/landing-page/bg-shape.png'
                  alt=''
                  aria-hidden='true'
                  className='absolute block-end-0 z-[1] bs-[40%] is-[125%] sm:is-[132%] -inline-start-[10%] sm:inline-start-[-19%] block-start-[17px]'
                />
              </span>{' '}
              untuk semua usaha sewa
            </Typography>
            <Typography className='text-center'>
              Tanpa biaya langganan, tanpa batas masa aktif, tanpa perlu upgrade.
              <br />
              Semua fitur Bantu Sewa langsung terbuka sejak Anda mendaftar.
            </Typography>
          </div>
        </div>

        <Card className='border-2 border-success max-is-[960px] mli-auto is-full'>
          <CardContent className='flex flex-col gap-8 p-8 sm:p-10'>
            <div className='flex flex-wrap items-end justify-between gap-4'>
              <div className='flex flex-col gap-1'>
                <Typography variant='h5'>Semua fitur terbuka</Typography>
                <div className='flex items-end gap-2'>
                  <Typography variant='h1' color='success.main' className='font-extrabold leading-none'>
                    Rp 0
                  </Typography>
                  <Typography className='mbe-1'>biaya langganan</Typography>
                </div>
              </div>
              <Button
                component={Link}
                href={user ? '/dashboard' : '/register'}
                variant='contained'
                size='large'
                endIcon={<i className='tabler-arrow-right' />}
              >
                {user ? 'Buka Dashboard' : 'Daftar Gratis'}
              </Button>
            </div>

            <Grid container spacing={6}>
              {fitur.map(f => (
                <Grid key={f.judul} size={{ xs: 12, sm: 6, md: 4 }} className='flex gap-3'>
                  <i className={classnames(f.ikon, 'text-[26px] text-success shrink-0')} />
                  <div className='flex flex-col gap-0.5'>
                    <Typography color='text.primary' className='font-medium'>
                      {f.judul}
                    </Typography>
                    <Typography variant='body2'>{f.isi}</Typography>
                  </div>
                </Grid>
              ))}
            </Grid>

            <Typography variant='body2' color='text.secondary'>
              Tanpa biaya langganan. Biaya layanan per transaksi booking tetap berlaku sesuai ketentuan Bantu
              Sewa.
            </Typography>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default PricingPlan
