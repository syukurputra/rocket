import type { ChildrenType } from '@core/types'
import BlankLayout from '@layouts/BlankLayout'
import FrontLayout from '@components/layout/front-pages'
import ScrollToTop from '@core/components/scroll-to-top'
import Button from '@mui/material/Button'
import { IntersectionProvider } from '@/src/contexts/intersectionContext'
import { getSystemMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'Hubungi Kami — Bantuan & Kontak Bantu Sewa',
  description:
    'Butuh bantuan soal aplikasi manajemen sewa Bantu Sewa? Hubungi tim kami via WhatsApp +62 851-1054-4041, email support@bantusewa.com, atau kunjungi kantor kami di Tangerang.',
  alternates: { canonical: '/contact' }
}

const Layout = async ({ children }: ChildrenType) => {
  const systemMode = await getSystemMode()
  return (
    <BlankLayout systemMode={systemMode}>
      <IntersectionProvider>
        <FrontLayout>
          {children}
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

export default Layout
