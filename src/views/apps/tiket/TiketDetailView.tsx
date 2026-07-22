'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'

import classnames from 'classnames'
import dayjs from 'dayjs'

import CustomTextField from '@core/components/mui/TextField'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import { statusChip } from './TiketListView'

type Tiket = {
  id: string
  nomorTiket: string
  userId: string
  deskripsi: string
  status: string
  createdAt: string
  closedAt: string | null
  kategoriNama: string | null
  userNama: string | null
  userUsername: string | null
  userEmail: string | null
}

type Pesan = {
  id: string
  senderType: string
  senderId: string
  senderNama: string | null
  senderUsername: string | null
  pesan: string
  createdAt: string
  isMine: boolean
}

const TiketDetailView = ({ tiketId, mode }: { tiketId: string; mode: 'user' | 'cs' }) => {
  const router = useRouter()
  const { snack, showSnack, closeSnack } = useSnackbar()

  const [tiket, setTiket] = useState<Tiket | null>(null)
  const [isCS, setIsCS] = useState(false)
  const [pesan, setPesan] = useState<Pesan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const basePath = mode === 'cs' ? '/management-master/tiket' : '/support'

  const fetchTiket = useCallback(async () => {
    try {
      const res = await apiFetchClient<{ data: Tiket; isCustomerService: boolean }>(
        `/api/tiket/${tiketId}`,
        undefined,
        { redirectOn401: '/login' }
      )

      setTiket(res.data)
      setIsCS(res.isCustomerService)
    } catch (err: any) {
      setLoadError(err?.message || 'Gagal memuat tiket')
    }
  }, [tiketId])

  const fetchPesan = useCallback(async () => {
    try {
      const res = await apiFetchClient<{ data: Pesan[] }>(`/api/tiket/${tiketId}/pesan`, undefined, {
        redirectOn401: '/login'
      })

      setPesan(res.data || [])
    } catch (err) {
      console.error('Fetch pesan tiket error:', err)
    }
  }, [tiketId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchTiket()
      await fetchPesan()
      setLoading(false)
    }

    load()
  }, [fetchTiket, fetchPesan])

  // Polling pesan (chat)
  useEffect(() => {
    const timer = setInterval(fetchPesan, 5000)

    return () => clearInterval(timer)
  }, [fetchPesan])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [pesan])

  const isClosed = tiket?.status === 'CLOSED'

  const handleSend = async () => {
    const body = draft.trim()

    if (!body || sending) return

    setSending(true)
    setDraft('')

    try {
      await apiFetchClient(`/api/tiket/${tiketId}/pesan`, {
        method: 'POST',
        body: JSON.stringify({ pesan: body })
      })
      await fetchPesan()
      fetchTiket()
    } catch (err: any) {
      showSnack(err?.message || 'Gagal mengirim pesan', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleChangeStatus = async (newStatus: string) => {
    if (!newStatus || newStatus === tiket?.status) return

    try {
      await apiFetchClient(`/api/tiket/${tiketId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      showSnack('Status tiket diperbarui', 'success')
      fetchTiket()
    } catch (err: any) {
      showSnack(err?.message || 'Gagal mengubah status', 'error')
    }
  }

  const handleClose = async () => {
    setClosing(true)

    try {
      await apiFetchClient(`/api/tiket/${tiketId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'CLOSED' })
      })
      showSnack('Tiket ditutup', 'success')
      fetchTiket()
    } catch (err: any) {
      showSnack(err?.message || 'Gagal menutup tiket', 'error')
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='60vh'>
        <CircularProgress />
      </Box>
    )
  }

  if (loadError || !tiket) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>{loadError || 'Tiket tidak ditemukan.'}</Alert>
          <Button className='mt-4' variant='tonal' color='secondary' onClick={() => router.push(basePath)}>
            Kembali
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Grid container spacing={6}>
        {/* Kiri: percakapan */}
        <Grid size={{ xs: 12, md: mode === 'cs' ? 8 : 12 }}>
          <Card>
            <CardHeader
              title={`Tiket ${tiket.nomorTiket}`}
              subheader={tiket.kategoriNama || '-'}
              avatar={
                mode === 'user' ? (
                  <Tooltip title='Kembali'>
                    <IconButton onClick={() => router.push(basePath)}>
                      <i className='tabler-arrow-left' />
                    </IconButton>
                  </Tooltip>
                ) : undefined
              }
              action={statusChip(tiket.status)}
            />
            <Divider />

            {/* Log percakapan */}
            <div ref={scrollRef} style={{ maxHeight: 460, overflowY: 'auto' }}>
              <CardContent className='flex flex-col gap-4'>
                {pesan.map(p => (
                  <div
                    key={p.id}
                    className={classnames('flex gap-3 max-is-[80%]', {
                      'flex-row-reverse self-end': p.isMine,
                      'self-start': !p.isMine
                    })}
                  >
                    <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
                      {p.senderType === 'CS' ? 'CS' : (p.senderNama || p.senderUsername || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                    <div
                      className={classnames('whitespace-pre-wrap pli-4 plb-2 rounded shadow-xs', {
                        'bg-primary text-[var(--mui-palette-primary-contrastText)]': p.isMine,
                        'bg-actionHover': !p.isMine
                      })}
                      style={{ wordBreak: 'break-word' }}
                    >
                      <Typography variant='caption' color='inherit' className='block opacity-80'>
                        {p.senderType === 'CS' ? 'Customer Service' : p.senderNama || p.senderUsername || 'Pengguna'}
                      </Typography>
                      <Typography color='inherit'>{p.pesan}</Typography>
                      <Typography variant='caption' color='inherit' className='block text-right opacity-70 mbs-1'>
                        {dayjs(p.createdAt).format('DD MMM YYYY HH:mm')}
                      </Typography>
                    </div>
                  </div>
                ))}
              </CardContent>
            </div>

            <Divider />

            {/* Input balasan */}
            <CardContent>
              {isClosed ? (
                <Alert severity='info'>Tiket sudah ditutup. Tidak dapat mengirim pesan baru.</Alert>
              ) : (
                <div className='flex items-end gap-2'>
                  <CustomTextField
                    fullWidth
                    multiline
                    maxRows={4}
                    size='small'
                    placeholder={mode === 'cs' ? 'Tulis balasan untuk pengguna...' : 'Tulis pesan...'}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <IconButton color='primary' onClick={handleSend} disabled={!draft.trim() || sending}>
                    {sending ? <CircularProgress size={22} /> : <i className='tabler-send' />}
                  </IconButton>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Kanan: info & aksi (khusus Customer Service) */}
        {mode === 'cs' && (
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title='Informasi Tiket' />
            <Divider />
            <CardContent>
              <div className='flex flex-col gap-3'>
                <div className='flex justify-between gap-4'>
                  <Typography variant='body2' color='text.secondary'>No. Tiket</Typography>
                  <Typography variant='body2' fontWeight={500}>{tiket.nomorTiket}</Typography>
                </div>
                <div className='flex justify-between gap-4'>
                  <Typography variant='body2' color='text.secondary'>Kategori</Typography>
                  <Typography variant='body2' fontWeight={500}>{tiket.kategoriNama || '-'}</Typography>
                </div>
                <div className='flex justify-between gap-4'>
                  <Typography variant='body2' color='text.secondary'>Status</Typography>
                  {statusChip(tiket.status)}
                </div>
                <div className='flex justify-between gap-4'>
                  <Typography variant='body2' color='text.secondary'>Dibuat</Typography>
                  <Typography variant='body2' fontWeight={500}>
                    {dayjs(tiket.createdAt).format('DD MMM YYYY HH:mm')}
                  </Typography>
                </div>
                {tiket.closedAt && (
                  <div className='flex justify-between gap-4'>
                    <Typography variant='body2' color='text.secondary'>Ditutup</Typography>
                    <Typography variant='body2' fontWeight={500}>
                      {dayjs(tiket.closedAt).format('DD MMM YYYY HH:mm')}
                    </Typography>
                  </div>
                )}
                {isCS && (
                  <>
                    <Divider />
                    <div className='flex justify-between gap-4'>
                      <Typography variant='body2' color='text.secondary'>Pelapor</Typography>
                      <Typography variant='body2' fontWeight={500}>
                        {tiket.userNama || tiket.userUsername || '-'}
                      </Typography>
                    </div>
                    <div className='flex justify-between gap-4'>
                      <Typography variant='body2' color='text.secondary'>Email</Typography>
                      <Typography variant='body2' fontWeight={500}>{tiket.userEmail || '-'}</Typography>
                    </div>
                  </>
                )}

                <Divider />

                {!isClosed && (
                  <Button
                    fullWidth
                    variant='contained'
                    color='error'
                    startIcon={closing ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-lock' />}
                    onClick={handleClose}
                    disabled={closing}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {closing ? 'Menutup...' : 'Tutup Tiket'}
                  </Button>
                )}

                <Button
                  fullWidth
                  variant='tonal'
                  color='secondary'
                  startIcon={<i className='tabler-arrow-left' />}
                  onClick={() => router.push(basePath)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Kembali
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
        )}
      </Grid>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default TiketDetailView
