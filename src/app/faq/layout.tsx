// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import BlankLayout from '@layouts/BlankLayout'
import FrontLayout from '@components/layout/front-pages'
import ScrollToTop from '@core/components/scroll-to-top'
import Button from '@mui/material/Button'

// Context Imports
import { IntersectionProvider } from '@/src/contexts/intersectionContext'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'FAQ — Pertanyaan Umum Seputar Aplikasi Bantu Sewa',
  description:
    'Jawaban pertanyaan umum tentang Bantu Sewa: cara memulai, mengelola aset & penyewa, tagihan otomatis, pembayaran online, keamanan data, dan refund untuk bisnis sewa Anda.',
  alternates: { canonical: '/faq' }
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
