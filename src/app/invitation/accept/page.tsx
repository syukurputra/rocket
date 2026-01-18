'use client'

import { useEffect, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'

import CustomTextField from '@core/components/mui/TextField'
import Logo from '@components/layout/shared/Logo'

type InvitationData = {
  email: string
  company: string
  role: string
}

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError('Link undangan tidak valid')
      setLoading(false)

      return
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/invitation/verify?token=${token}`)
        const data = await response.json()

        if (response.status === 503) {
          // API is disabled, show migration message
          setError(
            'Sistem undangan memerlukan migrasi database. Silakan hubungi administrator untuk menyelesaikan setup.'
          )
        } else if (response.ok) {
          setInvitationData(data.data)
        } else {
          setError(data.message || 'Undangan tidak valid atau sudah kedaluwarsa')
        }
      } catch (err) {
        setError('Gagal memverifikasi undangan')
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!username || !password || !confirmPassword) {
      setError('Semua field harus diisi')

      return
    }

    if (password !== confirmPassword) {
      setError('Password tidak cocok')

      return
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter')

      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username, password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)

        // Clear any existing auth tokens to prevent auto-login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('userMenus')

        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(data.message || 'Gagal mengaktifkan akun')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh' bgcolor='background.default'>
        <CircularProgress />
      </Box>
    )
  }

  if (success) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='100vh'
        bgcolor='background.default'
        p={3}
      >
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant='h4' color='success.main' gutterBottom>
              🎉 Akun Diaktifkan!
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ mt: 2 }}>
              Akun Anda telah berhasil diaktifkan.
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Mengarahkan ke halaman login...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (error && !invitationData) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='100vh'
        bgcolor='background.default'
        p={3}
      >
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Box display='flex' justifyContent='center' mb={3}>
              <Logo />
            </Box>
            <Alert severity='error' sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button fullWidth variant='contained' onClick={() => router.push('/login')}>
              Ke Halaman Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box
      display='flex'
      justifyContent='center'
      alignItems='center'
      minHeight='100vh'
      bgcolor='background.default'
      p={3}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box display='flex' justifyContent='center' mb={3}>
            <Logo />
          </Box>

          <Typography variant='h4' align='center' gutterBottom>
            Lengkapi Pendaftaran Anda
          </Typography>

          <Typography variant='body2' color='text.secondary' align='center' sx={{ mb: 4 }}>
            Anda telah diundang untuk bergabung dengan <strong>{invitationData?.company}</strong>
          </Typography>

          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              <strong>Email:</strong> {invitationData?.email}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              <strong>Perusahaan:</strong> {invitationData?.company}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              <strong>Role:</strong> {invitationData?.role}
            </Typography>
          </Box>

          {error && (
            <Alert severity='error' sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              label='Username'
              placeholder='Masukkan username Anda'
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              sx={{ mb: 3 }}
              helperText='3-50 karakter, huruf, angka, dan garis bawah saja'
            />

            <CustomTextField
              fullWidth
              label='Password'
              type={showPassword ? 'text' : 'password'}
              placeholder='Masukkan password Anda'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              helperText='Minimal 8 karakter'
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton edge='end' onClick={() => setShowPassword(!showPassword)}>
                      <i className={showPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <CustomTextField
              fullWidth
              label='Konfirmasi Password'
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder='Konfirmasi password Anda'
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              sx={{ mb: 4 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton edge='end' onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <i className={showConfirmPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button fullWidth variant='contained' type='submit' disabled={submitting}>
              {submitting ? (
                <div className='flex items-center gap-2'>
                  <CircularProgress size={24} />
                  <span>Mengaktifkan...</span>
                </div>
              ) : (
                'Aktifkan Akun'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
