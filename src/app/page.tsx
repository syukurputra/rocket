// MUI Imports
import Button from '@mui/material/Button'

// Context Imports
import { IntersectionProvider } from '@/src/contexts/intersectionContext'

// Component Imports
import BlankLayout from '@layouts/BlankLayout'
import FrontLayout from '@components/layout/front-pages'
import ScrollToTop from '@core/components/scroll-to-top'
import LandingPageWrapper from '@/src/views/front-pages/landing'

// Util Imports
import { getServerMode, getSystemMode } from '@core/utils/serverHelpers'

// Force dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bantusewa.com'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Bantu Sewa',
      url: siteUrl,
      logo: `${siteUrl}/images/bantu-sewa/Logo_Bantu_Sewa_HD_2000.png`,
      email: 'support@bantusewa.com',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+62-856-4334-4041',
        contactType: 'customer support',
        areaServed: 'ID',
        availableLanguage: ['Indonesian']
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Aryana Karawaci Cluster Flora Blok E6-08',
        addressLocality: 'Kabupaten Tangerang',
        addressRegion: 'Banten',
        addressCountry: 'ID'
      }
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'Bantu Sewa',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: siteUrl,
      description:
        'Aplikasi manajemen bisnis sewa untuk properti, kendaraan, peralatan, dan perlengkapan acara. Kelola aset & penyewa, jadwal sewa, tagihan otomatis, dan pembayaran online dalam satu dashboard.',
      publisher: { '@id': `${siteUrl}/#organization` },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'IDR',
        description: 'Coba gratis'
      }
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Apa itu Bantu Sewa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Bantu Sewa adalah platform manajemen bisnis sewa yang membantu pemilik usaha mengelola aset, unit/item, penyewa, jadwal sewa, tagihan, dan pembayaran secara digital dalam satu dashboard.'
          }
        },
        {
          '@type': 'Question',
          name: 'Apakah data penyewa dan pembayaran aman?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya, semua data disimpan dengan enkripsi dan hanya dapat diakses oleh akun yang berwenang menggunakan infrastruktur cloud yang andal.'
          }
        },
        {
          '@type': 'Question',
          name: 'Apakah Bantu Sewa bisa digunakan untuk berbagai jenis sewa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya, Bantu Sewa fleksibel untuk berbagai bisnis sewa: properti (kos, kontrakan, apartemen, ruko), kendaraan, peralatan, hingga perlengkapan acara.'
          }
        },
        {
          '@type': 'Question',
          name: 'Bagaimana cara menghubungi tim support Bantu Sewa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Hubungi tim kami melalui WhatsApp +62 856-4334-4041 atau email support@bantusewa.com pada hari kerja pukul 08.00–17.00 WIB.'
          }
        }
      ]
    }
  ]
}

const HomePage = async () => {
  const systemMode = await getSystemMode()
  const mode = await getServerMode()

  return (
    <BlankLayout systemMode={systemMode}>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <IntersectionProvider>
        <FrontLayout>
          <LandingPageWrapper mode={mode} />
          <ScrollToTop className='mui-fixed'>
            <Button
              variant='contained'
              className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'
            >
              <i className='tabler-arrow-up' />
            </Button>
          </ScrollToTop>
        </FrontLayout>
      </IntersectionProvider>
    </BlankLayout>
  )
}

export default HomePage
