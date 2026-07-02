// Component Imports
import SyaratKetentuanView from '@/src/views/front-pages/syarat-ketentuan'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Syarat dan Ketentuan - Bantu Sewa',
  description: 'Syarat dan ketentuan penggunaan platform Bantu Sewa.'
}

const SyaratKetentuanPage = async () => {
  const mode = await getServerMode()
  return <SyaratKetentuanView mode={mode} />
}

export default SyaratKetentuanPage
