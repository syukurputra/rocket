'use client'

import { useEffect, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function PaymentFinishPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'unknown'>('unknown')

  const orderId = searchParams.get('order_id')
  const statusCode = searchParams.get('status_code')
  const transactionStatus = searchParams.get('transaction_status')

  useEffect(() => {
    // Determine payment status based on URL parameters
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      setPaymentStatus('success')
    } else if (transactionStatus === 'pending') {
      setPaymentStatus('pending')
    } else {
      setPaymentStatus('unknown')
    }

    setLoading(false)
  }, [transactionStatus])

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh' flexDirection='column' gap={2}>
        <CircularProgress size={60} />
        <Typography variant='body1' color='textSecondary'>
          Memproses pembayaran...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      display='flex'
      justifyContent='center'
      alignItems='center'
      minHeight='100vh'
      sx={{ backgroundColor: '#f5f5f5', padding: 3 }}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', padding: 4 }}>
          {paymentStatus === 'success' && (
            <>
              <Box sx={{ fontSize: 80, marginBottom: 2 }}>✅</Box>
              <Typography variant='h4' gutterBottom color='success.main' fontWeight='bold'>
                Pembayaran Berhasil!
              </Typography>
              <Typography variant='body1' color='textSecondary' sx={{ marginBottom: 3 }}>
                Terima kasih! Pembayaran Anda telah berhasil diproses.
              </Typography>
              {orderId && (
                <Box
                  sx={{
                    backgroundColor: '#f9f9f9',
                    padding: 2,
                    borderRadius: 2,
                    marginBottom: 3
                  }}
                >
                  <Typography variant='body2' color='textSecondary'>
                    Order ID
                  </Typography>
                  <Typography variant='body1' fontWeight='bold'>
                    {orderId}
                  </Typography>
                </Box>
              )}
              <Typography variant='body2' color='textSecondary' sx={{ marginBottom: 3 }}>
                Email konfirmasi telah dikirim ke alamat email Anda.
              </Typography>
            </>
          )}

          {paymentStatus === 'pending' && (
            <>
              <Box sx={{ fontSize: 80, marginBottom: 2 }}>⏳</Box>
              <Typography variant='h4' gutterBottom color='warning.main' fontWeight='bold'>
                Pembayaran Pending
              </Typography>
              <Typography variant='body1' color='textSecondary' sx={{ marginBottom: 3 }}>
                Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran sesuai instruksi yang diberikan.
              </Typography>
              {orderId && (
                <Box
                  sx={{
                    backgroundColor: '#f9f9f9',
                    padding: 2,
                    borderRadius: 2,
                    marginBottom: 3
                  }}
                >
                  <Typography variant='body2' color='textSecondary'>
                    Order ID
                  </Typography>
                  <Typography variant='body1' fontWeight='bold'>
                    {orderId}
                  </Typography>
                </Box>
              )}
              <Typography variant='body2' color='textSecondary' sx={{ marginBottom: 3 }}>
                Anda akan menerima email konfirmasi setelah pembayaran berhasil.
              </Typography>
            </>
          )}

          {paymentStatus === 'unknown' && (
            <>
              <Box sx={{ fontSize: 80, marginBottom: 2 }}>ℹ️</Box>
              <Typography variant='h4' gutterBottom color='info.main' fontWeight='bold'>
                Pembayaran Selesai
              </Typography>
              <Typography variant='body1' color='textSecondary' sx={{ marginBottom: 3 }}>
                Transaksi pembayaran Anda telah selesai. Silakan cek email Anda untuk konfirmasi.
              </Typography>
            </>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
            <Button variant='contained' color='primary' onClick={() => router.push('/')}>
              Kembali ke Beranda
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
