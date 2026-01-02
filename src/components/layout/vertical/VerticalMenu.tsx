'use client'

// React Imports
import { useEffect, useState } from 'react'

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
  permissions: {
    canCreate: boolean
    canRead: boolean
    canUpdate: boolean
    canDelete: boolean
  }
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
  const [userMenus, setUserMenus] = useState<UserMenu[]>([])

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  // Load menus from localStorage on mount
  useEffect(() => {
    const menusData = localStorage.getItem('userMenus')

    if (menusData) {
      try {
        const menus = JSON.parse(menusData) as UserMenu[]

        setUserMenus(menus)
      } catch (error) {
        console.error('Failed to parse user menus:', error)
      }
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

      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parent = menuMap.get(menu.parentId)!

        parent.children!.push(menuWithChildren)
      } else {
        roots.push(menuWithChildren)
      }
    })

    return roots
  }

  // Render single menu item (recursive for children)
  const renderMenu = (menu: UserMenu): React.ReactNode => {
    // Check read permission
    if (!menu.permissions.canRead) return null

    // If menu has children, render as SubMenu
    if (menu.children && menu.children.length > 0) {
      return (
        <SubMenu key={menu.id} label={menu.nama} icon={menu.icon ? <i className={menu.icon} /> : undefined}>
          {menu.children.map(child => renderMenu(child))}
        </SubMenu>
      )
    }

    // Render as regular MenuItem
    return (
      <MenuItem
        key={menu.id}
        href={menu.path ? `/id${menu.path}` : '#'}
        icon={menu.icon ? <i className={menu.icon} /> : <i className='tabler-circle' />}
      >
        {menu.nama}
      </MenuItem>
    )
  }

  // Render menu items dynamically
  const renderMenuItems = () => {
    if (userMenus.length === 0) {
      // Fallback to default menu if no user menus
      return (
        <>
          <MenuItem href='/id/home' icon={<i className='tabler-smart-home' />}>
            Home
          </MenuItem>
          <MenuItem href='/id/aset/list' icon={<i className='tabler-home-dollar' />}>
            Aset
          </MenuItem>
          <MenuItem href='/id/keuangan/list' icon={<i className='tabler-chart-histogram' />}>
            Keuangan
          </MenuItem>
          <MenuItem href='/id/penghuni/list' icon={<i className='tabler-friends' />}>
            Penghuni
          </MenuItem>
        </>
      )
    }

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
