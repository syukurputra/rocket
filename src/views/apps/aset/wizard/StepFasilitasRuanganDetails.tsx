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

type RuanganData = {
  id: string
  nama: string
}

type FasilitasRuanganData = {
  id?: string
  nama: string
  iconId: string
  ruanganId: string
  icon?: IconData
  ruangan?: RuanganData
}

const StepFasilitasRuanganDetails = ({ activeStep, handleNext, handlePrev, steps, asetId, onShowMessage }: Props) => {
  // View State
  const [view, setView] = useState<'table' | 'form'>('table')
  const [fasilitas, setFasilitas] = useState<FasilitasRuanganData[]>([])
  const [ruangans, setRuangans] = useState<RuanganData[]>([])
  const [icons, setIcons] = useState<IconData[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [nama, setNama] = useState('')
  const [selectedRuangan, setSelectedRuangan] = useState<RuanganData | null>(null)
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null)

  useEffect(() => {
    fetchIcons()

    if (asetId) {
      fetchRuangans()
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

  const fetchRuangans = async () => {
    try {
      const res = await apiFetchClient<{ data: RuanganData[] }>(`/api/ruangan?asetId=${asetId}`)

      if (res.data) {
        setRuangans(res.data)
      }
    } catch (error) {
      console.error('Error fetching ruangans:', error)
    }
  }

  const fetchFasilitas = async () => {
    try {
      setLoading(true)
      const res = await apiFetchClient<{ data: FasilitasRuanganData[] }>(`/api/fasilitas-ruangan?asetId=${asetId}`)

      if (res.data) {
        setFasilitas(res.data)
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

  const handleEdit = (item: FasilitasRuanganData) => {
    setEditingId(item.id!)
    setNama(item.nama)
    setSelectedRuangan(item.ruangan || null)
    setSelectedIcon(item.icon || null)
    setView('form')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus fasilitas ini?')) {
      try {
        await apiFetchClient(`/api/fasilitas-ruangan/${id}`, { method: 'DELETE' })
        fetchFasilitas()
      } catch (error) {
        console.error('Error deleting fasilitas:', error)
        onShowMessage?.('Gagal menghapus fasilitas.', 'error')
      }
    }
  }

  const resetForm = () => {
    setNama('')
    setSelectedRuangan(null)
    setSelectedIcon(null)
  }

  const handleSubmit = async () => {
    if (!nama || !selectedRuangan || !selectedIcon) {
      onShowMessage?.('Semua field harus diisi', 'error')

      return
    }

    const data = {
      nama,
      ruanganId: selectedRuangan.id,
      iconId: selectedIcon.id
    }

    try {
      if (editingId) {
        // Update
        await apiFetchClient(`/api/fasilitas-ruangan/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        })
      } else {
        // Create
        await apiFetchClient(`/api/fasilitas-ruangan`, {
          method: 'POST',
          body: JSON.stringify(data)
        })
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
            <Typography variant='h5'>Daftar Fasilitas Item Aset</Typography>
            <Button variant='contained' onClick={handleAdd} startIcon={<i className='tabler-plus' />}>
              Tambah
            </Button>
          </div>
          <Typography className='mb-4'>Kelola daftar fasilitas item aset</Typography>

          <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Aset</TableCell>
                  <TableCell>Icon</TableCell>
                  <TableCell>Nama Fasilitas</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fasilitas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>
                      Belum ada data fasilitas item aset
                    </TableCell>
                  </TableRow>
                ) : (
                  fasilitas.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.ruangan?.nama || '-'}</TableCell>
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
        <Typography variant='h5'>{editingId ? 'Ubah Fasilitas Item Aset' : 'Tambah Fasilitas Item Aset'}</Typography>
        <Typography>Silakan lengkapi detail fasilitas item aset.</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          options={ruangans}
          getOptionLabel={option => option.nama}
          value={selectedRuangan}
          onChange={(_, newValue) => setSelectedRuangan(newValue)}
          renderInput={params => <CustomTextField {...params} label='Item Aset' placeholder='Pilih Item Aset' />}
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
        <CustomTextField
          fullWidth
          label='Nama Fasilitas'
          placeholder='Contoh: AC, WiFi, TV'
          value={nama}
          onChange={e => setNama(e.target.value)}
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

export default StepFasilitasRuanganDetails
