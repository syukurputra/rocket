'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

export default function AuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const menusParam = searchParams.get('menus')

    if (accessToken && refreshToken) {
      // Store tokens to localStorage
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      // Store menus if provided
      if (menusParam) {
        try {
          const menus = JSON.parse(menusParam)
          localStorage.setItem('userMenus', JSON.stringify(menus))
          window.dispatchEvent(new Event('userMenusUpdated'))
        } catch (error) {
          console.error('Error parsing menus:', error)
        }
      }

      // Redirect to home
      router.replace('/home')
    } else {
      // If no tokens, redirect to login
      router.replace('/login')
    }
  }, [searchParams, router])

  return (
    <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center' minHeight='100vh' gap={2}>
      <CircularProgress size={60} />
      <Typography variant='body1' color='textSecondary'>
        Menyelesaikan login...
      </Typography>
    </Box>
  )
}
