import { Suspense } from 'react'

import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import InvoicePreview from '@views/apps/invoice/preview'

interface InvoicePreviewPageProps {
  params: Promise<{ id: string }>
}

const InvoicePreviewPage = async ({ params }: InvoicePreviewPageProps) => {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <Box className='flex justify-center items-center' sx={{ minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      }
    >
      <InvoicePreview invoiceId={id} />
    </Suspense>
  )
}

export default InvoicePreviewPage
