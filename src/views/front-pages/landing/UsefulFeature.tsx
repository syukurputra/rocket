// React Imports
import { useEffect, useRef } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import { useIntersection } from '@/src/hooks/useIntersection'

// SVG Imports
import Paper from '@assets/svg/front-pages/landing-page/Paper'
import Check from '@assets/svg/front-pages/landing-page/Check'
import User from '@assets/svg/front-pages/landing-page/User'
import LaptopCharging from '@assets/svg/front-pages/landing-page/LaptopCharging'
import Rocket from '@assets/svg/front-pages/landing-page/Rocket'
import Document from '@assets/svg/front-pages/landing-page/Document'
import Diamond from '@assets/svg/front-pages/landing-page/Diamond'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

// Data
const feature = [
  {
    icon: <LaptopCharging color='var(--mui-palette-primary-main)' />,
    title: 'Kelola Aset Sewa',
    description:
      'Tambah dan kelola semua aset bisnis sewa Anda — properti, kendaraan, peralatan, atau barang sewaan lainnya dalam satu dasbor.'
  },
  {
    icon: <Rocket color='var(--mui-palette-primary-main)' />,
    title: 'Manajemen Item Sewa',
    description:
      'Atur setiap unit atau item sewaan lengkap dengan harga, foto, dan status ketersediaan secara real-time.'
  },
  {
    icon: <i className='tabler-calendar-check' style={{ fontSize: 54, color: 'var(--mui-palette-primary-main)' }} />,
    title: 'Atur Jadwal Sewa',
    description:
      'Kelola jadwal ketersediaan dan pemesanan lewat kalender. Penyewa dapat mengecek slot kosong dan booking langsung tanpa bentrok tanggal.'
  },
  {
    icon: <User color='var(--mui-palette-primary-main)' />,
    title: 'Data Pelanggan',
    description:
      'Simpan data penyewa lengkap dengan riwayat penyewaan, kontak, dan status pembayaran dalam satu tempat.'
  },
  {
    icon: <Check color='var(--mui-palette-primary-main)' />,
    title: 'Tagihan Otomatis',
    description:
      'Buat dan kirim tagihan otomatis ke penyewa. Lacak status pembayaran dan kirim pengingat via WhatsApp atau email.'
  },
  {
    icon: <Diamond color='var(--mui-palette-primary-main)' />,
    title: 'Tagihan & Pembayaran Online',
    description:
      'Kirim tagihan online ke penyewa dan terima pembayaran secara online — transfer bank, e-wallet, kartu, hingga gerai retail, langsung terkonfirmasi otomatis.'
  },
  {
    icon: <i className='tabler-cash-banknote' style={{ fontSize: 54, color: 'var(--mui-palette-primary-main)' }} />,
    title: 'Penarikan Pembayaran Online',
    description:
      'Tarik saldo hasil pembayaran online Anda dengan mudah. Pilih transaksi, ajukan penarikan, dan pantau riwayatnya dalam satu halaman.'
  },
  {
    icon: <Paper color='var(--mui-palette-primary-main)' />,
    title: 'Laporan Keuangan',
    description:
      'Pantau pemasukan dan pengeluaran bisnis sewa Anda. Laporan keuangan otomatis untuk analisis dan pengambilan keputusan.'
  },
  {
    icon: <Document color='var(--mui-palette-primary-main)' />,
    title: 'Halaman Publikasi',
    description:
      'Tampilkan katalog aset sewa Anda secara online. Pelanggan dapat langsung melihat ketersediaan dan harga dari browser.'
  }
]

const UsefulFeature = () => {
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
    <section id='features' ref={ref} className='bg-backgroundPaper'>
      <div className={classnames('flex flex-col gap-12 pbs-12 pbe-[100px]', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center'>
          <Chip size='small' variant='tonal' color='primary' label='Fitur Unggulan' />
          <div className='flex flex-col items-center gap-y-1 justify-center flex-wrap'>
            <div className='flex items-center gap-x-2'>
              <Typography color='text.primary' variant='h4' className='text-center'>
                <span className='relative z-[1] font-extrabold'>
                  Semua yang Anda butuhkan
                  <img
                    src='/images/front-pages/landing-page/bg-shape.png'
                    alt='' aria-hidden='true'
                    className='absolute block-end-0 z-[1] bs-[40%] is-[125%] sm:is-[132%] -inline-start-[13%] sm:inline-start-[-19%] block-start-[17px]'
                  />
                </span>{' '}
                untuk bisnis sewa Anda
              </Typography>
            </div>
            <Typography className='text-center'>
              Platform lengkap untuk semua jenis bisnis sewa. Dari pencatatan aset dan penyewa hingga tagihan dan
              laporan keuangan, semua dalam satu sistem.
            </Typography>
          </div>
        </div>
        <div>
          <Grid container spacing={6}>
            {feature.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}>
                <div className='flex flex-col gap-2 justify-center items-center'>
                  {item.icon}
                  <Typography className='mbs-2' variant='h5'>
                    {item.title}
                  </Typography>
                  <Typography className='max-is-[364px] text-center'>{item.description}</Typography>
                </div>
              </Grid>
            ))}
          </Grid>
        </div>
      </div>
    </section>
  )
}

export default UsefulFeature
