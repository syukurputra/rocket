'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

type PhoneNumberModalProps = {
  open: boolean
  onSubmit: (phoneNumber: string, name: string) => Promise<void>
}

const PhoneNumberModal = ({ open, onSubmit }: PhoneNumberModalProps) => {
  const [nomorTelepon, setNomorTelepon] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')

    if (!name.trim()) {
      setError('Nama wajib diisi')
      return
    }

    if (!nomorTelepon.trim()) {
      setError('Nomor telepon wajib diisi')
      return
    }

    const phoneRegex = /^(\+62|62|08)[0-9]{8,12}$/
    if (!phoneRegex.test(nomorTelepon)) {
      setError('Format nomor telepon tidak valid. Gunakan format +62 atau 08')
      return
    }

    setLoading(true)

    try {
      await onSubmit(nomorTelepon, name)
    } catch (err) {
      setError('Gagal menyimpan data. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      maxWidth='sm'
      fullWidth
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason === 'backdropClick') return false
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          Lengkapi Data Anda
        </Typography>
        <Typography variant='body2' color='text.secondary' component='p'>
          Masukkan nama dan nomor telepon untuk melengkapi pendaftaran
        </Typography>
      </DialogTitle>
      <DialogContent>
        <div className='flex flex-col gap-4 pbs-4'>
          {error && <div className='p-4 rounded-lg bg-red-50 border border-red-200 text-red-800'>{error}</div>}
          <CustomTextField
            autoFocus
            fullWidth
            label='Nama Lengkap'
            placeholder='Masukkan nama lengkap Anda'
            value={name}
            onChange={e => setName(e.target.value)}
            required
            onKeyPress={e => { if (e.key === 'Enter') handleSubmit() }}
          />
          <CustomTextField
            fullWidth
            label='Nomor Telepon'
            placeholder='Contoh: +6281234567890 atau 081234567890'
            value={nomorTelepon}
            onChange={e => setNomorTelepon(e.target.value)}
            required
            helperText='Format: +62 atau 08 diikuti 8-12 digit'
            onKeyPress={e => { if (e.key === 'Enter') handleSubmit() }}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color='inherit' /> : null}
        >
          {loading ? 'Menyimpan...' : 'Lanjutkan'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PhoneNumberModal
