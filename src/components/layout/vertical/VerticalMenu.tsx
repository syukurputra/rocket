'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, SubMenu, MenuItem } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

type UserMenu = {
  id: string
  nama: string
  path: string | null
  icon: string | null
  urutan: number
  parentId: string | null
  children?: UserMenu[]
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const pathname = usePathname()
  const [userMenus, setUserMenus] = useState<UserMenu[]>([])

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  // Load menus from localStorage on mount
  // Load menus from localStorage on mount and listen for updates
  useEffect(() => {
    const loadMenus = () => {
      const menusData = localStorage.getItem('userMenus')

      if (menusData) {
        try {
          const menus = JSON.parse(menusData) as UserMenu[]

          setUserMenus(menus)
        } catch (error) {
          console.error('Failed to parse user menus:', error)
          setUserMenus([])
        }
      }
    }

    // Initial load
    loadMenus()

    // Listen for updates
    const handleMenuUpdate = () => loadMenus()

    window.addEventListener('userMenusUpdated', handleMenuUpdate)

    return () => {
      window.removeEventListener('userMenusUpdated', handleMenuUpdate)
    }
  }, [])

  // Build menu tree from flat array
  const buildMenuTree = (menus: UserMenu[]): UserMenu[] => {
    const menuMap = new Map<string, UserMenu>()
    const roots: UserMenu[] = []

    // Create map with children array
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] })
    })

    // Build tree structure
    menus.forEach(menu => {
      const menuWithChildren = menuMap.get(menu.id)!

      if (menu.parentId) {
        // Submenu: hanya tampil jika parent-nya juga dimiliki user.
        // Jika parent tidak ada (yatim), submenu tidak ditampilkan (bukan jadi menu root).
        if (menuMap.has(menu.parentId)) {
          menuMap.get(menu.parentId)!.children!.push(menuWithChildren)
        }
      } else {
        roots.push(menuWithChildren)
      }
    })

    return roots
  }

  // Check if any child menu is active
  const isChildActive = (menu: UserMenu): boolean => {
    // IMPORTANT: Check children first (for parent menus without path like "Setting")
    if (menu.children && menu.children.length > 0) {
      if (menu.children.some(child => isChildActive(child))) {
        return true
      }
    }

    // If menu has no path, return false (children check above already handled it)
    if (!menu.path) {
      return false
    }

    // Direct path match
    if (pathname === menu.path) {
      return true
    }

    // Check if pathname starts with menu path (for nested routes)
    // This makes menu active for routes like /penyewa/list, /penyewa/add, /penyewa/edit/[id]
    if (pathname.startsWith(menu.path)) {
      return true
    }

    // Also check if pathname starts with the base path (without /list suffix)
    // For example, if menu.path is '/penyewa/list', also match '/penyewa/*'
    const basePath = menu.path.replace(/\/(list|add|edit|view).*$/, '')

    // Check if basePath is different from original path and pathname starts with basePath
    if (basePath !== menu.path && pathname.startsWith(basePath + '/')) {
      return true
    }

    return false
  }

  // Render single menu item (recursive for children)
  const renderMenu = (menu: UserMenu): React.ReactNode => {
    // If menu has children, render as SubMenu
    if (menu.children && menu.children.length > 0) {
      // Hitung sinkron saat render agar submenu aktif langsung terbuka ketika load
      const shouldBeOpen = isChildActive(menu)

      return (
        <SubMenu
          key={`${menu.id}-${shouldBeOpen ? 'open' : 'closed'}`}
          label={menu.nama}
          icon={menu.icon ? <i className={menu.icon} /> : undefined}
          defaultOpen={shouldBeOpen}
          disabled={false}
        >
          {menu.children.map(child => renderMenu(child))}
        </SubMenu>
      )
    }

    // Render as regular MenuItem
    // Extract base path for activeUrl (e.g., /penyewa/list -> /penyewa)
    const basePath = menu.path ? menu.path.replace(/\/(list|add|edit|view).*$/, '') : ''

    return (
      <MenuItem
        key={menu.id}
        href={menu.path ? menu.path : '#'}
        icon={menu.icon ? <i className={menu.icon} /> : <i className='tabler-circle' />}
        exactMatch={false}
        activeUrl={basePath}
      >
        {menu.nama}
      </MenuItem>
    )
  }

  // Render menu items dynamically
  const renderMenuItems = () => {
    // Build tree and render
    const menuTree = buildMenuTree(userMenus)

    return menuTree.map(menu => renderMenu(menu))
  }

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        {renderMenuItems()}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
