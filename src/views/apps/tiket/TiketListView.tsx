'use client'

import { useEffect, useState, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import dayjs from 'dayjs'

import CustomTextField from '@core/components/mui/TextField'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Tiket = {
  id: string
  nomorTiket: string
  deskripsi: string
  status: string
  createdAt: string
  closedAt: string | null
  kategoriNama: string | null
  userNama: string | null
  userUsername: string | null
  userEmail: string | null
  jumlahPesan: number
}

type Kategori = { id: string; nama: string }

export const statusChip = (status: string) => {
  const s = (status || '').toUpperCase()

  if (s === 'CLOSED') return <Chip label='Ditutup' color='default' size='small' variant='tonal' />
  if (s === 'DONE') return <Chip label='Selesai' color='success' size='small' variant='tonal' />
  if (s === 'HOLD') return <Chip label='Hold' color='warning' size='small' variant='tonal' />
  if (s === 'IN PROGRESS' || s === 'DIPROSES') return <Chip label='In Progress' color='info' size='small' variant='tonal' />

  return <Chip label='Terbuka' color='secondary' size='small' variant='tonal' />
}

// Opsi status yang bisa diubah CS lewat dropdown
export const CS_STATUS_OPTIONS = ['HOLD', 'IN PROGRESS', 'DONE']

const TiketListView = ({ mode }: { mode: 'user' | 'cs' }) => {
  const router = useRouter()
  const { snack, showSnack, closeSnack } = useSnackbar()

  const [data, setData] = useState<Tiket[]>([])
  const [loading, setLoading] = useState(true)

  const [openCreate, setOpenCreate] = useState(false)
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [kategoriTiketId, setKategoriTiketId] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const basePath = mode === 'cs' ? '/management-master/tiket' : '/support'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetchClient<{ data: Tiket[] }>('/api/tiket', undefined, { redirectOn401: '/login' })

      setData(res.data || [])
    } catch (err) {
      console.error('Fetch tiket error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreateDialog = async () => {
    setOpenCreate(true)

    try {
      const res = await apiFetchClient<{ data: Kategori[] }>('/api/kategori-tiket?aktifOnly=true')

      setKategoriList(res.data || [])
    } catch {
      showSnack('Gagal memuat kategori tiket', 'error')
    }
  }

  const handleCreate = async () => {
    if (!kategoriTiketId) { showSnack('Pilih kategori tiket', 'error'); return }
    if (!deskripsi.trim()) { showSnack('Deskripsi kendala wajib diisi', 'error'); return }

    setSubmitting(true)

    try {
      await apiFetchClient('/api/tiket', {
        method: 'POST',
        body: JSON.stringify({ kategoriTiketId, deskripsi })
      })

      showSnack('Tiket berhasil dibuat', 'success')
      setOpenCreate(false)
      setKategoriTiketId('')
      setDeskripsi('')
      fetchData()
    } catch (err: any) {
      showSnack(err?.message || 'Gagal membuat tiket', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title={mode === 'cs' ? 'Tiket Support' : 'Support'}
          subheader={mode === 'cs' ? 'Kelola & balas tiket dari pengguna' : 'Buat tiket kendala dan pantau statusnya'}
          action={
            mode === 'user' ? (
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openCreateDialog}>
                Buat Tiket
              </Button>
            ) : null
          }
        />
        <Divider />

        {loading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight={280}>
            <CircularProgress />
          </Box>
        ) : data.length === 0 ? (
          <Box display='flex' flexDirection='column' alignItems='center' gap={2} py={8}>
            <i className='tabler-ticket-off text-5xl text-textDisabled' />
            <Typography color='text.secondary'>
              {mode === 'cs' ? 'Belum ada tiket masuk' : 'Belum ada tiket. Buat tiket jika Anda mengalami kendala.'}
            </Typography>
          </Box>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No. Tiket</TableCell>
                  {mode === 'cs' && <TableCell>Pelapor</TableCell>}
                  <TableCell>Kategori</TableCell>
                  <TableCell>Kendala</TableCell>
                  <TableCell>Tanggal</TableCell>
                  <TableCell align='center'>Status</TableCell>
                  <TableCell align='center'>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Typography variant='body2' color='primary.main' className='font-medium'>
                        {t.nomorTiket}
                      </Typography>
                    </TableCell>
                    {mode === 'cs' && (
                      <TableCell>
                        <Typography variant='body2'>{t.userNama || t.userUsername || '-'}</Typography>
                        <Typography variant='caption' color='text.secondary'>{t.userEmail || ''}</Typography>
                      </TableCell>
                    )}
                    <TableCell>{t.kategoriNama || '-'}</TableCell>
                    <TableCell>
                      <Typography variant='body2' className='line-clamp-2' sx={{ maxWidth: 280 }}>
                        {t.deskripsi}
                      </Typography>
                    </TableCell>
                    <TableCell>{dayjs(t.createdAt).format('DD-MM-YYYY')}</TableCell>
                    <TableCell align='center'>{statusChip(t.status)}</TableCell>
                    <TableCell align='center'>
                      <Tooltip title='Detail & Balas'>
                        <IconButton size='small' onClick={() => router.push(`${basePath}/${t.id}`)}>
                          <i className='tabler-message-2 text-textSecondary' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Dialog Buat Tiket */}
      <Dialog open={openCreate} onClose={() => !submitting && setOpenCreate(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Buat Tiket Support</DialogTitle>
        <DialogContent dividers sx={{ py: 4 }}>
          <div className='flex flex-col gap-4'>
            <CustomTextField
              select
              fullWidth
              label='Kategori Tiket *'
              value={kategoriTiketId}
              onChange={e => setKategoriTiketId(e.target.value)}
            >
              {kategoriList.length === 0 ? (
                <MenuItem value='' disabled>Belum ada kategori</MenuItem>
              ) : (
                kategoriList.map(k => (
                  <MenuItem key={k.id} value={k.id}>{k.nama}</MenuItem>
                ))
              )}
            </CustomTextField>

            <CustomTextField
              fullWidth
              multiline
              rows={5}
              label='Deskripsi Kendala *'
              placeholder='Jelaskan kendala yang Anda alami...'
              value={deskripsi}
              onChange={e => setDeskripsi(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setOpenCreate(false)} disabled={submitting}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleCreate} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Kirim Tiket'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default TiketListView
