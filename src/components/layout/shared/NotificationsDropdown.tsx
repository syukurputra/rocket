'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'

import type { ThemeColor } from '@core/types'
import CustomAvatar from '@core/components/mui/Avatar'
import { useSettings } from '@core/hooks/useSettings'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type NotificationItem = {
  id: string
  title: string
  subtitle: string
  time: string
  read: boolean
  avatarIcon?: string | null
  avatarColor?: ThemeColor | null
  type: string
  url?: string | null
  createdAt: string
}

const timeAgo = (isoString: string) => {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`

  return new Date(isoString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

const ScrollWrapper = ({ children, hidden }: { children: ReactNode; hidden: boolean }) => {
  if (hidden) return <div className='overflow-x-hidden bs-full'>{children}</div>

  return (
    <PerfectScrollbar className='bs-full' options={{ wheelPropagation: false, suppressScrollX: true }}>
      {children}
    </PerfectScrollbar>
  )
}

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const anchorRef = useRef<HTMLButtonElement>(null)
  const popperRef = useRef<HTMLDivElement | null>(null)

  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  const { settings } = useSettings()

  const allRead = notifications.length > 0 && notifications.every(n => n.read)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)

      const res = await apiFetchClient<{ data: NotificationItem[]; unreadCount: number }>(
        '/api/notifikasi',
        undefined,
        { redirectOn401: false }
      )

      setNotifications(res.data || [])
      setUnreadCount(res.unreadCount ?? 0)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  useEffect(() => {
    const adjustHeight = () => {
      if (popperRef.current) {
        popperRef.current.style.height = `${Math.min(window.innerHeight - 100, 550)}px`
      }
    }

    window.addEventListener('resize', adjustHeight)

    return () => window.removeEventListener('resize', adjustHeight)
  }, [])

  const markRead = async (e: MouseEvent<HTMLElement>, item: NotificationItem, value: boolean) => {
    e.stopPropagation()
    setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, read: value } : n)))
    setUnreadCount(prev => Math.max(0, prev + (value ? -1 : 1)))

    try {
      await apiFetchClient(`/api/notifikasi/${item.id}`, { method: 'PATCH', body: JSON.stringify({ read: value }) }, { redirectOn401: false })
    } catch {
      // revert on fail
      setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, read: !value } : n)))
      setUnreadCount(prev => Math.max(0, prev + (value ? 1 : -1)))
    }
  }

  const removeNotification = async (e: MouseEvent<HTMLElement>, item: NotificationItem) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== item.id))
    if (!item.read) setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      await apiFetchClient(`/api/notifikasi/${item.id}`, { method: 'DELETE' }, { redirectOn401: false })
    } catch {
      fetchNotifications()
    }
  }

  const toggleReadAll = async () => {
    if (allRead) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)

    try {
      await apiFetchClient('/api/notifikasi/read-all', { method: 'PATCH' }, { redirectOn401: false })
    } catch {
      fetchNotifications()
    }
  }

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.read) {
      setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, read: true } : n)))
      setUnreadCount(prev => Math.max(0, prev - 1))
      apiFetchClient(`/api/notifikasi/${item.id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) }, { redirectOn401: false }).catch(() => {})
    }

    if (item.url) {
      setOpen(false)
      router.push(item.url)
    }
  }

  return (
    <>
      <IconButton ref={anchorRef} onClick={() => setOpen(prev => !prev)} className='text-textPrimary'>
        <Badge
          color='error'
          badgeContent={unreadCount}
          max={99}
          invisible={unreadCount === 0}
          sx={{
            // Dibuat kecil dan digeser keluar supaya tidak menutupi ikon lonceng
            '& .MuiBadge-badge': {
              height: 16,
              minWidth: 16,
              paddingInline: '4px',
              fontSize: '0.625rem',
              lineHeight: 1,
              transform: 'translate(60%, -40%)',
              boxShadow: 'var(--mui-palette-background-paper) 0px 0px 0px 2px'
            }
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <i className='tabler-bell' />
        </Badge>
      </IconButton>

      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        ref={popperRef}
        anchorEl={anchorRef.current}
        {...(isSmallScreen
          ? {
              className: 'is-full !mbs-3 z-[1] max-bs-[550px] bs-[550px]',
              modifiers: [{ name: 'preventOverflow', options: { padding: 16 } }]
            }
          : { className: 'is-96 !mbs-3 z-[1] max-bs-[550px] bs-[550px]' })}
      >
        {({ TransitionProps, placement }) => (
          <Fade {...TransitionProps} style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}>
            <Paper className={classnames('bs-full', settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg')}>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <div className='bs-full flex flex-col'>
                  {/* Header */}
                  <div className='flex items-center justify-between plb-3.5 pli-4 is-full gap-2'>
                    <Typography variant='h6' className='flex-auto'>
                      Notifikasi
                    </Typography>
                    {unreadCount > 0 && (
                      <Chip size='small' variant='tonal' color='primary' label={`${unreadCount} Baru`} />
                    )}
                    <Tooltip title='Lihat semua notifikasi'>
                      <Button
                        size='small'
                        variant='text'
                        color='primary'
                        sx={{ minWidth: 'unset', fontSize: '0.75rem', px: 1 }}
                        onClick={() => { setOpen(false); router.push('/notifikasi') }}
                      >
                        Semua Notif
                      </Button>
                    </Tooltip>
                    {notifications.length > 0 && (
                      <Tooltip title={allRead ? 'Sudah semua dibaca' : 'Tandai semua sudah dibaca'}>
                        <span>
                          <IconButton size='small' onClick={toggleReadAll} className='text-textPrimary' disabled={allRead}>
                            <i className={allRead ? 'tabler-mail' : 'tabler-mail-opened'} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </div>
                  <Divider />

                  {/* Body */}
                  <ScrollWrapper hidden={hidden}>
                    {loading ? (
                      <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
                        <CircularProgress size={32} />
                      </Box>
                    ) : notifications.length === 0 ? (
                      <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' minHeight='200px' gap={1}>
                        <i className='tabler-bell-off text-4xl text-textDisabled' />
                        <Typography variant='body2' color='text.secondary'>
                          Tidak ada notifikasi
                        </Typography>
                      </Box>
                    ) : (
                      notifications.map((n, index) => (
                        <div
                          key={n.id}
                          className={classnames('flex plb-3 pli-4 gap-3 cursor-pointer hover:bg-actionHover group', {
                            'border-be': index !== notifications.length - 1,
                            'bg-actionSelected': !n.read
                          })}
                          onClick={() => handleItemClick(n)}
                        >
                          <CustomAvatar color={(n.avatarColor as ThemeColor) ?? 'primary'} skin='light-static'>
                            <i className={n.avatarIcon ?? 'tabler-bell'} />
                          </CustomAvatar>
                          <div className='flex flex-col flex-auto'>
                            <Typography variant='body2' className='font-medium mbe-1' color='text.primary'>
                              {n.title}
                            </Typography>
                            <Typography variant='caption' color='text.secondary' className='mbe-2'>
                              {n.subtitle}
                            </Typography>
                            <Typography variant='caption' color='text.disabled'>
                              {timeAgo(n.createdAt)}
                            </Typography>
                          </div>
                          <div className='flex flex-col items-end gap-2'>
                            <Badge
                              variant='dot'
                              color={n.read ? 'secondary' : 'primary'}
                              onClick={e => markRead(e, n, !n.read)}
                              className={classnames('mbs-1 mie-1', { 'invisible group-hover:visible': n.read })}
                            />
                            <i
                              className='tabler-x text-xl invisible group-hover:visible'
                              onClick={e => removeNotification(e, n)}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </ScrollWrapper>

                  <Divider />
                  <div className='p-4'>
                    <Button fullWidth variant='tonal' size='small' onClick={() => { setOpen(false); fetchNotifications() }} startIcon={<i className='tabler-refresh' />}>
                      Refresh
                    </Button>
                  </div>
                </div>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default NotificationsDropdown
