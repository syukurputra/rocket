export type AsetStatus = 'Paid' | string

export type AsetLayoutProps = {
  id: string | undefined
}

export type AsetClientType = {
  name: string
  address: string
  company: string
  country: string
  contact: string
  companyEmail: string
}

export type AsetType = {
  id: string
  name: string
  total: number
  avatar: string
  service: string
  dueDate: string
  address: string
  company: string
  country: string
  contact: string
  avatarColor?: string
  issuedDate: string
  companyEmail: string
  balance: string | number
  asetStatus: AsetStatus
}

export type AsetPaymentType = {
  iban: string
  totalDue: string
  bankName: string
  country: string
  swiftCode: string
}

export type SingleAsetType = {
  aset: AsetType
  paymentDetails: AsetPaymentType
}
