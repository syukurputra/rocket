import { Suspense } from 'react'

import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import CheckoutView from '@views/apps/paket/checkout'

interface CheckoutPageProps {
  params: Promise<{ id: string }>
}

const CheckoutPage = async ({ params }: CheckoutPageProps) => {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <Box className='flex justify-center items-center' sx={{ minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      }
    >
      <CheckoutView paketId={id} />
    </Suspense>
  )
}

export default CheckoutPage
