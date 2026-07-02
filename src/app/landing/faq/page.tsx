// Component Imports
import FaqView from '@/src/views/front-pages/faq'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'FAQ - Bantu Sewa',
  description: 'Pertanyaan yang sering diajukan seputar Bantu Sewa.'
}

const FaqPage = async () => {
  const mode = await getServerMode()
  return <FaqView mode={mode} />
}

export default FaqPage
