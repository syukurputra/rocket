export type CompanyClient = {
  id: string
  nama: string
  alamat?: string
  telepon?: string
  email?: string
  status: boolean
  createdAt: Date
  updatedAt: Date
}

export type CompanyFormData = {
  nama: string
  alamat?: string
  telepon?: string
  email?: string
  status?: boolean
}
