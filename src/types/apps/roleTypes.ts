export type RoleClient = {
  id: string
  nama: string
  deskripsi: string | null
  status: boolean
  companyId: string | null
  createdAt: Date
  updatedAt: Date
}

export type RoleFormData = {
  nama: string
  deskripsi?: string
  status?: boolean
}

export type RoleMenuClient = {
  id: string
  roleId: string
  menuId: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
  createdAt: Date
  updatedAt: Date
}

export type RoleMenuFormData = {
  menuId: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}
