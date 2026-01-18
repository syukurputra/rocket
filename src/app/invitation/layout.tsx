// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import BlankLayout from '@layouts/BlankLayout'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'Accept Invitation - Bantu Sewa',
  description: 'Complete your registration'
}

const Layout = async ({ children }: ChildrenType) => {
  // Vars
  const systemMode = await getSystemMode()

  return <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
}

export default Layout
