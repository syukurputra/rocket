'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

export default function PaymentUnfinishPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId = searchParams.get('order_id')

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
          <Box sx={{ fontSize: 80, marginBottom: 2 }}>⚠️</Box>

          <Typography variant='h4' gutterBottom color='warning.main' fontWeight='bold'>
            Pembayaran Belum Selesai
          </Typography>

          <Typography variant='body1' color='textSecondary' sx={{ marginBottom: 3 }}>
            Anda belum menyelesaikan proses pembayaran. Transaksi Anda dibatalkan.
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

          <Box
            sx={{
              backgroundColor: '#fff9e6',
              border: '1px solid #ffe082',
              borderRadius: 2,
              padding: 2,
              marginBottom: 3
            }}
          >
            <Typography variant='body2' color='textSecondary'>
              💡 <strong>Tips:</strong> Jika Anda mengalami kesulitan dalam pembayaran, silakan hubungi customer service
              kami untuk bantuan.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
            <Button variant='outlined' color='primary' onClick={() => router.back()}>
              Coba Lagi
            </Button>
            <Button variant='contained' color='primary' onClick={() => router.push('/')}>
              Kembali ke Beranda
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
