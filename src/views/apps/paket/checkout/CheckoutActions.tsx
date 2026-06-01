'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

// Utils
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

interface CheckoutActionsProps {
  paketId: string
  billingCycle: 'monthly' | 'annually'
  onPrint: () => void
}

const CheckoutActions = ({ paketId, billingCycle, onPrint }: CheckoutActionsProps) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  const handleSubscribe = async () => {
    try {
      setLoading(true)

      const result = await apiFetchClient<{ data: { nomorInvoice: string; paymentUrl?: string }; message: string }>(
        '/api/invoice',
        {
          method: 'POST',
          body: JSON.stringify({ paketId, billingCycle })
        },
        { redirectOn401: '/login' }
      )

      showSnack(`Invoice ${result.data?.nomorInvoice || ''} berhasil dibuat! Silakan lakukan pembayaran.`)

      // Redirect to payment URL if available
      setTimeout(() => {
        if (result.data?.paymentUrl) {
          window.location.href = result.data.paymentUrl
        } else {
          router.push('/setting/invoice')
        }
      }, 1500)
    } catch (err) {
      console.error('Subscribe error:', err)
      const message = err instanceof Error ? err.message : 'Gagal membuat invoice'

      showSnack(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className='flex flex-col gap-4'>
          <Button
            fullWidth
            variant='contained'
            color='success'
            className='capitalize'
            startIcon={loading ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-check' />}
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Pembayaran'}
          </Button>

          <Button
            fullWidth
            color='secondary'
            variant='tonal'
            className='capitalize'
            startIcon={<i className='tabler-download' />}
            onClick={onPrint}
          >
            Download Invoice
          </Button>

          <div className='flex items-center gap-4'>
            <Button
              fullWidth
              color='secondary'
              variant='tonal'
              className='capitalize'
              startIcon={<i className='tabler-arrow-left' />}
              onClick={() => router.back()}
            >
              Kembali
            </Button>
          </div>

          <div className='flex flex-col gap-2 mt-2'>
            <div className='flex items-center gap-2'>
              <i className='tabler-shield-check text-success text-lg' />
              <Typography variant='caption' color='text.secondary'>
                Transaksi aman & terenkripsi
              </Typography>
            </div>
            <div className='flex items-center gap-2'>
              <i className='tabler-headset text-primary text-lg' />
              <Typography variant='caption' color='text.secondary'>
                Dukungan 24/7 tersedia
              </Typography>
            </div>
            <div className='flex items-center gap-2'>
              <i className='tabler-refresh text-warning text-lg' />
              <Typography variant='caption' color='text.secondary'>
                Dapat diubah kapan saja
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default CheckoutActions
