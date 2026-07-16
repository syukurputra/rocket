'use client'

import { Suspense, useEffect, useRef } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import { apiFetchClient } from '@/src/utils/apiFetchClient'

const ChatStart = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const companyId = searchParams.get('companyId')
    const asetId = searchParams.get('asetId')

    // Bersihkan penanda pending (jika datang dari alur login)
    localStorage.removeItem('pendingChat')

    if (!companyId) {
      router.replace('/chat/saya')

      return
    }

    const start = async () => {
      try {
        const res = await apiFetchClient<{ data: { id: string } }>(`/api/chat/conversations`, {
          method: 'POST',
          body: JSON.stringify({ companyId, asetId: asetId || undefined })
        })

        router.replace(`/chat/saya?c=${res.data.id}`)
      } catch (err) {
        console.error('Start chat error:', err)
        router.replace('/chat/saya')
      }
    }

    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' minHeight='60vh' gap={2}>
      <CircularProgress size={48} />
      <Typography color='text.secondary'>Memulai percakapan...</Typography>
    </Box>
  )
}

const ChatStartPage = () => (
  <Suspense fallback={null}>
    <ChatStart />
  </Suspense>
)

export default ChatStartPage
