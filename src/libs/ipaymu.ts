import crypto from 'crypto'

export interface IpaymuPaymentParams {
  transactionId: string
  amount: number
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  product: string[]
  qty: string[]
  price: string[]
  description: string[]
  returnUrl: string
  cancelUrl: string
  notifyUrl: string
}

export interface IpaymuPaymentResponse {
  Status: number
  Success: boolean
  Message: string
  Data: {
    SessionID: string
    Url: string
  }
}

export async function createIpaymuPayment(params: IpaymuPaymentParams): Promise<IpaymuPaymentResponse> {
  const va = process.env.IPAYMU_VA
  const apiKey = process.env.IPAYMU_API_KEY
  const env = process.env.IPAYMU_ENV || 'sandbox'

  if (!va || !apiKey) {
    throw new Error('iPaymu credentials not configured')
  }

  const url = env === 'sandbox' 
    ? 'https://sandbox.ipaymu.com/api/v2/payment' 
    : 'https://my.ipaymu.com/api/v2/payment'

  const bodyData = {
    product: params.product,
    qty: params.qty,
    price: params.price,
    description: params.description,
    returnUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
    notifyUrl: params.notifyUrl,
    referenceId: params.transactionId,
    buyerName: params.buyerName,
    buyerEmail: params.buyerEmail,
    buyerPhone: params.buyerPhone,
    amount: params.amount // Optional but good for validation
  }

  const jsonBody = JSON.stringify(bodyData)

  // Generate Signature
  // Formula: HTTPMethod:VaNumber:Lowercase(SHA-256(RequestBody)):ApiKey
  const bodyHash = crypto.createHash('sha256').update(jsonBody).digest('hex').toLowerCase()
  const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`
  
  const signature = crypto
    .createHmac('sha256', apiKey)
    .update(stringToSign)
    .digest('hex')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'va': va,
      'signature': signature,
      'timestamp': new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '').replace(/:/g, '') // Format: 20191209 155701
    },
    body: jsonBody
  })

  const result = await response.json()

  if (!response.ok || !result.Success) {
    throw new Error(`iPaymu Payment Error: ${result.Message || 'Unknown error'}`)
  }

  return result
}

export async function checkIpaymuTransaction(transactionId: string): Promise<any> {
  const va = process.env.IPAYMU_VA
  const apiKey = process.env.IPAYMU_API_KEY
  const env = process.env.IPAYMU_ENV || 'sandbox'

  if (!va || !apiKey) {
    throw new Error('iPaymu credentials not configured')
  }

  const url = env === 'sandbox' 
    ? 'https://sandbox.ipaymu.com/api/v2/transaction' 
    : 'https://my.ipaymu.com/api/v2/transaction'

  const bodyData = { transactionId }
  const jsonBody = JSON.stringify(bodyData)

  const bodyHash = crypto.createHash('sha256').update(jsonBody).digest('hex').toLowerCase()
  const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`
  
  const signature = crypto
    .createHmac('sha256', apiKey)
    .update(stringToSign)
    .digest('hex')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'va': va,
      'signature': signature,
      'timestamp': new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '').replace(/:/g, '')
    },
    body: jsonBody
  })

  const result = await response.json()

  if (!response.ok || !result.Success) {
    throw new Error(`iPaymu Check Error: ${result.Message || 'Unknown error'}`)
  }

  return result
}
