'use client'

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'

import Alert from '@mui/material/Alert'

import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { TagihanClient } from '@/src/types/apps/tagihanTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

import AppReactDatepicker from '@/src/libs/styles/AppReactDatepicker'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: TagihanClient | null
  onSaved?: (data: TagihanClient) => void
  penyewaId?: string
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
  jumlahBulan?: number
  jumlahTahun?: number
}

const DEFAULTS: FormValues = {
  keterangan: '',
  status: 'BELUM TERBAYAR',
  metodeBayar: '',
  buktiPembayaran: '',
  mulaiSewa: new Date(),
  selesaiSewa: new Date(),
  nominal: 0,
  jumlahBulan: 1,
  jumlahTahun: 1
}

export default function AddEditTagihan({ open, setOpen, mode = 'create', initialData, onSaved, penyewaId }: Props) {
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  // New state for periode sewa and pricing
  const [periodeSewa, setPeriodeSewa] = useState<string>('')

  const [ruanganPricing, setRuanganPricing] = useState({
    hargaHarian: 0,
    hargaBulanan: 0,
    hargaTahunan: 0
  })

  // Fetch Penyewa Data to get Periode Sewa and Room Pricing
  useEffect(() => {
    if (!open || !penyewaId) return

    const fetchPenyewaData = async () => {
      try {
        setLoading(true)
        const response = await apiFetchClient<any>(`/api/penyewa/${penyewaId}`)

        if (response.data) {
          // Set periode sewa
          setPeriodeSewa(response.data.periodeSewa || '')

          // Set ruangan pricing
          if (response.data.ruangan) {
            setRuanganPricing({
              hargaHarian: Number(response.data.ruangan.hargaHarian) || 0,
              hargaBulanan: Number(response.data.ruangan.hargaBulanan) || 0,
              hargaTahunan: Number(response.data.ruangan.hargaTahunan) || 0
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch penyewa details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPenyewaData()
  }, [open, penyewaId])

  // Auto-calculate end date for bulanan and tahunan
  useEffect(() => {
    if (!form.mulaiSewa) return

    if (periodeSewa === 'bulanan' && form.jumlahBulan) {
      const endDate = new Date(form.mulaiSewa)

      endDate.setMonth(endDate.getMonth() + form.jumlahBulan)
      setForm(prev => ({ ...prev, selesaiSewa: endDate }))
    } else if (periodeSewa === 'tahunan' && form.jumlahTahun) {
      const endDate = new Date(form.mulaiSewa)

      endDate.setFullYear(endDate.getFullYear() + form.jumlahTahun)
      setForm(prev => ({ ...prev, selesaiSewa: endDate }))
    }
  }, [form.mulaiSewa, form.jumlahBulan, form.jumlahTahun, periodeSewa])

  // Auto-calculate nominal based on periode sewa (only in create mode)
  useEffect(() => {
    if (mode === 'edit') return
    if (!form.mulaiSewa || !form.selesaiSewa) return

    let calculatedNominal = 0

    if (periodeSewa === 'harian') {
      const diffTime = Math.abs(form.selesaiSewa.getTime() - form.mulaiSewa.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      calculatedNominal = diffDays * ruanganPricing.hargaHarian
    } else if (periodeSewa === 'bulanan' && form.jumlahBulan) {
      calculatedNominal = form.jumlahBulan * ruanganPricing.hargaBulanan
    } else if (periodeSewa === 'tahunan' && form.jumlahTahun) {
      calculatedNominal = form.jumlahTahun * ruanganPricing.hargaTahunan
    }

    setForm(prev => ({ ...prev, nominal: calculatedNominal }))
  }, [form.mulaiSewa, form.selesaiSewa, form.jumlahBulan, form.jumlahTahun, periodeSewa, ruanganPricing, mode])

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
      showSnack('Mohon lengkapi semua field yang diperlukan', 'error')

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
        showSnack(json.message ?? 'Tagihan berhasil diupdate')
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
            penyewaId: penyewaId
          })
        })

        setOpen(false)
        setSaving(false)
        showSnack(json.message ?? 'Tagihan berhasil ditambahkan')
        onSaved?.(json.data)
        window.location.reload() // Or router.refresh()
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'

      showSnack(msg, 'error')
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
              {/* Conditional fields based on periode sewa */}
              {periodeSewa === 'harian' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <AppReactDatepicker
                      selected={form.mulaiSewa}
                      onChange={(date: Date | null) => setForm(prev => ({ ...prev, mulaiSewa: date }))}
                      placeholderText='MM/DD/YYYY'
                      customInput={
                        <CustomTextField fullWidth label='Tanggal Mulai' placeholder='MM-DD-YYYY' required />
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <AppReactDatepicker
                      selected={form.selesaiSewa}
                      onChange={(date: Date | null) => setForm(prev => ({ ...prev, selesaiSewa: date }))}
                      placeholderText='MM/DD/YYYY'
                      customInput={
                        <CustomTextField fullWidth label='Tanggal Selesai' placeholder='MM-DD-YYYY' required />
                      }
                    />
                  </Grid>
                </>
              )}

              {periodeSewa === 'bulanan' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <AppReactDatepicker
                      selected={form.mulaiSewa}
                      onChange={(date: Date | null) => setForm(prev => ({ ...prev, mulaiSewa: date }))}
                      placeholderText='MM/DD/YYYY'
                      customInput={
                        <CustomTextField fullWidth label='Tanggal Mulai' placeholder='MM-DD-YYYY' required />
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Jumlah Bulan'
                      value={form.jumlahBulan || 1}
                      onChange={e => setForm(prev => ({ ...prev, jumlahBulan: parseInt(e.target.value) || 1 }))}
                      inputProps={{ min: 1 }}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      label='Tanggal Selesai (Otomatis)'
                      value={form.selesaiSewa ? form.selesaiSewa.toLocaleDateString('id-ID') : ''}
                      disabled
                    />
                  </Grid>
                </>
              )}

              {periodeSewa === 'tahunan' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <AppReactDatepicker
                      selected={form.mulaiSewa}
                      onChange={(date: Date | null) => setForm(prev => ({ ...prev, mulaiSewa: date }))}
                      placeholderText='MM/DD/YYYY'
                      customInput={
                        <CustomTextField fullWidth label='Tanggal Mulai' placeholder='MM-DD-YYYY' required />
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Jumlah Tahun'
                      value={form.jumlahTahun || 1}
                      onChange={e => setForm(prev => ({ ...prev, jumlahTahun: parseInt(e.target.value) || 1 }))}
                      inputProps={{ min: 1 }}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      label='Tanggal Selesai (Otomatis)'
                      value={form.selesaiSewa ? form.selesaiSewa.toLocaleDateString('id-ID') : ''}
                      disabled
                    />
                  </Grid>
                </>
              )}

              {/* Fallback if periode sewa not set */}
              {!periodeSewa && !loading && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity='warning'>
                    Periode sewa belum diset untuk penyewa ini. Silakan set periode sewa terlebih dahulu di form
                    penyewa.
                  </Alert>
                </Grid>
              )}

              {/* Show nominal field */}
              <Grid size={{ xs: 12 }}>
                {mode === 'edit' ? (
                  <CustomTextField
                    fullWidth
                    label='Nominal'
                    type='number'
                    value={form.nominal}
                    onChange={e => setForm(prev => ({ ...prev, nominal: Number(e.target.value) || 0 }))}
                    inputProps={{ min: 0 }}
                  />
                ) : (
                  <CustomTextField
                    fullWidth
                    label='Nominal (Otomatis)'
                    value={`Rp ${form.nominal.toLocaleString('id-ID')}`}
                    disabled
                  />
                )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Keterangan'
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
                                    showSnack('File berhasil diupload ulang')
                                  } catch (error) {
                                    console.error('Upload error:', error)
                                    const errorMsg = error instanceof Error ? error.message : 'Gagal upload file'

                                    showSnack(errorMsg, 'error')
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
                                showSnack('File berhasil diupload')
                              } catch (error) {
                                console.error('Upload error:', error)
                                const errorMsg = error instanceof Error ? error.message : 'Gagal upload file'

                                showSnack(errorMsg, 'error')
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
      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}
