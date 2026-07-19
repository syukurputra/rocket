'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Styled Custom Components
const RegisterIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 600,
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
  maxBlockSize: 345,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const useRegister = () => {
  const register = async (username: string, name: string, email: string, password: string, nomorTelepon: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, name, email, password, nomorTelepon })
      })

      const data = await response.json()

      if (response.ok) {
        window.location.href = '/login'

        return { success: true }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Login error:', error)

      return { success: false, message: 'Network error occurred' }
    }
  }

  return { register }
}

const Register = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nomorTelepon, setNomorTelepon] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useRegister()

  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-register-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-register-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-register-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-register-light-border.png'

  // Hooks
  const { lang: locale } = useParams()
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
      setError('Username is required')
      setLoading(false)

      return
    }

    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)

      return
    }

    if (!password.trim()) {
      setError('Password is required')
      setLoading(false)

      return
    }

    if (!nomorTelepon.trim()) {
      setError('Nomor telepon wajib diisi')
      setLoading(false)

      return
    }

    // Validate Indonesian phone format
    const phoneRegex = /^(\+62|62|08)[0-9]{8,12}$/

    if (!phoneRegex.test(nomorTelepon)) {
      setError('Format nomor telepon tidak valid. Gunakan format +62 atau 08')
      setLoading(false)

      return
    }

    try {
      const result = await register(username, name || username, email, password, nomorTelepon)

      if (!result.success) {
        setError(result.message || 'Register gagal')
      }
    } catch (error) {
      console.error('Register error:', error)
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
          sx={{
            bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)')
          }}
          zIndex={9999}
        >
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={2}
            sx={{
              bgcolor: theme => theme.palette.background.paper,
              padding: 4,
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <CircularProgress size={60} />
            <Typography variant='body1' color='textSecondary'>
              Memproses pendaftaran akun Anda...
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
          <RegisterIllustration src={characterIllustration} alt='character-illustration' />
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
            href='/'
            className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'
          >
            <Logo />
          </Link>
          <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
            <div className='flex flex-col gap-1'>
              <Typography variant='h4'>Daftar</Typography>
              <Typography>Masukkan detail Anda di bawah ini untuk membuat akun Anda</Typography>
            </div>
            <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-6'>
              {error && <div className='p-4 rounded-lg bg-red-50 border border-red-200 text-red-800'>{error}</div>}
              <CustomTextField
                autoFocus
                fullWidth
                label='Username'
                placeholder='Masukkan username'
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <CustomTextField
                fullWidth
                label='Nama Lengkap'
                placeholder='Masukkan nama lengkap'
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <CustomTextField
                fullWidth
                label='Email'
                placeholder='Masukkan email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <CustomTextField
                fullWidth
                label='Nomor Telepon'
                placeholder='Contoh: +6281234567890 atau 081234567890'
                value={nomorTelepon}
                onChange={e => setNomorTelepon(e.target.value)}
                required
                helperText='Format: +62 atau 08 diikuti 8-12 digit'
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
              <Button
                fullWidth
                variant='contained'
                type='submit'
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : null}
              >
                {loading ? 'Memproses...' : 'Buat Akun'}
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
                disabled={loading}
              >
                Daftar dengan Google
              </Button>
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>Sudah Punya Akun? </Typography>
                <Typography component={Link} href='/login' color='primary.main'>
                  Masuk
                </Typography>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default Register
