import type { ChildrenType } from '@core/types'
import { getSystemMode } from '@core/utils/serverHelpers'
import ClientProtection from '@/src/components/ClientProtection'

// Keep your existing imports
// import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
// import 'react-perfect-scrollbar/dist/css/styles.css'
import '@/src/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'Bantu Sewa',
  description: 'Dashboard with authentication protection'
}

const RootLayout = async (props: ChildrenType) => {
  const { children } = props

  // Keep your server-side logic
  const systemMode = await getSystemMode()
  const direction = 'ltr'

  return (
    <html id='__next' lang='en' dir={direction} suppressHydrationWarning>
    <body className='flex is-full min-bs-full flex-auto flex-col'>
    {/* Keep your server-side script */}
    {/* <InitColorSchemeScript attribute='data' defaultMode={systemMode} /> */}

    {/* Wrap children dengan client protection */}
    <ClientProtection>
      {children}
    </ClientProtection>
    </body>
    </html>
  )
}

export default RootLayout
