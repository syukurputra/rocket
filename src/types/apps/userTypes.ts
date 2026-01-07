export type UserClient = {
  id: string
  username: string
  email: string
  companyId: string | null
  roleId: string | null
  verifikasi: boolean
  status: boolean
  createdAt: Date
  updatedAt: Date
  company?: {
    id: string
    nama: string
  } | null
  role?: {
    id: string
    nama: string
    deskripsi: string | null
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
