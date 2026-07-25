'use client'

import { useEffect, useState, useCallback } from 'react'

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
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

import CustomTextField from '@core/components/mui/TextField'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Kategori = {
  id: string
  nama: string
  deskripsi: string | null
  status: boolean
  createdAt: string
}

const EMPTY = { nama: '', deskripsi: '', status: true }

const KategoriTiketView = () => {
  const { snack, showSnack, closeSnack } = useSnackbar()

  const [data, setData] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Kategori | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const [deleteItem, setDeleteItem] = useState<Kategori | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetchClient<{ data: Kategori[] }>('/api/kategori-tiket', undefined, {
        redirectOn401: '/login'
      })

      setData(res.data || [])
    } catch (err) {
      console.error('Fetch kategori tiket error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setEditItem(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }

  const openEdit = (item: Kategori) => {
    setEditItem(item)
    setForm({ nama: item.nama, deskripsi: item.deskripsi || '', status: item.status })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.nama.trim()) { showSnack('Nama kategori wajib diisi', 'error'); return }

    setSaving(true)

    try {
      if (editItem) {
        await apiFetchClient(`/api/kategori-tiket/${editItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        })
        showSnack('Kategori berhasil diupdate', 'success')
      } else {
        await apiFetchClient('/api/kategori-tiket', { method: 'POST', body: JSON.stringify(form) })
        showSnack('Kategori berhasil dibuat', 'success')
      }

      setDialogOpen(false)
      fetchData()
    } catch (err: any) {
      showSnack(err?.message || 'Gagal menyimpan kategori', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return

    setDeleting(true)

    try {
      await apiFetchClient(`/api/kategori-tiket/${deleteItem.id}`, { method: 'DELETE' })
      showSnack('Kategori berhasil dihapus', 'success')
      setDeleteItem(null)
      fetchData()
    } catch (err: any) {
      showSnack(err?.message || 'Gagal menghapus kategori', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Category Tiket'
          action={
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openCreate}>
              Tambah Kategori
            </Button>
          }
        />
        <Divider />

        {loading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight={240}>
            <CircularProgress />
          </Box>
        ) : data.length === 0 ? (
          <Box display='flex' flexDirection='column' alignItems='center' gap={2} py={8}>
            <i className='tabler-category-2 text-5xl text-textDisabled' />
            <Typography color='text.secondary'>Belum ada kategori tiket</Typography>
          </Box>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nama Kategori</TableCell>
                  <TableCell>Deskripsi</TableCell>
                  <TableCell align='center'>Status</TableCell>
                  <TableCell align='center'>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(k => (
                  <TableRow key={k.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{k.nama}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>{k.deskripsi || '-'}</Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={k.status ? 'Aktif' : 'Non Aktif'}
                        color={k.status ? 'success' : 'default'}
                        size='small'
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <Tooltip title='Ubah'>
                        <IconButton size='small' onClick={() => openEdit(k)}>
                          <i className='tabler-edit text-textSecondary' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Hapus'>
                        <IconButton size='small' onClick={() => setDeleteItem(k)}>
                          <i className='tabler-trash text-textSecondary' />
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

      {/* Dialog Tambah/Edit */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editItem ? 'Edit Kategori Tiket' : 'Tambah Kategori Tiket'}</DialogTitle>
        <DialogContent dividers sx={{ py: 4 }}>
          <div className='flex flex-col gap-4'>
            <CustomTextField
              fullWidth
              label='Nama Kategori *'
              value={form.nama}
              onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
            />
            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label='Deskripsi'
              placeholder='Deskripsi kategori (opsional)'
              value={form.deskripsi}
              onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.checked }))}
                  color='success'
                />
              }
              label={form.status ? 'Aktif' : 'Non Aktif'}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 6, pt: 5, pb: 4 }}>
          <Button color='secondary' onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Konfirmasi Hapus */}
      <Dialog open={!!deleteItem} onClose={() => !deleting && setDeleteItem(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Kategori</DialogTitle>
        <DialogContent>
          <Typography>
            Yakin ingin menghapus kategori <strong>{deleteItem?.nama}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setDeleteItem(null)} disabled={deleting}>Batal</Button>
          <Button variant='contained' color='error' onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default KategoriTiketView
