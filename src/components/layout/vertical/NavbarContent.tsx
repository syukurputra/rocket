'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import NavSearch from '@components/layout/shared/search'
import KeranjangButton from '@components/layout/shared/KeranjangButton'
import UserDropdown from '@components/layout/shared/UserDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const NavbarContent = () => {
  const pathname = usePathname()
  const [isAuth, setIsAuth] = useState<boolean | null>(null)

  useEffect(() => {
    setIsAuth(!!localStorage.getItem('accessToken'))
  }, [pathname])

  // Di /home tanpa login, header cuma berisi search (tombol Masuk/Daftar ada di sidebar)
  if (pathname === '/home' && !isAuth) {
    return (
      <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center is-full')}>
        <NavSearch />
      </div>
    )
  }

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
        <NavSearch />
      </div>
      <div className='flex items-center gap-2'>
        <KeranjangButton />
        <NotificationsDropdown />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
