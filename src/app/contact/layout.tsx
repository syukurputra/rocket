import type { ChildrenType } from '@core/types'
import BlankLayout from '@layouts/BlankLayout'
import FrontLayout from '@components/layout/front-pages'
import ScrollToTop from '@core/components/scroll-to-top'
import Button from '@mui/material/Button'
import { IntersectionProvider } from '@/src/contexts/intersectionContext'
import { getSystemMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'Hubungi Kami - Bantu Sewa',
  description: 'Hubungi tim Bantu Sewa melalui WhatsApp, email, atau kunjungi kantor kami.'
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
