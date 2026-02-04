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
import Autocomplete from '@mui/material/Autocomplete'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import DirectionalIcon from '@components/DirectionalIcon'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Props = {
  activeStep: number
  handleNext: () => void
  handlePrev: () => void
  steps: { title: string; subtitle: string }[]
  asetId: string | null
  onShowMessage?: (message: string, type: 'success' | 'error') => void
}

type IconData = {
  id: string
  nama: string
  code: string
}

type FasilitasData = {
  id?: string
  nama: string
  iconId: string
  asetId: string
  icon?: IconData
}

const StepFasilitasDetails = ({ activeStep, handleNext, handlePrev, steps, asetId, onShowMessage }: Props) => {
  // View State
  const [view, setView] = useState<'table' | 'form'>('table')
  const [fasilitas, setFasilitas] = useState<FasilitasData[]>([])
  const [icons, setIcons] = useState<IconData[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [nama, setNama] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchIcons()

    if (asetId) {
      fetchFasilitas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asetId])

  const fetchIcons = async () => {
    try {
      const res = await apiFetchClient<IconData[]>(`/api/master/icon/dropdown`)

      if (res) {
        setIcons(res)
      }
    } catch (error) {
      console.error('Error fetching icons:', error)
    }
  }

  const fetchFasilitas = async () => {
    try {
      setLoading(true)
      const res = await apiFetchClient<FasilitasData[]>(`/api/fasilitas-aset?asetId=${asetId}`)

      if (res) {
        setFasilitas(res)
      }
    } catch (error) {
      console.error('Error fetching fasilitas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    resetForm()
    setEditingId(null)
    setView('form')
  }

  const handleEdit = (item: FasilitasData) => {
    setEditingId(item.id!)
    setNama(item.nama)
    setSelectedIcon(item.icon || null)
    setView('form')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus fasilitas ini?')) {
      try {
        await apiFetchClient(`/api/fasilitas-aset/${id}`, { method: 'DELETE' })
        fetchFasilitas()
      } catch (error) {
        console.error('Error deleting fasilitas:', error)
        onShowMessage?.('Gagal menghapus fasilitas.', 'error')
      }
    }
  }

  const resetForm = () => {
    setNama('')
    setSelectedIcon(null)
  }

  const handleSubmit = async () => {
    if (!asetId) {
      onShowMessage?.('asetId tidak ditemukan', 'error')

      return
    }

    if (!nama || !selectedIcon) {
      onShowMessage?.('Nama dan Icon harus diisi', 'error')

      return
    }

    const data = {
      asetId,
      nama,
      iconId: selectedIcon.id
    }

    console.log('Sending data:', data)

    try {
      if (editingId) {
        // Update
        const result = await apiFetchClient(`/api/fasilitas-aset/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        })

        console.log('Update result:', result)
      } else {
        // Create
        const result = await apiFetchClient(`/api/fasilitas-aset`, {
          method: 'POST',
          body: JSON.stringify(data)
        })

        console.log('Create result:', result)
      }

      fetchFasilitas()
      setView('table')
      resetForm()
    } catch (error) {
      console.error('Error saving fasilitas:', error)
      onShowMessage?.('Gagal menyimpan fasilitas.', 'error')
    }
  }

  if (view === 'table') {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className='flex items-center justify-between'>
            <Typography variant='h5'>Daftar Fasilitas Aset</Typography>
            <Button variant='contained' onClick={handleAdd} startIcon={<i className='tabler-plus' />}>
              Tambah
            </Button>
          </div>
          <Typography className='mb-4'>Kelola daftar fasilitas aset</Typography>

          <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Icon</TableCell>
                  <TableCell>Nama Fasilitas</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fasilitas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align='center'>
                      Belum ada data fasilitas
                    </TableCell>
                  </TableRow>
                ) : (
                  fasilitas.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <i className={item.icon?.code || 'tabler-question-mark'} style={{ fontSize: '24px' }} />
                      </TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Tooltip title='Ubah'>
                            <IconButton
                              aria-label='Ubah'
                              className='flex'
                              onClick={() => handleEdit(item)}
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
                              onClick={() => handleDelete(item.id!)}
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
              color='primary'
              onClick={handleNext}
              endIcon={<DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />}
            >
              Next
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
        <Typography variant='h5'>{editingId ? 'Edit Fasilitas' : 'Tambah Fasilitas'}</Typography>
        <Typography>Silakan lengkapi detail fasilitas aset.</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CustomTextField
          fullWidth
          label='Nama Fasilitas'
          placeholder='Contoh: WiFi, AC, Parkir'
          value={nama}
          onChange={e => setNama(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          options={icons}
          getOptionLabel={option => option.nama}
          value={selectedIcon}
          onChange={(_, newValue) => setSelectedIcon(newValue)}
          renderInput={params => <CustomTextField {...params} label='Icon' placeholder='Pilih Icon' />}
          renderOption={(props, option) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { key, ...otherProps } = props

            return (
              <li key={option.id} {...otherProps}>
                <i className={option.code} style={{ marginRight: 8, fontSize: '20px' }} />
                {option.nama}
              </li>
            )
          }}
        />
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

export default StepFasilitasDetails
