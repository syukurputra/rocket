// MUI Imports
import Button from '@mui/material/Button'

// Type Imports
import type { ChildrenType } from '@core/types'

// Context Imports
import { IntersectionProvider } from '@/src/contexts/intersectionContext'

// Component Imports
import BlankLayout from '@layouts/BlankLayout'
import FrontLayout from '@components/layout/front-pages'
import ScrollToTop from '@core/components/scroll-to-top'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'Bantu Sewa - Landing Page',
  description: 'Platform manajemen properti sewa'
}

const Layout = async ({ children }: ChildrenType) => {
  // Vars
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
