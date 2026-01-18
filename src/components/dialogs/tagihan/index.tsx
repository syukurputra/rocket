'use client'

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import Snackbar from '@mui/material/Snackbar'

import Alert from '@mui/material/Alert'

import { differenceInMonths } from 'date-fns'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { TagihanClient } from '@/src/types/apps/tagihanTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

import AppReactDatepicker from '@/src/libs/styles/AppReactDatepicker'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: TagihanClient | null
  onSaved?: (data: TagihanClient) => void
  penghuniId?: string
}

type FormValues = {
  id?: string
  keterangan: string
  status: string
  metodeBayar: string
  buktiPembayaran: string
  mulaiSewa: Date | null
  selesaiSewa: Date | null
  nominal: number
}

const DEFAULTS: FormValues = {
  keterangan: '',
  status: 'BELUM TERBAYAR',
  metodeBayar: '',
  buktiPembayaran: '',
  mulaiSewa: new Date(),
  selesaiSewa: new Date(),
  nominal: 0
}

export default function AddEditTagihan({ open, setOpen, mode = 'create', initialData, onSaved, penghuniId }: Props) {
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })
  const [roomPrice, setRoomPrice] = useState<number>(0)

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
  }

  // Fetch Penghuni Data to get Room Price
  useEffect(() => {
    if (!open || !penghuniId) return

    const fetchPenghuniData = async () => {
      try {
        setLoading(true)
        const response = await apiFetchClient<any>(`/api/penghuni/${penghuniId}`)

        if (response.data && response.data.ruangan) {
          setRoomPrice(Number(response.data.ruangan.nominal) || 0)
        }
      } catch (error) {
        console.error('Failed to fetch penghuni details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPenghuniData()
  }, [open, penghuniId])

  // Auto-calculate logic
  useEffect(() => {
    if (form.mulaiSewa && form.selesaiSewa && roomPrice > 0) {
      // Calculate months inclusively
      // Example: 19 Feb to 18 Jul = 5 months (Feb-Mar, Mar-Apr, Apr-May, May-Jun, Jun-Jul)
      let months = differenceInMonths(form.selesaiSewa, form.mulaiSewa)

      // Add 1 for inclusive counting (start month counts as 1)
      months = months + 1

      // Ensure at least 1 month if dates are valid
      if (months < 1 && form.selesaiSewa >= form.mulaiSewa) {
        months = 1
      } else if (months < 0) {
        months = 0
      }

      const total = months * roomPrice

      setForm(prev => ({ ...prev, nominal: total }))

      // Auto-generate Keterangan if empty? Maybe.
    }
  }, [form.mulaiSewa, form.selesaiSewa, roomPrice])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialData) {
      setForm({
        id: initialData.id,
        keterangan: initialData.keterangan || '',
        status: initialData.status || 'BELUM TERBAYAR',
        metodeBayar: initialData.metodeBayar || '',
        buktiPembayaran: initialData.buktiPembayaran || '',
        mulaiSewa: initialData.mulaiSewa ? new Date(initialData.mulaiSewa) : new Date(),
        selesaiSewa: initialData.selesaiSewa ? new Date(initialData.selesaiSewa) : new Date(),
        nominal: Number(initialData.nominal) || 0
      })
    } else {
      setForm(DEFAULTS)
    }
  }, [open, mode, initialData])

  const handleSubmit = async () => {
    if (!form.keterangan || !form.mulaiSewa || !form.selesaiSewa) {
      setSnack({ open: true, message: 'Mohon lengkapi semua field yang diperlukan', severity: 'error' })

      return
    }

    setSaving(true)

    try {
      if (mode === 'edit' && form.id) {
        // PUT request for editing
        const json = await apiFetchClient<{ data: TagihanClient; message?: string }>(`/api/tagihan/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            keterangan: form.keterangan,
            status: form.status,
            metodeBayar: form.metodeBayar,
            buktiPembayaran: form.buktiPembayaran,
            mulaiSewa: form.mulaiSewa.toISOString(),
            selesaiSewa: form.selesaiSewa.toISOString(),
            nominal: form.nominal
          })
        })

        setOpen(false)
        setSaving(false)
        setSnack({ open: true, message: json.message ?? 'Tagihan berhasil diupdate', severity: 'success' })
        onSaved?.(json.data)
        window.location.reload()
      } else {
        // POST request for creating
        const json = await apiFetchClient<{ data: TagihanClient; message?: string }>(`/api/tagihan`, {
          method: 'POST',
          body: JSON.stringify({
            keterangan: form.keterangan,
            status: form.status, // API might not take status in POST, defaults to BELUM TERBAYAR. But check route.
            mulaiSewa: form.mulaiSewa.toISOString(),
            selesaiSewa: form.selesaiSewa.toISOString(),
            nominal: form.nominal,
            penghuniId: penghuniId
          })
        })

        setOpen(false)
        setSaving(false)
        setSnack({ open: true, message: json.message ?? 'Tagihan berhasil ditambahkan', severity: 'success' })
        onSaved?.(json.data)
        window.location.reload() // Or router.refresh()
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'

      setSnack({ open: true, message: msg, severity: 'error' })
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        maxWidth='md'
        scroll='body'
        closeAfterTransition={false}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          {mode === 'edit' ? 'Ubah Tagihan' : 'Tambah Tagihan'}
        </DialogTitle>
        <form
          onSubmit={e => {
            e.preventDefault()
            if (!saving) handleSubmit()
          }}
        >
          <DialogContent className='pbs-0 sm:pli-16'>
            <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
              <i className='tabler-x' />
            </DialogCloseButton>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <AppReactDatepicker
                  selected={form.mulaiSewa}
                  onChange={(date: Date | null) => setForm(prev => ({ ...prev, mulaiSewa: date }))}
                  placeholderText='MM/DD/YYYY'
                  customInput={
                    <CustomTextField fullWidth label='Tanggal Mulai Huni' placeholder='MM-DD-YYYY' required />
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <AppReactDatepicker
                  selected={form.selesaiSewa}
                  onChange={(date: Date | null) => setForm(prev => ({ ...prev, selesaiSewa: date }))}
                  placeholderText='MM/DD/YYYY'
                  customInput={
                    <CustomTextField fullWidth label='Tanggal Selesai Huni' placeholder='MM-DD-YYYY' required />
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Keterangan'
                  name='keterangan'
                  variant='outlined'
                  placeholder='Contoh: Tagihan Januari 2026'
                  value={form.keterangan}
                  onChange={handleChange('keterangan')}
                  required
                />
              </Grid>
              {mode === 'edit' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      select
                      fullWidth
                      label='Status'
                      name='status'
                      value={form.status}
                      onChange={handleChange('status')}
                    >
                      <MenuItem value='BELUM TERBAYAR'>Belum Terbayar</MenuItem>
                      <MenuItem value='LUNAS'>Lunas</MenuItem>
                    </CustomTextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      select
                      fullWidth
                      label='Metode Bayar'
                      name='metodeBayar'
                      value={form.metodeBayar}
                      onChange={handleChange('metodeBayar')}
                    >
                      <MenuItem value=''>Pilih Metode</MenuItem>
                      <MenuItem value='transfer'>Transfer</MenuItem>
                      <MenuItem value='cash'>Cash</MenuItem>
                    </CustomTextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    {form.buktiPembayaran ? (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Button
                            variant='outlined'
                            fullWidth
                            startIcon={<i className='tabler-eye' />}
                            onClick={() => window.open(form.buktiPembayaran, '_blank')}
                          >
                            Lihat
                          </Button>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Button
                            variant='outlined'
                            fullWidth
                            startIcon={<i className='tabler-download' />}
                            component='a'
                            href={form.buktiPembayaran}
                            download
                          >
                            Download
                          </Button>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Button
                            component='label'
                            variant='outlined'
                            fullWidth
                            startIcon={<i className='tabler-refresh' />}
                            disabled={saving}
                          >
                            Upload Ulang
                            <input
                              type='file'
                              hidden
                              accept='image/*,.pdf'
                              onChange={async e => {
                                const file = e.target.files?.[0]

                                if (file) {
                                  try {
                                    setSaving(true)
                                    const formData = new FormData()

                                    formData.append('file', file)

                                    // Add tagihan ID for filename
                                    if (form.id) {
                                      formData.append('tagihanId', form.id)
                                    }

                                    // Add old file path for deletion
                                    if (form.buktiPembayaran) {
                                      formData.append('oldFilePath', form.buktiPembayaran)
                                    }

                                    // Get token from localStorage
                                    const token = localStorage.getItem('accessToken')

                                    const response = await fetch('/api/upload/bukti-pembayaran', {
                                      method: 'POST',
                                      body: formData,
                                      headers: {
                                        Authorization: `Bearer ${token}`
                                      }
                                    })

                                    if (!response.ok) {
                                      const errorData = await response.json()

                                      throw new Error(errorData.message || 'Upload failed')
                                    }

                                    const data = await response.json()

                                    setForm(prev => ({ ...prev, buktiPembayaran: data.url }))
                                    setSnack({
                                      open: true,
                                      message: 'File berhasil diupload ulang',
                                      severity: 'success'
                                    })
                                  } catch (error) {
                                    console.error('Upload error:', error)
                                    const errorMsg = error instanceof Error ? error.message : 'Gagal upload file'

                                    setSnack({ open: true, message: errorMsg, severity: 'error' })
                                  } finally {
                                    setSaving(false)
                                  }
                                }
                              }}
                            />
                          </Button>
                        </Grid>
                      </Grid>
                    ) : (
                      <Button
                        component='label'
                        variant='outlined'
                        fullWidth
                        startIcon={<i className='tabler-upload' />}
                        disabled={saving}
                      >
                        Upload Bukti Pembayaran
                        <input
                          type='file'
                          hidden
                          accept='image/*,.pdf'
                          onChange={async e => {
                            const file = e.target.files?.[0]

                            if (file) {
                              try {
                                setSaving(true)
                                const formData = new FormData()

                                formData.append('file', file)

                                // Add tagihan ID for filename
                                if (form.id) {
                                  formData.append('tagihanId', form.id)
                                }

                                // Add old file path for deletion
                                if (form.buktiPembayaran) {
                                  formData.append('oldFilePath', form.buktiPembayaran)
                                }

                                // Get token from localStorage
                                const token = localStorage.getItem('accessToken')

                                const response = await fetch('/api/upload/bukti-pembayaran', {
                                  method: 'POST',
                                  body: formData,
                                  headers: {
                                    Authorization: `Bearer ${token}`
                                  }
                                })

                                if (!response.ok) {
                                  const errorData = await response.json()

                                  throw new Error(errorData.message || 'Upload failed')
                                }

                                const data = await response.json()

                                setForm(prev => ({ ...prev, buktiPembayaran: data.url }))
                                setSnack({ open: true, message: 'File berhasil diupload', severity: 'success' })
                              } catch (error) {
                                console.error('Upload error:', error)
                                const errorMsg = error instanceof Error ? error.message : 'Gagal upload file'

                                setSnack({ open: true, message: errorMsg, severity: 'error' })
                              } finally {
                                setSaving(false)
                              }
                            }
                          }}
                        />
                      </Button>
                    )}
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              variant='contained'
              type='submit'
              disabled={saving || !form.keterangan || !form.mulaiSewa || !form.selesaiSewa}
            >
              {mode === 'edit' ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: theme => theme.zIndex.snackbar + 1 }}
      >
        <Alert onClose={handleSnackClose} severity={snack.severity} variant='filled' sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  )
}
