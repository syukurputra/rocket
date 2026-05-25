export type RuanganImage = {
  id: string
  filename: string
  filepath: string
  filesize?: number
  mimetype?: string
  createdAt: Date | string
  ruanganId: string
}

export type RuanganClient = {
  id: string
  nama: string
  status: string
  images?: RuanganImage[]
}
