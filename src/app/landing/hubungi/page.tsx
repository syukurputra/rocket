// Component Imports
import HubungiView from '@/src/views/front-pages/hubungi'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Hubungi Kami - Bantu Sewa',
  description: 'Hubungi tim Bantu Sewa melalui WhatsApp, email, atau kunjungi kantor kami.'
}

const HubungiPage = async () => {
  const mode = await getServerMode()
  return <HubungiView mode={mode} />
}

export default HubungiPage
