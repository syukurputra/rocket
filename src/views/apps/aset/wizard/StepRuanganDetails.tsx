// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import DirectionalIcon from '@components/DirectionalIcon'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Props = {
  activeStep: number
  handleNext: () => void
  handlePrev: () => void
  steps: { title: string; subtitle: string }[]
  onSave: (data: any) => void
  asetId: string | null
}

type RuanganData = {
  id?: string
  asetId: string
  nama: string
  status: string

  // Nominal removed
  hargaHarian: number
  hargaBulanan: number
  hargaTahunan: number
  images?: any[]
}

const StepRuanganDetails = ({ activeStep, handleNext, handlePrev, steps, asetId }: Props) => {
  // View State
  const [view, setView] = useState<'table' | 'form'>('table')
  const [rooms, setRooms] = useState<RuanganData[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [nama, setNama] = useState('')
  const [status, setStatus] = useState('Tidak Dihuni') // Standardized to Title Case
  const [hargaHarian, setHargaHarian] = useState('')
  const [hargaBulanan, setHargaBulanan] = useState('')
  const [hargaTahunan, setHargaTahunan] = useState('')

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<any[]>([])

  // Helper function to format number with thousand separators
  const formatNumber = (value: string | number): string => {
    if (!value) return ''
    const numValue = typeof value === 'string' ? value.replace(/\D/g, '') : String(value)

    return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Helper function to parse formatted number back to plain number
  const parseNumber = (value: string): string => {
    return value.replace(/\./g, '')
  }

  useEffect(() => {
    if (asetId) {
      fetchRooms()
    }
  }, [asetId])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await apiFetchClient<{ data: (RuanganData & { images: any[] })[] }>(`/api/ruangan?asetId=${asetId}`)

      if (res.data) {
        // @ts-ignore
        setRooms(res.data)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    resetForm()
    setEditingId(null)
    setView('form')
  }

  const handleEdit = (room: RuanganData & { images?: any[] }) => {
    setEditingId(room.id!)
    setNama(room.nama)
    setStatus(room.status)
    setHargaHarian(formatNumber(room.hargaHarian))
    setHargaBulanan(formatNumber(room.hargaBulanan))
    setHargaTahunan(formatNumber(room.hargaTahunan))
    setExistingImages(room.images || [])
    setSelectedFiles([])
    setView('form')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus ruangan ini?')) {
      try {
        await apiFetchClient(`/api/ruangan/${id}`, { method: 'DELETE' })
        fetchRooms()
      } catch (error) {
        console.error('Error deleting room:', error)
        alert('Gagal menghapus ruangan.')
      }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files)

      if (files.length > 3) {
        alert('Maksimal upload 3 gambar')

        return
      }

      if (existingImages.length + files.length > 3) {
        alert(`Total gambar tidak boleh lebih dari 3. Saat ini sudah ada ${existingImages.length} gambar.`)

        return
      }

      setSelectedFiles(files)
    }
  }

  const handleDeleteSelected = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar ini?')) return

    try {
      await apiFetchClient(`/api/ruangan-image/${imageId}`, { method: 'DELETE' })
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Gagal menghapus gambar')
    }
  }

  const resetForm = () => {
    setNama('')
    setStatus('tidak dihuni')
    setHargaHarian('')
    setHargaBulanan('')
    setHargaTahunan('')
    setSelectedFiles([])
    setExistingImages([])
  }

  const handleSubmit = async () => {
    if (!asetId) return

    const data = {
      asetId,
      nama,
      status,
      hargaHarian: Number(parseNumber(hargaHarian)),
      hargaBulanan: Number(parseNumber(hargaBulanan)),
      hargaTahunan: Number(parseNumber(hargaTahunan))
    }

    try {
      let roomId = editingId

      if (editingId) {
        // Update
        await apiFetchClient(`/api/ruangan/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        })
      } else {
        // Create
        const res = await apiFetchClient<{ data: RuanganData }>(`/api/ruangan`, {
          method: 'POST',
          body: JSON.stringify(data)
        })

        if (res.data && res.data.id) {
          roomId = res.data.id
        }
      }

      // Handle Image Upload
      if (roomId && selectedFiles.length > 0) {
        const formData = new FormData()

        selectedFiles.forEach(file => {
          formData.append('files', file)
        })

        // Use fetch with Auth header
        const token = localStorage.getItem('accessToken')

        await fetch(`/api/ruangan/${roomId}/images`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: formData
        })
      }

      fetchRooms()
      setView('table')
    } catch (error) {
      console.error('Error saving room:', error)
      alert('Gagal menyimpan ruangan.')
    }
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()

    if (statusLower === 'huni') return 'success'
    if (statusLower === 'tidak dihuni' || statusLower === 'kosong') return 'error'

    return 'default'
  }

  if (view === 'table') {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className='flex items-center justify-between'>
            <Typography variant='h5'>Daftar Ruangan</Typography>
            <Button variant='contained' onClick={handleAdd} startIcon={<i className='tabler-plus' />}>
              Tambah
            </Button>
          </div>
          <Typography className='mb-4'>Kelola daftar ruangan untuk aset ini.</Typography>

          <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nama Ruangan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Harga Harian</TableCell>
                  <TableCell>Harga Bulanan</TableCell>
                  <TableCell>Harga Tahunan</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      Belum ada data ruangan
                    </TableCell>
                  </TableRow>
                ) : (
                  rooms.map((room, index) => (
                    <TableRow key={index}>
                      <TableCell>{room.nama}</TableCell>
                      <TableCell>
                        {Number(room.hargaHarian).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                      </TableCell>
                      <TableCell>
                        {Number(room.hargaBulanan).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                      </TableCell>
                      <TableCell>
                        {Number(room.hargaTahunan).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                      </TableCell>
                      <TableCell>
                        <Chip label={room.status} color={getStatusColor(room.status)} size='small' variant='tonal' />
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Tooltip title='Ubah'>
                            <IconButton
                              aria-label='Ubah'
                              className='flex'
                              onClick={() => handleEdit(room)}
                              sx={{ minWidth: 0, p: 1 }}
                            >
                              <i className='tabler-edit' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Hapus'>
                            <IconButton
                              aria-label='Hapus'
                              color='error'
                              className='flex'
                              onClick={() => handleDelete(room.id!)}
                              sx={{ minWidth: 0, p: 1 }}
                            >
                              <i className='tabler-trash' />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <div className='flex items-center justify-between'>
            <Button
              variant='tonal'
              color='secondary'
              onClick={handlePrev}
              startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
            >
              Previous
            </Button>
            <Button
              variant='contained'
              color='success'
              onClick={() => {
                alert('Wizard Completed!')
                window.location.href = '/aset'
              }}
            >
              Finish
            </Button>
          </div>
        </Grid>
      </Grid>
    )
  }

  // Form View
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h5'>{editingId ? 'Edit Ruangan' : 'Tambah Ruangan'}</Typography>
        <Typography>Silakan lengkapi detail ruangan.</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          fullWidth
          label='Nama Ruangan'
          placeholder='Contoh: Kamar 101'
          value={nama}
          onChange={e => setNama(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          select
          fullWidth
          label='Status Ruangan'
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <MenuItem value='tidak dihuni'>Tidak Dihuni</MenuItem>
          <MenuItem value='huni'>Huni</MenuItem>
        </CustomTextField>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <CustomTextField
          fullWidth
          label='Harga Harian'
          placeholder='0'
          value={hargaHarian}
          onChange={e => setHargaHarian(formatNumber(e.target.value))}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <CustomTextField
          fullWidth
          label='Harga Bulanan'
          placeholder='0'
          value={hargaBulanan}
          onChange={e => setHargaBulanan(formatNumber(e.target.value))}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <CustomTextField
          fullWidth
          label='Harga Tahunan'
          placeholder='0'
          value={hargaTahunan}
          onChange={e => setHargaTahunan(formatNumber(e.target.value))}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Upload Gambar Ruangan
        </Typography>
        <div className='flex flex-col gap-4'>
          <Button
            component='label'
            variant='tonal'
            startIcon={<i className='tabler-upload' />}
            sx={{ width: 'fit-content' }}
            disabled={existingImages.length >= 3}
          >
            Pilih Gambar
            <input type='file' hidden multiple accept='image/*' onChange={handleFileChange} />
          </Button>

          {/* Selected New Files */}
          {selectedFiles.length > 0 && (
            <div className='flex flex-wrap gap-4'>
              {selectedFiles.map((file, index) => (
                <div key={index} className='flex flex-col items-center gap-1 border p-2 rounded relative group'>
                  <div className='absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <div
                      className='bg-red-500 text-white rounded-full p-1 cursor-pointer'
                      onClick={() => handleDeleteSelected(index)}
                    >
                      <i className='tabler-x text-xs' />
                    </div>
                  </div>
                  <Typography
                    variant='body2'
                    sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {file.name}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {(file.size / 1024).toFixed(0)} KB
                  </Typography>
                </div>
              ))}
            </div>
          )}

          {/* Display Existing Images */}
          {existingImages.length > 0 && (
            <div className='flex flex-col gap-2'>
              <Typography variant='subtitle2'>Gambar Tersimpan ({existingImages.length}/3):</Typography>
              <div className='flex flex-wrap gap-4'>
                {existingImages.map((img: any) => (
                  <div key={img.id} className='flex flex-col items-center gap-1 border p-2 rounded relative group'>
                    <img src={img.filepath} alt={img.filename} className='w-[100px] h-[100px] object-cover rounded' />
                    <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <Button
                        variant='contained'
                        color='error'
                        size='small'
                        sx={{ minWidth: 0, p: 1, borderRadius: '50%' }}
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        <i className='tabler-trash text-sm' />
                      </Button>
                    </div>

                    <Typography
                      variant='caption'
                      sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {img.filename}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <div className='flex items-center justify-between'>
          <Button variant='tonal' color='secondary' onClick={() => setView('table')}>
            Cancel
          </Button>
          <Button variant='contained' color='primary' onClick={handleSubmit} endIcon={<i className='tabler-check' />}>
            Submit
          </Button>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepRuanganDetails
