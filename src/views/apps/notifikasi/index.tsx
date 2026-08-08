'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MouseEvent } from 'react'
import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

import type { ThemeColor } from '@core/types'
import CustomAvatar from '@core/components/mui/Avatar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import ConfirmDialog, { useConfirm } from '@/src/components/ConfirmDialog'

type NotificationItem = {
  id: string
  title: string
  subtitle: string
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

  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`

  return new Date(isoString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const NotifikasiList = () => {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const { confirm, confirmProps } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetchClient<{ data: NotificationItem[] }>('/api/notifikasi?limit=all')

      setNotifications(res.data || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.read).length
  const allRead = notifications.length > 0 && notifications.every(n => n.read)

  const filtered = tab === 'unread' ? notifications.filter(n => !n.read) : notifications

  const markRead = async (e: MouseEvent<HTMLElement>, item: NotificationItem, value: boolean) => {
    e.stopPropagation()
    setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, read: value } : n)))

    try {
      await apiFetchClient(`/api/notifikasi/${item.id}`, { method: 'PATCH', body: JSON.stringify({ read: value }) })
    } catch {
      setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, read: !value } : n)))
    }
  }

  const removeNotification = async (e: MouseEvent<HTMLElement>, item: NotificationItem) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== item.id))

    try {
      await apiFetchClient(`/api/notifikasi/${item.id}`, { method: 'DELETE' })
    } catch {
      fetchNotifications()
    }
  }

  const toggleReadAll = async () => {
    if (allRead) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

    try {
      await apiFetchClient('/api/notifikasi/read-all', { method: 'PATCH' })
    } catch {
      fetchNotifications()
    }
  }

  const handleHapusSemua = async () => {
    const setuju = await confirm({
      title: 'Hapus Semua Notifikasi',
      message: `Hapus seluruh ${notifications.length} notifikasi? Tindakan ini tidak bisa dibatalkan.`
    })

    if (!setuju) return

    const sebelumnya = notifications

    setNotifications([])

    try {
      await apiFetchClient('/api/notifikasi', { method: 'DELETE' })
    } catch {
      setNotifications(sebelumnya)
    }
  }

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.read) {
      setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, read: true } : n)))
      apiFetchClient(`/api/notifikasi/${item.id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) }).catch(() => {})
    }

    if (item.url) {
      router.push(item.url)
    }
  }

  return (
    <Card>
      <CardHeader
        title={
          <div className='flex items-center gap-3'>
            <Typography variant='h5'>Notifikasi</Typography>
            {unreadCount > 0 && (
              <Chip size='small' variant='tonal' color='primary' label={`${unreadCount} Baru`} />
            )}
          </div>
        }
        action={
          <div className='flex items-center gap-1'>
            {!allRead && notifications.length > 0 && (
              <Tooltip title='Tandai semua sudah dibaca'>
                <Button
                  size='small'
                  variant='tonal'
                  color='secondary'
                  startIcon={<i className='tabler-mail-opened' />}
                  onClick={toggleReadAll}
                >
                  Tandai Semua Dibaca
                </Button>
              </Tooltip>
            )}
            {notifications.length > 0 && (
              <Tooltip title='Hapus semua notifikasi'>
                <Button
                  size='small'
                  variant='tonal'
                  color='error'
                  startIcon={<i className='tabler-trash' />}
                  onClick={handleHapusSemua}
                >
                  Hapus Semua
                </Button>
              </Tooltip>
            )}
            <Tooltip title='Refresh'>
              <IconButton size='small' onClick={fetchNotifications} className='text-textPrimary'>
                <i className='tabler-refresh' />
              </IconButton>
            </Tooltip>
          </div>
        }
      />

      <Divider />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 4, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value='all' label={`Semua (${notifications.length})`} />
        <Tab value='unread' label={`Belum Dibaca (${unreadCount})`} />
      </Tabs>

      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight={300}>
            <CircularProgress size={36} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' minHeight={300} gap={2}>
            <i className='tabler-bell-off text-5xl text-textDisabled' />
            <Typography variant='body1' color='text.secondary'>
              {tab === 'unread' ? 'Tidak ada notifikasi yang belum dibaca' : 'Tidak ada notifikasi'}
            </Typography>
          </Box>
        ) : (
          filtered.map((n, index) => (
            <div key={n.id}>
              <div
                className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-actionHover group transition-colors ${!n.read ? 'bg-actionSelected' : ''}`}
                onClick={() => handleItemClick(n)}
              >
                <CustomAvatar color={(n.avatarColor as ThemeColor) ?? 'primary'} skin='light-static'>
                  <i className={n.avatarIcon ?? 'tabler-bell'} />
                </CustomAvatar>

                <div className='flex flex-col flex-auto min-w-0'>
                  <Typography variant='body2' className='font-medium' color='text.primary'>
                    {n.title}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' className='mt-0.5'>
                    {n.subtitle}
                  </Typography>
                  <Typography variant='caption' color='text.disabled' className='mt-1'>
                    {timeAgo(n.createdAt)}
                  </Typography>
                </div>

                <div className='flex items-center gap-1 shrink-0'>
                  <Tooltip title={n.read ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}>
                    <IconButton
                      className={`${n.read ? 'invisible group-hover:visible' : ''}`}
                      onClick={e => markRead(e, n, !n.read)}
                    >
                      <i className={n.read ? 'tabler-mail text-xl' : 'tabler-mail-opened text-xl text-primary'} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Hapus'>
                    <IconButton
                      className='invisible group-hover:visible'
                      onClick={e => removeNotification(e, n)}
                    >
                      <i className='tabler-trash text-xl text-error' />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
              {index < filtered.length - 1 && <Divider />}
            </div>
          ))
        )}
      </CardContent>

      <ConfirmDialog {...confirmProps} />
    </Card>
  )
}

export default NotifikasiList
