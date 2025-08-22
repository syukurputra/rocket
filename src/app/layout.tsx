// app/layout.tsx
import type { ReactNode } from 'react'
import { getSystemMode } from '@core/utils/serverHelpers'

// Keep your existing imports
import '@/src/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'Bantu Sewa',
  description: 'Platform rental management terpercaya'
}

interface RootLayoutProps {
  children: ReactNode
}

const RootLayout = async ({ children }: RootLayoutProps) => {
  // Get system mode for theming
  const systemMode = await getSystemMode()
  const direction = 'ltr'

  return (
    <html id='__next' lang='en' dir={direction} suppressHydrationWarning>
    <body className='flex is-full min-bs-full flex-auto flex-col'>
    {children}
    </body>
    </html>
  )
}

export default RootLayout
