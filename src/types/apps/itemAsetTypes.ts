export type ItemAsetImage = {
  id: string
  filename: string
  filepath: string
  filesize?: number
  mimetype?: string
  createdAt: Date | string
  ruanganId: string
}

export type ItemAsetClient = {
  id: string
  nama: string
  status: string
  images?: ItemAsetImage[]
}
