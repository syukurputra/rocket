import ContactView from '@/src/views/front-pages/contact'
import { getServerMode } from '@core/utils/serverHelpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ContactPage = async () => {
  const mode = await getServerMode()
  return <ContactView mode={mode} />
}

export default ContactPage
