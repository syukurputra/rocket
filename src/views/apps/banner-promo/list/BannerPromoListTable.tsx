'use client'

import { useState, useEffect, useRef } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid2'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import TablePagination from '@mui/material/TablePagination'
import Tooltip from '@mui/material/Tooltip'

import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import CustomTextField from '@core/components/mui/TextField'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import type { BannerPromoClient } from '@/src/types/apps/bannerPromoTypes'
import tableStyles from '@core/styles/table.module.css'

const EMPTY_FORM = {
  judul: '',
  deskripsi: '',
  periodeAwal: '',
  periodeAkhir: '',
  status: true
}

const toInputDate = (iso: string) => (iso ? iso.slice(0, 10) : '')
const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

const BannerPromoListTable = () => {
  const [data, setData] = useState<BannerPromoClient[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [search] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<BannerPromoClient | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [deleteDialog, setDeleteDialog] = useState<BannerPromoClient | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deletingImage, setDeletingImage] = useState(false)

  const { snack, showSnack, closeSnack } = useSnackbar()

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
        ...(search && { search })
      })
      const res = await apiFetchClient<{ data: BannerPromoClient[]; pagination: any }>(`/api/banner-promo?${params}`)

      setData(res.data || [])
      setTotalCount(res.pagination?.totalCount || 0)
    } catch (e: any) {
      showSnack(e?.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page, rowsPerPage, search])

  const openCreate = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setImagePreview(null)
    setDialogOpen(true)
  }

  const openEdit = (item: BannerPromoClient) => {
    setEditItem(item)
    setForm({
      judul: item.judul,
      deskripsi: item.deskripsi || '',
      periodeAwal: toInputDate(item.periodeAwal),
      periodeAkhir: toInputDate(item.periodeAkhir),
      status: item.status
    })
    setImageFile(null)
    setImagePreview(item.imageUrl || null)
    setDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleDeleteImage = async () => {
    if (imageFile) {
      setImageFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setImagePreview(editItem?.imageUrl || null)
      return
    }
    if (!editItem) {
      setImagePreview(null)
      return
    }
    setDeletingImage(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/banner-promo/${editItem.id}/image`, {
        method: 'DELETE',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) }
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showSnack(err.message || 'Gagal menghapus gambar', 'error')
        return
      }
      setImagePreview(null)
      setEditItem(prev => (prev ? { ...prev, imageUrl: null } : null))
      showSnack('Gambar berhasil dihapus', 'success')
    } catch (e: any) {
      showSnack(e?.message || 'Gagal menghapus gambar', 'error')
    } finally {
      setDeletingImage(false)
    }
  }

  const handleSave = async () => {
    if (!form.judul.trim()) { showSnack('Judul harus diisi', 'error'); return }
    if (!form.periodeAwal) { showSnack('Periode awal harus diisi', 'error'); return }
    if (!form.periodeAkhir) { showSnack('Periode akhir harus diisi', 'error'); return }

    setSaving(true)
    try {
      let savedId: string

      if (editItem) {
        await apiFetchClient(`/api/banner-promo/${editItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            judul: form.judul,
            deskripsi: form.deskripsi || null,
            periodeAwal: form.periodeAwal,
            periodeAkhir: form.periodeAkhir,
            status: form.status
          })
        })
        savedId = editItem.id
      } else {
        const res = await apiFetchClient<{ data: BannerPromoClient }>('/api/banner-promo', {
          method: 'POST',
          body: JSON.stringify({
            judul: form.judul,
            deskripsi: form.deskripsi || null,
            periodeAwal: form.periodeAwal,
            periodeAkhir: form.periodeAkhir,
            status: form.status
          })
        })

        savedId = res.data.id
      }

      if (imageFile && savedId) {
        const fd = new FormData()

        fd.append('file', imageFile)
        const token = localStorage.getItem('accessToken')

        const uploadRes = await fetch(`/api/banner-promo/${savedId}/image`, {
          method: 'POST',
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
          body: fd
        })

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}))

          showSnack(errData.message || 'Gagal upload gambar', 'error')
        }
      }

      showSnack(editItem ? 'Banner promo berhasil diupdate' : 'Banner promo berhasil dibuat', 'success')
      setDialogOpen(false)
      fetchData()
    } catch (e: any) {
      showSnack(e?.message || 'Gagal menyimpan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog) return
    setDeleting(true)
    try {
      await apiFetchClient(`/api/banner-promo/${deleteDialog.id}`, { method: 'DELETE' })
      showSnack('Banner promo berhasil dihapus', 'success')
      setDeleteDialog(null)
      fetchData()
    } catch (e: any) {
      showSnack(e?.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <AppSnackbar snack={snack} onClose={closeSnack} />
      <Card>
        <CardHeader
          title='Banner Promo'
          action={
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openCreate}>
              Tambah Banner
            </Button>
          }
        />
        <Divider />
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Gambar</th>
                <th>Judul Promo</th>
                <th>Deskripsi</th>
                <th>Periode</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className='text-center py-8'>
                    <CircularProgress size={32} />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className='text-center py-8'>
                    <Typography color='text.secondary'>Belum ada banner promo</Typography>
                  </td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id}>
                    <td>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.judul}
                          style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 80, height: 50, borderRadius: 1,
                            bgcolor: 'action.hover', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <i className='tabler-photo-off text-textDisabled' />
                        </Box>
                      )}
                    </td>
                    <td>
                      <Typography variant='body2' fontWeight={600}>{item.judul}</Typography>
                    </td>
                    <td>
                      <Typography variant='body2' color='text.secondary' className='line-clamp-2' sx={{ maxWidth: 220 }}>
                        {item.deskripsi || '-'}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant='body2'>
                        {formatDate(item.periodeAwal)} – {formatDate(item.periodeAkhir)}
                      </Typography>
                    </td>
                    <td>
                      <Chip
                        label={item.status ? 'Aktif' : 'Non Aktif'}
                        color={item.status ? 'success' : 'default'}
                        size='small'
                        variant='tonal'
                      />
                    </td>
                    <td>
                      <div className='flex items-center gap-1'>
                        <Tooltip title='Edit'>
                          <IconButton size='small' onClick={() => openEdit(item)}>
                            <i className='tabler-edit text-textSecondary' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Hapus'>
                          <IconButton size='small' color='error' onClick={() => setDeleteDialog(item)}>
                            <i className='tabler-trash' />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          component='div'
          count={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage='Baris per halaman:'
        />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle className='flex items-center justify-between'>
          <span>{editItem ? 'Edit Banner Promo' : 'Tambah Banner Promo'}</span>
          <IconButton size='small' onClick={() => !saving && setDialogOpen(false)}>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={4} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Judul Promo'
                required
                value={form.judul}
                onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
                placeholder='Masukkan judul promo'
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Deskripsi'
                multiline
                rows={3}
                value={form.deskripsi}
                onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                placeholder='Deskripsi promo (opsional)'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Periode Awal'
                type='date'
                required
                value={form.periodeAwal}
                onChange={e => setForm(f => ({ ...f, periodeAwal: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Periode Akhir'
                type='date'
                required
                value={form.periodeAkhir}
                onChange={e => setForm(f => ({ ...f, periodeAkhir: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Upload Gambar Banner
              </Typography>
              <div className='flex flex-col gap-4'>
                <input ref={fileInputRef} type='file' accept='image/*' style={{ display: 'none' }} onChange={handleFileChange} />
                <Button
                  variant='tonal'
                  color='secondary'
                  startIcon={<i className='tabler-upload' />}
                  sx={{ width: 'fit-content' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Pilih Gambar
                </Button>
                <Typography variant='caption' color='text.secondary'>
                  Rekomendasi ukuran <strong>800×1200px</strong>. Maks. 5MB, format JPG/PNG/WebP.
                </Typography>
                {imagePreview && (
                  <div className='flex flex-wrap gap-4'>
                    <div className='flex flex-col items-center gap-1 border p-2 rounded relative group'>
                      <img
                        src={imagePreview}
                        alt='preview'
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                      />
                      <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <IconButton
                          size='small'
                          onClick={handleDeleteImage}
                          disabled={deletingImage}
                          sx={{ bgcolor: 'error.main', color: 'white', p: 0.5, '&:hover': { bgcolor: 'error.dark' } }}
                        >
                          {deletingImage
                            ? <CircularProgress size={12} color='inherit' />
                            : <i className='tabler-x' style={{ fontSize: 12 }} />
                          }
                        </IconButton>
                      </div>
                      <Typography variant='caption' sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {imageFile ? imageFile.name : 'Gambar tersimpan'}
                      </Typography>
                    </div>
                  </div>
                )}
              </div>
            </Grid>
            <Grid size={{ xs: 12 }}>
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button variant='tonal' color='secondary' onClick={() => setDialogOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : undefined}
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => !deleting && setDeleteDialog(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Banner Promo</DialogTitle>
        <DialogContent>
          <Typography>
            Yakin ingin menghapus banner <strong>{deleteDialog?.judul}</strong>? Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant='tonal' color='secondary' onClick={() => setDeleteDialog(null)} disabled={deleting}>
            Batal
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color='inherit' /> : undefined}
          >
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default BannerPromoListTable
