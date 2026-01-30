// Component Imports
import LandingPageWrapper from '@/src/views/front-pages/landing'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

// Force dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const dynamicParams = true

const LandingPage = async () => {
  // Vars
  const mode = await getServerMode()

  return <LandingPageWrapper mode={mode} />
}

export default LandingPage
