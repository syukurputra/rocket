export type IconClient = {
  id: string
  nama: string
  jenis: string
  code: string
  color: string

  /** Kata kunci bahasa Indonesia untuk pencarian, dipisah koma */
  keyword?: string | null
}
