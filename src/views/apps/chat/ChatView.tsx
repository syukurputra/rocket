'use client'

// React Imports
import { useEffect, useMemo, useRef, useState } from 'react'

// Next Imports
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Badge from '@mui/material/Badge'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

// Third-party Imports
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'

// Util Imports
import { getInitials } from '@/src/utils/getInitials'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import { commonLayoutClasses } from '@layouts/utils/layoutClasses'

type Scope = 'saya' | 'usaha'

type Conversation = {
  id: string
  companyId: string
  userId: string
  asetId: string | null
  asetNama: string | null
  contactName: string
  contactPhoto: string | null
  contactSubtitle: string
  lastMessage: string | null
  lastMessageAt: string
  unread: number
}

type ChatMessage = {
  id: string
  senderType: string
  senderId: string
  body: string
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentType?: string | null
  isRead: boolean
  createdAt: string
  isMine: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const isImageType = (type?: string | null) => !!type && type.startsWith('image/')

const fileIconClass = (type?: string | null) => {
  if (type === 'application/pdf') return 'tabler-file-type-pdf'
  if (type?.includes('word') || type === 'application/msword') return 'tabler-file-type-doc'

  return 'tabler-file'
}

// Unduh file lewat proxy agar terunduh sebagai attachment (bukan dibuka di tab)
const downloadFile = (url?: string | null, name?: string | null) => {
  if (!url) return

  const proxy = `/api/chat/download?url=${encodeURIComponent(url)}${name ? `&name=${encodeURIComponent(name)}` : ''}`
  const a = document.createElement('a')

  a.href = proxy
  a.download = name || ''
  document.body.appendChild(a)
  a.click()
  a.remove()
}

type ActiveConversation = {
  id: string
  companyId: string
  userId: string
  asetNama: string | null
  contactName: string
  contactPhoto: string | null
}

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const formatListDate = (d: string) => {
  const date = new Date(d)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()

  if (sameDay) return formatTime(d)

  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

const ChatView = ({ scope }: { scope: Scope }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialConvId = searchParams.get('c')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [search, setSearch] = useState('')

  const [activeId, setActiveId] = useState<string | null>(initialConvId)
  const [active, setActive] = useState<ActiveConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const scrollRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Fetch daftar percakapan (dengan polling) ─────────────────────────────
  const fetchConversations = async () => {
    try {
      const res = await apiFetchClient<{ data: Conversation[] }>(
        `/api/chat/conversations?scope=${scope}`,
        undefined,
        { redirectOn401: '/login' }
      )

      setConversations(res.data || [])
    } catch (err) {
      console.error('Fetch conversations error:', err)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    const timer = setInterval(fetchConversations, 5000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  // ─── Fetch pesan untuk percakapan aktif (dengan polling) ──────────────────
  const fetchMessages = async (convId: string, showLoader = false) => {
    try {
      if (showLoader) setLoadingMessages(true)

      const res = await apiFetchClient<{
        data: { role: string; conversation: ActiveConversation; messages: ChatMessage[] }
      }>(`/api/chat/messages?conversationId=${convId}`, undefined, { redirectOn401: '/login' })

      setActive(res.data.conversation)
      setMessages(res.data.messages || [])
    } catch (err) {
      console.error('Fetch messages error:', err)
    } finally {
      if (showLoader) setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (!activeId) {
      setActive(null)
      setMessages([])

      return
    }

    fetchMessages(activeId, true)
    const timer = setInterval(() => fetchMessages(activeId), 3000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  // Scroll ke bawah ketika pesan bertambah
  useEffect(() => {
    const el = scrollRef.current

    if (el) {
      const container = el._container || el

      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  const handleSelect = (convId: string) => {
    setActiveId(convId)

    // Bersihkan query param c jika ada
    if (initialConvId) router.replace(`/chat/${scope}`)
  }

  const handleSend = async () => {
    const body = draft.trim()

    if (!body || !activeId || sending) return

    setSending(true)
    setDraft('')

    // Optimistic append
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      senderType: 'ME',
      senderId: 'me',
      body,
      isRead: false,
      createdAt: new Date().toISOString(),
      isMine: true
    }

    setMessages(prev => [...prev, optimistic])

    try {
      await apiFetchClient(`/api/chat/messages`, {
        method: 'POST',
        body: JSON.stringify({ conversationId: activeId, body })
      })
      await fetchMessages(activeId)
      fetchConversations()
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setSending(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    // Reset input agar file yang sama bisa dipilih ulang
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (!file || !activeId) return

    setUploadError(null)

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Ukuran file melebihi batas 5MB')

      return
    }

    setUploading(true)

    try {
      const formData = new FormData()

      formData.append('file', file)
      formData.append('conversationId', activeId)

      const res = await apiFetchClient<{ url: string; name: string; type: string }>(`/api/chat/upload`, {
        method: 'POST',
        body: formData
      })

      await apiFetchClient(`/api/chat/messages`, {
        method: 'POST',
        body: JSON.stringify({
          conversationId: activeId,
          body: draft.trim() || '',
          attachmentUrl: res.url,
          attachmentName: res.name,
          attachmentType: res.type
        })
      })

      setDraft('')
      await fetchMessages(activeId)
      fetchConversations()
    } catch (err: any) {
      console.error('Upload error:', err)
      setUploadError(err?.message || 'Gagal mengupload file')
    } finally {
      setUploading(false)
    }
  }

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.trim().toLowerCase()

    return conversations.filter(
      c => c.contactName.toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q)
    )
  }, [conversations, search])

  // ─── Render ────────────────────────────────────────────────────────────────
  const renderAvatar = (name: string, photo: string | null, size = 38) =>
    photo ? (
      <CustomAvatar src={photo} alt={name} size={size} />
    ) : (
      <CustomAvatar color='primary' skin='light' size={size}>
        {getInitials(name)}
      </CustomAvatar>
    )

  return (
    <div
      className={classnames(
        commonLayoutClasses.contentHeightFixed,
        'flex is-full overflow-hidden rounded relative shadow-md bg-backgroundPaper'
      )}
    >
      {/* ─── Sidebar daftar percakapan ─── */}
      <div className='flex flex-col is-[370px] max-is-[370px] border-ie bg-backgroundPaper'>
        <div className='plb-[18px] pli-5 border-be'>
          <Typography variant='h5' className='mbe-3'>
            {scope === 'saya' ? 'Chat Saya' : 'Chat Usaha'}
          </Typography>
          <CustomTextField
            fullWidth
            size='small'
            placeholder='Cari percakapan...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <i className='tabler-search mie-2 text-textDisabled' />
              }
            }}
          />
        </div>

        <PerfectScrollbar options={{ wheelPropagation: false }} className='bs-full'>
          {loadingList ? (
            <div className='flex items-center justify-center plb-10'>
              <CircularProgress size={28} />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className='flex flex-col items-center justify-center plb-10 gap-2 text-center pli-4'>
              <i className='tabler-message-off text-4xl text-textDisabled' />
              <Typography variant='body2' color='text.secondary'>
                Belum ada percakapan
              </Typography>
            </div>
          ) : (
            <ul className='p-3'>
              {filteredConversations.map(c => {
                const isActive = c.id === activeId

                return (
                  <li
                    key={c.id}
                    className={classnames('flex items-center gap-3 pli-3 plb-2 cursor-pointer rounded mbe-1', {
                      'bg-primary shadow-primarySm text-[var(--mui-palette-primary-contrastText)]': isActive
                    })}
                    onClick={() => handleSelect(c.id)}
                  >
                    {renderAvatar(c.contactName, c.contactPhoto)}
                    <div className='min-is-0 flex-auto'>
                      <Typography color='inherit' className='truncate font-medium'>
                        {c.contactName}
                      </Typography>
                      <Typography
                        variant='body2'
                        color={isActive ? 'inherit' : 'text.secondary'}
                        className='truncate'
                      >
                        {c.lastMessage || c.contactSubtitle}
                      </Typography>
                    </div>
                    <div className='flex flex-col items-end gap-1'>
                      <Typography
                        variant='caption'
                        color='inherit'
                        className={classnames({ 'text-textDisabled': !isActive })}
                      >
                        {formatListDate(c.lastMessageAt)}
                      </Typography>
                      {c.unread > 0 && (
                        <Badge badgeContent={c.unread} color='error' className='mie-2' />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </PerfectScrollbar>
      </div>

      {/* ─── Konten percakapan ─── */}
      {!activeId || !active ? (
        <CardContent className='flex flex-col flex-auto items-center justify-center bs-full gap-4 bg-backgroundChat'>
          <CustomAvatar variant='circular' size={84} color='primary' skin='light'>
            <i className='tabler-message-2 text-[42px]' />
          </CustomAvatar>
          <Typography className='text-center' color='text.secondary'>
            {loadingMessages ? 'Memuat percakapan...' : 'Pilih percakapan untuk memulai.'}
          </Typography>
        </CardContent>
      ) : (
        <div className='flex flex-col flex-grow bs-full bg-backgroundChat'>
          {/* Header */}
          <div className='flex items-center justify-between border-be plb-[13px] pli-5 bg-backgroundPaper'>
            <div className='flex items-center gap-3'>
              {renderAvatar(active.contactName, active.contactPhoto)}
              <div>
                <Typography color='text.primary' className='font-medium'>
                  {active.contactName}
                </Typography>
                {active.asetNama && (
                  <Typography variant='body2' color='text.secondary'>
                    {active.asetNama}
                  </Typography>
                )}
              </div>
            </div>
          </div>

          {/* Log pesan */}
          <PerfectScrollbar ref={scrollRef} options={{ wheelPropagation: false }} className='bs-full'>
            <CardContent className='flex flex-col gap-4'>
              {messages.map(m => (
                <div
                  key={m.id}
                  className={classnames('flex gap-3 max-is-[75%]', {
                    'flex-row-reverse self-end': m.isMine,
                    'self-start': !m.isMine
                  })}
                >
                  <div
                    className={classnames('whitespace-pre-wrap pli-4 plb-2 shadow-xs', {
                      'bg-backgroundPaper rounded-e rounded-bs': !m.isMine,
                      'bg-primary text-[var(--mui-palette-primary-contrastText)] rounded-s rounded-be': m.isMine
                    })}
                    style={{ wordBreak: 'break-word' }}
                  >
                    {m.attachmentUrl &&
                      (isImageType(m.attachmentType) ? (
                        <div className='mbe-1' style={{ position: 'relative', width: 'fit-content' }}>
                          <img
                            src={m.attachmentUrl}
                            alt={m.attachmentName || 'gambar'}
                            className='cursor-pointer'
                            onClick={() => setPreviewImage(m.attachmentUrl || null)}
                            style={{ maxWidth: 240, maxHeight: 240, borderRadius: 8, display: 'block' }}
                          />
                          <Tooltip title='Unduh'>
                            <IconButton
                              size='small'
                              onClick={() => downloadFile(m.attachmentUrl, m.attachmentName)}
                              sx={{
                                position: 'absolute',
                                bottom: 6,
                                right: 6,
                                color: 'white',
                                bgcolor: 'rgba(0,0,0,0.45)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' }
                              }}
                            >
                              <i className='tabler-download text-lg' />
                            </IconButton>
                          </Tooltip>
                        </div>
                      ) : (
                        <div
                          role='button'
                          tabIndex={0}
                          onClick={() => downloadFile(m.attachmentUrl, m.attachmentName)}
                          className='flex items-center gap-2 pli-3 plb-2 mbe-1 rounded cursor-pointer'
                          style={{
                            color: 'inherit',
                            backgroundColor: m.isMine ? 'rgba(255,255,255,0.18)' : 'var(--mui-palette-action-hover)',
                            maxWidth: 260
                          }}
                        >
                          <i className={classnames(fileIconClass(m.attachmentType), 'text-2xl')} />
                          <div className='min-is-0 flex-auto'>
                            <Typography color='inherit' className='truncate text-sm font-medium'>
                              {m.attachmentName || 'Lampiran'}
                            </Typography>
                            <Typography variant='caption' color='inherit' className='opacity-70'>
                              Unduh
                            </Typography>
                          </div>
                          <i className='tabler-download text-xl opacity-80' />
                        </div>
                      ))}
                    {m.body && <Typography color='inherit'>{m.body}</Typography>}
                    <Typography
                      variant='caption'
                      color='inherit'
                      className={classnames('block text-right mbs-1', { 'opacity-70': m.isMine })}
                    >
                      {formatTime(m.createdAt)}
                    </Typography>
                  </div>
                </div>
              ))}
            </CardContent>
          </PerfectScrollbar>

          {/* Input pesan */}
          <div className='flex flex-col gap-1 p-4 bg-backgroundPaper border-bs'>
            {uploadError && (
              <Typography variant='caption' color='error.main' className='pli-1'>
                {uploadError}
              </Typography>
            )}
            <div className='flex items-end gap-2'>
              <input
                ref={fileInputRef}
                type='file'
                hidden
                accept='image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                onChange={handleFileChange}
              />
              <Tooltip title='Lampirkan file (gambar, PDF, Word • maks 5MB)'>
                <span>
                  <IconButton
                    color='secondary'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || sending}
                  >
                    {uploading ? <CircularProgress size={22} /> : <i className='tabler-paperclip' />}
                  </IconButton>
                </span>
              </Tooltip>
              <CustomTextField
                fullWidth
                multiline
                maxRows={4}
                size='small'
                placeholder='Ketik pesan...'
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
                <i className='tabler-send' />
              </IconButton>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox preview gambar */}
      <Dialog open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} maxWidth='lg'>
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: 'black', lineHeight: 0 }}>
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
            <Tooltip title='Unduh'>
              <IconButton
                onClick={() => downloadFile(previewImage, previewImage?.split('/').pop())}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                }}
              >
                <i className='tabler-download' />
              </IconButton>
            </Tooltip>
            <IconButton
              onClick={() => setPreviewImage(null)}
              sx={{
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.4)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
              }}
            >
              <i className='tabler-x' />
            </IconButton>
          </div>
          {previewImage && (
            <img
              src={previewImage}
              alt='preview'
              style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'block', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChatView
