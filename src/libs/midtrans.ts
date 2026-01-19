import midtransClient from 'midtrans-client'

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
})

export interface MidtransTransactionParams {
  orderId: string
  grossAmount: number
  customerDetails: {
    first_name: string
    email: string
    phone?: string
  }
  itemDetails: {
    id: string
    price: number
    quantity: number
    name: string
  }[]
}

export interface MidtransTransactionResult {
  token: string
  redirect_url: string
}

/**
 * Create Midtrans Snap transaction
 * @param params Transaction parameters
 * @returns Snap token and redirect URL
 */
export async function createMidtransTransaction(params: MidtransTransactionParams): Promise<MidtransTransactionResult> {
  try {
    const parameter = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount
      },
      customer_details: params.customerDetails,
      item_details: params.itemDetails,
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/finish`
      }
    }

    const transaction = await snap.createTransaction(parameter)

    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url
    }
  } catch (error) {
    console.error('Midtrans transaction creation error:', error)
    throw new Error('Failed to create payment transaction')
  }
}

/**
 * Verify Midtrans notification signature
 * @param orderId Order ID
 * @param statusCode Status code
 * @param grossAmount Gross amount
 * @param signatureKey Signature key from notification
 * @returns Whether signature is valid
 */
export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const crypto = require('crypto')
  const serverKey = process.env.MIDTRANS_SERVER_KEY || ''

  const hash = crypto.createHash('sha512').update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest('hex')

  return hash === signatureKey
}

export default snap
