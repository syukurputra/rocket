'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import classnames from 'classnames'
import type { SystemMode } from '@core/types'
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'
import themeConfig from '@configs/themeConfig'
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

const LoginIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 680,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const ForgotPassword = ({ mode }: { mode: SystemMode }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-forgot-password-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-forgot-password-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-forgot-password-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-forgot-password-light-border.png'

  const router = useRouter()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    if (!email.trim()) {
      setError('Email harus diisi')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setEmail('')
      } else {
        setError(data.message || 'Terjadi kesalahan')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {loading && (
        <Box
          position='fixed'
          top={0}
          left={0}
          right={0}
          bottom={0}
          display='flex'
          justifyContent='center'
          alignItems='center'
          bgcolor='rgba(255, 255, 255, 0.8)'
          zIndex={9999}
        >
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={2}
            bgcolor='white'
            padding={4}
            borderRadius={2}
            boxShadow={3}
          >
            <CircularProgress size={60} />
            <Typography variant='body1' color='textSecondary'>
              Mengirim email...
            </Typography>
          </Box>
        </Box>
      )}

      <div className='flex bs-full justify-center'>
        <div
          className={classnames(
            'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
            {
              'border-ie': settings.skin === 'bordered'
            }
          )}
        >
          <LoginIllustration src={characterIllustration} alt='character-illustration' />
          {!hidden && (
            <MaskImg
              alt='mask'
              src={authBackground}
              className={classnames({ 'scale-x-[-1]': theme.direction === 'rtl' })}
            />
          )}
        </div>
        <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
          <Link className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
            <div className='flex flex-col gap-1'>
              <Typography variant='h4'>Lupa Password? 🔒</Typography>
              <Typography>Masukkan email Anda dan kami akan mengirim instruksi untuk mereset password</Typography>
            </div>
            <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
              {error && <Alert severity='error'>{error}</Alert>}
              {success && (
                <Alert severity='success'>
                  Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.
                </Alert>
              )}
              <CustomTextField
                autoFocus
                fullWidth
                label='Email'
                placeholder='Masukkan email Anda'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                type='email'
              />
              <Button
                fullWidth
                variant='contained'
                type='submit'
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : null}
              >
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </Button>
              <Typography className='flex justify-center items-center' sx={{ mt: 2 }}>
                <Typography
                  component={Link}
                  href='/id/login'
                  color='primary.main'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <i className='tabler-chevron-left' />
                  Kembali ke Login
                </Typography>
              </Typography>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default ForgotPassword
