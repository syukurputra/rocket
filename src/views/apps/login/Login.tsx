'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import { useAuth } from '@/src/contexts/AuthContext'

// Styled Custom Components
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
  },
  [theme.breakpoints.down('md')]: {
    maxBlockSize: 400
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

const Login = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()

  // Check if user already has valid token
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')

    if (accessToken) {
      // Redirect to home if token exists
      window.location.href = '/home'
    }
  }, [])

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
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

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!username.trim()) {
      setError('Username or email is required')
      setLoading(false)

      return
    }

    if (!password.trim()) {
      setError('Password is required')
      setLoading(false)

      return
    }

    try {
      const result = await login(username, password)

      if (!result.success) {
        setError(result.message || 'Login failed')
      }

      // If success, login function handles navigation
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred')
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
              Memproses login...
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
          <Link
            href='/landing'
            className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'
          >
            <Logo />
          </Link>
          <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
            <div className='flex flex-col gap-1'>
              <Typography variant='h4'>Selamat Datang Kembali</Typography>
              <Typography>Masuk ke akun Anda di bawah ini</Typography>
            </div>
            <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
              {error && <div className='p-4 rounded-lg bg-red-50 border border-red-200 text-red-800'>{error}</div>}
              <CustomTextField
                autoFocus
                fullWidth
                label='Email or Username'
                placeholder='Masukkan email atau username'
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <CustomTextField
                fullWidth
                label='Kata Sandi'
                placeholder='············'
                type={isPasswordShown ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                          <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
              <div className='flex justify-end items-center gap-x-3 gap-y-1 flex-wrap'>
                <Typography className='text-end' color='primary.main' component={Link} href='/forgot-password'>
                  Lupa password?
                </Typography>
              </div>
              <Button
                fullWidth
                variant='contained'
                type='submit'
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : null}
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </Button>
              <div className='flex items-center gap-2'>
                <Divider className='flex-grow' />
                <Typography variant='caption' color='textSecondary'>
                  atau
                </Typography>
                <Divider className='flex-grow' />
              </div>
              <Button
                fullWidth
                variant='outlined'
                color='secondary'
                startIcon={<i className='tabler-brand-google-filled' />}
                onClick={() => (window.location.href = '/api/auth/google')}
                type='button'
              >
                Masuk dengan Google
              </Button>
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>Belum Punya Akun? </Typography>
                <Typography component={Link} href='/register' color='primary.main'>
                  Daftar disini
                </Typography>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
