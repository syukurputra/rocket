'use client'

// React Imports
import { useRef, useState, useEffect } from 'react'
import type { MouseEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

const UserDropdown = () => {
  const [open, setOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const [user, setUser] = useState<{
    id: string
    username: string
    email: string
    role?: { nama: string } | null
  } | null>(null)

  const anchorRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const { settings } = useSettings()

  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user')
        const accessToken = localStorage.getItem('accessToken')

        if (userData) {
          try {
            const parsedUser = JSON.parse(userData)

            // If user data exists but doesn't have role, fetch from API
            if (!parsedUser.role) {
              if (accessToken) {
                try {
                  const response = await fetch('/api/auth/me', {
                    headers: {
                      Authorization: `Bearer ${accessToken}`
                    }
                  })

                  if (response.ok) {
                    const data = await response.json()

                    if (data.user) {
                      setUser(data.user)
                      localStorage.setItem('user', JSON.stringify(data.user))
                    }
                  } else {
                    setUser(parsedUser)
                  }
                } catch (error) {
                  setUser(parsedUser)
                }
              } else {
                setUser(parsedUser)
              }
            } else {
              setUser(parsedUser)
            }
          } catch (error) {
            console.error('UserDropdown - Error parsing user data:', error)
          }
        } else if (accessToken) {
          // If no user data in localStorage but has token, fetch from API
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            })

            if (response.ok) {
              const data = await response.json()

              if (data.user) {
                setUser(data.user)
                localStorage.setItem('user', JSON.stringify(data.user))
              }
            }
          } catch (error) {
            console.error('UserDropdown - Error fetching user data:', error)
          }
        } else {
          console.log('UserDropdown - No user data and no access token')
        }
      }
    }

    fetchUserData()
  }, [])

  const handleDropdownOpen = () => {
    !open ? setOpen(true) : setOpen(false)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (logoutLoading) return

    if (url) {
      router.push(url)
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const handleUserLogout = async () => {
    if (logoutLoading) return
    setLogoutLoading(true)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // ⬅️ kirim cookies httpOnly
        headers: { 'Cache-Control': 'no-store' }
      })
    } catch (e) {
      console.error('Logout failed:', e)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setOpen(false)
      router.replace('/login')
      setLogoutLoading(false)
    }
  }

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          ref={anchorRef}
          alt={user?.username || 'User'}
          src='/images/avatars/1.png'
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px]'
        />
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-6 gap-2' tabIndex={-1}>
                    <Avatar alt='John Doe' src='/images/avatars/1.png' />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {user?.email || 'Loading...'}
                      </Typography>
                      <Typography variant='caption'>{user?.role?.nama || 'Loading...'}</Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, '/my-profile')} disabled={logoutLoading}>
                    <i className='tabler-user' />
                    <Typography color='text.primary'>Akun Saya</Typography>
                  </MenuItem>
                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e)} disabled={logoutLoading}>
                    <i className='tabler-help-circle' />
                    <Typography color='text.primary'>FAQ</Typography>
                  </MenuItem>
                  <div className='flex items-center plb-2 pli-3'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={
                        logoutLoading ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-logout' />
                      }
                      onClick={handleUserLogout}
                      disabled={logoutLoading}
                      sx={{
                        '& .MuiButton-endIcon': { marginInlineStart: 1.5 },
                        opacity: logoutLoading ? 0.7 : 1
                      }}
                    >
                      {logoutLoading ? 'Logging out...' : 'Logout'}
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
