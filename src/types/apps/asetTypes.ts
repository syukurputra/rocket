export type AsetImage = {
  id: string
  filename: string
  filepath: string
  filesize?: number
  mimetype?: string
  createdAt: string
  asetId: string
}

export type AsetStatus = 'aktif' | 'non aktif' | 'publish'

export type AsetClient = {
  id: string
  jenis: string
  nama: string
  alamat: string
  kota: string
  provinsi: string
  latitude?: number
  longitude?: number
  status: AsetStatus
  images?: AsetImage[]
}
