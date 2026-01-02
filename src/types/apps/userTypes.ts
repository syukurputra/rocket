export type UserClient = {
  id: string
  username: string
  email: string
  verifikasi: boolean
  companyId: string | null
  roleId: string | null
  createdAt: Date
  updatedAt: Date
}

export type UserFormData = {
  username: string
  email: string
  password?: string
  isSuperAdmin?: boolean
  verifikasi?: boolean
  roleId?: string
}
