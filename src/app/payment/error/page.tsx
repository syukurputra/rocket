'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

export default function PaymentErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId = searchParams.get('order_id')
  const statusMessage = searchParams.get('status_message')

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
          <Box sx={{ fontSize: 80, marginBottom: 2 }}>❌</Box>

          <Typography variant='h4' gutterBottom color='error.main' fontWeight='bold'>
            Pembayaran Gagal
          </Typography>

          <Typography variant='body1' color='textSecondary' sx={{ marginBottom: 3 }}>
            Maaf, terjadi kesalahan saat memproses pembayaran Anda.
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

          {statusMessage && (
            <Box
              sx={{
                backgroundColor: '#ffebee',
                border: '1px solid #ef5350',
                borderRadius: 2,
                padding: 2,
                marginBottom: 3
              }}
            >
              <Typography variant='body2' color='error.main'>
                <strong>Pesan Error:</strong> {statusMessage}
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              backgroundColor: '#e3f2fd',
              border: '1px solid #90caf9',
              borderRadius: 2,
              padding: 2,
              marginBottom: 3
            }}
          >
            <Typography variant='body2' color='textSecondary' sx={{ marginBottom: 1 }}>
              <strong>Kemungkinan Penyebab:</strong>
            </Typography>
            <Typography variant='body2' color='textSecondary' component='div' textAlign='left'>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Saldo atau limit kartu tidak mencukupi</li>
                <li>Informasi pembayaran tidak valid</li>
                <li>Transaksi ditolak oleh bank</li>
                <li>Koneksi internet terputus</li>
              </ul>
            </Typography>
          </Box>

          <Typography variant='body2' color='textSecondary' sx={{ marginBottom: 3 }}>
            Silakan coba lagi atau hubungi customer service kami jika masalah berlanjut.
          </Typography>

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
