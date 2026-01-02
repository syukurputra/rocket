export type UserClient = {
  id: string
  username: string
  email: string
  verifikasi: boolean
  companyId: string | null
  roleId: string | null
  isSuperAdmin?: boolean
  createdAt: Date
  updatedAt: Date
  company?: {
    id: string
    nama: string
  } | null
  role?: {
    id: string
    nama: string
  } | null
}

export type UserFormData = {
  username: string
  email: string
  password?: string
  isSuperAdmin?: boolean
  verifikasi?: boolean
  roleId?: string
}
