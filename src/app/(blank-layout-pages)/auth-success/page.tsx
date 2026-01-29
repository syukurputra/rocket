'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import PhoneNumberModal from '@/src/components/dialogs/auth/PhoneNumberModal'

export default function AuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const menusParam = searchParams.get('menus')
    const needsPhone = searchParams.get('needsPhone') === 'true'

    if (token && refreshToken) {
      setAccessToken(token)

      if (needsPhone) {
        // Show phone number modal
        setShowPhoneModal(true)
      } else {
        // Store tokens and redirect
        completeLogin(token, refreshToken, menusParam)
      }
    } else {
      // If no tokens, redirect to login
      router.replace('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const completeLogin = (token: string, refreshToken: string, menusParam: string | null) => {
    // Store tokens to localStorage
    localStorage.setItem('accessToken', token)
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
  }

  const handlePhoneSubmit = async (phoneNumber: string) => {
    if (!accessToken) return

    try {
      const response = await fetch('/api/auth/update-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ nomorTelepon: phoneNumber })
      })

      if (response.ok) {
        // Phone number saved, complete login
        const refreshToken = searchParams.get('refreshToken')
        const menusParam = searchParams.get('menus')

        if (refreshToken) {
          completeLogin(accessToken, refreshToken, menusParam)
        }
      } else {
        const data = await response.json()

        throw new Error(data.message || 'Failed to save phone number')
      }
    } catch (error) {
      console.error('Error saving phone number:', error)
      throw error
    }
  }

  return (
    <>
      <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center' minHeight='100vh' gap={2}>
        <CircularProgress size={60} />
        <Typography variant='body1' color='textSecondary'>
          Menyelesaikan login...
        </Typography>
      </Box>
      <PhoneNumberModal open={showPhoneModal} onSubmit={handlePhoneSubmit} />
    </>
  )
}
