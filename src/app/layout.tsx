// Next Imports
import type { Metadata, Viewport } from 'next'

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import SchedulerInit from '../components/SchedulerInit'
import Providers from '@components/Providers'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/src/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bantusewa.com'
const ogImage = '/images/bantu-sewa/Logo_Bantu_Sewa_HD_2000.png'

const defaultTitle = 'Bantu Sewa — Aplikasi Manajemen Bisnis Sewa Properti, Kendaraan & Peralatan'
const defaultDescription =
  'Kelola bisnis sewa dalam satu dashboard: properti, kendaraan, peralatan, hingga perlengkapan acara. Catat aset & penyewa, jadwal sewa, tagihan otomatis, dan pembayaran online. Coba gratis.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: '%s | Bantu Sewa'
  },
  description: defaultDescription,
  applicationName: 'Bantu Sewa',
  keywords: [
    'aplikasi manajemen sewa',
    'software rental',
    'aplikasi rental properti',
    'aplikasi rental mobil',
    'manajemen sewa kendaraan',
    'aplikasi sewa alat',
    'manajemen rental peralatan',
    'aplikasi sewa perlengkapan acara',
    'tagihan sewa otomatis',
    'pembayaran sewa online',
    'Bantu Sewa'
  ],
  authors: [{ name: 'Bantu Sewa' }],
  creator: 'Bantu Sewa',
  publisher: 'Bantu Sewa',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: siteUrl,
    siteName: 'Bantu Sewa',
    title: defaultTitle,
    description: defaultDescription,
    images: [{ url: ogImage, width: 2000, height: 2000, alt: 'Bantu Sewa' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImage]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
}

const RootLayout = async ({ children }: ChildrenType) => {
  // Vars
  const systemMode = await getSystemMode()

  return (
    <html id='__next' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        <SchedulerInit />
        <Providers direction='ltr'>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout
