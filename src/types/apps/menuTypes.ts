export type MenuClient = {
  id: string
  nama: string
  keterangan?: string | null
  path?: string
  icon?: string
  urutan: number
  parentId?: string
  status: boolean
  companyId?: string
  createdAt: Date
  updatedAt: Date
  children?: MenuClient[]
}

export type MenuFormData = {
  nama: string
  keterangan?: string | null
  path?: string
  icon?: string
  urutan?: number
  parentId?: string
  status?: boolean
}

export type UserMenuAccess = {
  menu: MenuClient
}
