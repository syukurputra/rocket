// Type Imports
import type { HorizontalMenuDataType } from '@/src/types/menuTypes'

const horizontalMenuData = (): HorizontalMenuDataType[] => [
  {
    label: 'Home',
    href: '/en/home',
    icon: 'tabler-smart-home'
  },
  {
    label: 'About',
    href: '/en/about',
    icon: 'tabler-info-circle'
  }
]

export default horizontalMenuData
