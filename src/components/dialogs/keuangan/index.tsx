'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

import Typography from '@mui/material/Typography'

import { styled } from '@mui/material/styles'

import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import type { KeuanganClient } from '@/src/types/apps/keuanganTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

import AppReactDatepicker from '@/src/libs/styles/AppReactDatepicker'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: KeuanganClient | null
  onSaved?: (data: KeuanganClient) => void
}

type FormValues = {
  id?: string
  jenis: string
  keterangan: string
  nominal: number
  asetId: string
  categoryKeuanganId: string
  tanggal: Date | null
}

const JENIS_OPTIONS = [
  { label: 'Jenis Keuangan', value: '' },
  { label: 'Pemasukan', value: 'pemasukan' },
  { label: 'Pengeluaran', value: 'pengeluaran' }
]

type AsetOption = {
  id: string
  nama: string
  jenis: string
}

type CategoryOption = {
  id: string
  nama: string
  deskripsi: string | null
  color: string | null
  jenis: string
  icon: {
    id: string
    nama: string
    code: string
  } | null
}

const DEFAULTS: FormValues = {
  jenis: '',
  keterangan: '',
  nominal: 0.0,
  asetId: '',
  categoryKeuanganId: '',
  tanggal: new Date()
}

const Icon = styled('i')({})

export default function AddEditKeuangan({ open, setOpen, mode = 'create', initialData, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  const [asetOptions, setAsetOptions] = useState<AsetOption[]>([])
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [allCategories, setAllCategories] = useState<CategoryOption[]>([])

  // Load initial data saat dialog dibuka
  useEffect(() => {
    if (!open) return

    const loadInitialData = async () => {
      setLoading(true)

      try {
        // Load aset options
        const asetResponse = await apiFetchClient<{ data: AsetOption[] }>('/api/aset/dp')

        setAsetOptions(asetResponse.data || [])

        // Load all categories untuk referensi
        try {
          const categoryResponse = await apiFetchClient<{ data: CategoryOption[] }>('/api/setting/category-keuangan/dp')

          setAllCategories(categoryResponse.data || [])
        } catch (categoryError) {
          const fallbackCategories: CategoryOption[] = [
            {
              id: 'temp-1',
              nama: 'Kategori 1',
              deskripsi: null,
              color: 'primary',
              jenis: 'Pemasukan',
              icon: { id: '1', nama: 'Home', code: 'tabler-home' }
            },
            {
              id: 'temp-2',
              nama: 'Kategori 2',
              deskripsi: null,
              color: 'success',
              jenis: 'Pengeluaran',
              icon: { id: '2', nama: 'Cash', code: 'tabler-cash' }
            }
          ]

          setAllCategories(fallbackCategories)
        }

        // Set form data untuk mode edit
        if (mode === 'edit' && initialData) {
          const formData = {
            id: initialData.id,
            jenis: initialData.jenis ?? '',
            keterangan: initialData.keterangan ?? '',
            nominal: initialData.nominal ?? 0.0,
            asetId: initialData.asetId ?? '',
            categoryKeuanganId: initialData.categoryKeuanganId ?? '',
            tanggal: initialData.tanggal ? new Date(initialData.tanggal) : new Date()
          }

          setForm(formData)
        } else {
          setForm(DEFAULTS)
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        showSnack('Gagal memuat data dropdown', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [open, mode, initialData])

  // Filter category options based on selected jenis
  useEffect(() => {
    if (!form.jenis || allCategories.length === 0) {
      setCategoryOptions(allCategories)

      return
    }

    // Filter categories by jenis (case insensitive)
    const filtered = allCategories.filter(category => {
      if (!category.jenis) return false

      return category.jenis.toLowerCase() === form.jenis.toLowerCase()
    })

    setCategoryOptions(filtered)

    // Reset categoryKeuanganId if current selection is not in filtered list
    if (form.categoryKeuanganId) {
      const isValidCategory = filtered.some(cat => cat.id === form.categoryKeuanganId)

      if (!isValidCategory) {
        setForm(prev => ({ ...prev, categoryKeuanganId: '' }))
      }
    }
  }, [form.jenis, allCategories])

  const handleChange = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (key === 'nominal') {
      const rawValue = e.target.value.replace(/[^\d.]/g, '')
      const numericValue = parseFloat(rawValue) || 0

      setForm(prev => ({ ...prev, [key]: numericValue }))
    } else {
      setForm(prev => ({ ...prev, [key]: e.target.value }))
    }
  }

  const formatNumber = (num: number): string => {
    if (!num) return ''

    return num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[^\d,]/g, '')

    rawValue = rawValue.replace(',', '.')
    const numericValue = parseFloat(rawValue) || 0

    setForm(prev => ({ ...prev, nominal: numericValue }))
  }

  const handleSubmit = async () => {
    if (!form.jenis || !form.asetId || !form.categoryKeuanganId || form.nominal <= 0 || !form.tanggal) {
      showSnack('Mohon lengkapi semua field yang diperlukan', 'error')

      return
    }

    setSaving(true)

    try {
      if (mode === 'edit' && form.id) {
        const json = await apiFetchClient<{ data: KeuanganClient; message?: string }>(`/api/keuangan/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            jenis: form.jenis,
            keterangan: form.keterangan,
            nominal: form.nominal,
            asetId: form.asetId,
            categoryKeuanganId: form.categoryKeuanganId,
            tanggal: form.tanggal.toISOString()
          })
        })

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        showSnack(json.message ?? 'Keuangan berhasil diupdate')

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
      } else {
        const json = await apiFetchClient<{ data: KeuanganClient; message?: string }>(`/api/keuangan`, {
          method: 'POST',
          body: JSON.stringify({
            jenis: form.jenis,
            keterangan: form.keterangan,
            nominal: form.nominal,
            asetId: form.asetId,
            categoryKeuanganId: form.categoryKeuanganId,
            tanggal: form.tanggal.toISOString()
          })
        })

        // Close dialog immediately for better UX
        setOpen(false)
        setSaving(false)

        showSnack(json.message ?? 'Keuangan berhasil ditambahkan')

        // Callback and refresh in background
        onSaved?.(json.data)
        setTimeout(() => router.refresh(), 300)
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
          {mode === 'edit' ? 'Ubah Keuangan' : 'Tambah Keuangan'}
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
                <CustomTextField
                  select
                  fullWidth
                  label='Jenis Keuangan'
                  name='jenis'
                  variant='outlined'
                  value={form.jenis}
                  onChange={handleChange('jenis')}
                >
                  {JENIS_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Pilih Aset'
                  name='asetId'
                  variant='outlined'
                  value={form.asetId}
                  onChange={handleChange('asetId')}
                  disabled={loading}
                >
                  <MenuItem value=''>
                    <em>Pilih Aset</em>
                  </MenuItem>
                  {asetOptions.map(aset => (
                    <MenuItem key={aset.id} value={aset.id}>
                      {aset.jenis} - {aset.nama}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Kategori Keuangan'
                  name='categoryKeuanganId'
                  variant='outlined'
                  value={form.categoryKeuanganId}
                  onChange={handleChange('categoryKeuanganId')}
                  disabled={loading}
                >
                  <MenuItem value=''>
                    <em>Pilih Kategori</em>
                  </MenuItem>
                  {categoryOptions.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      <div className='flex items-center gap-2'>
                        {category.icon && (
                          <Icon
                            className={category.icon.code}
                            sx={{ color: category.color ? `var(--mui-palette-${category.color})` : 'inherit' }}
                          />
                        )}
                        <Typography className='capitalize' color='text.primary'>
                          {category.nama}
                        </Typography>
                      </div>
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <AppReactDatepicker
                  selected={form.tanggal}
                  onChange={(date: Date | null) => setForm(prev => ({ ...prev, tanggal: date }))}
                  placeholderText='MM/DD/YYYY'
                  customInput={
                    <CustomTextField fullWidth label='Tanggal Transaksi' placeholder='MM-DD-YYYY' required />
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Keterangan'
                  name='keterangan'
                  variant='outlined'
                  placeholder='Keterangan'
                  value={form.keterangan}
                  onChange={handleChange('keterangan')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Nominal'
                  placeholder='10.000.000'
                  value={formatNumber(form.nominal)}
                  onChange={handleNominalChange}
                  disabled={loading}
                  inputProps={{
                    inputMode: 'decimal',
                    pattern: '[0-9.,]*'
                  }}
                  helperText='Contoh: 10.000.000'
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
            <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={saving || !form.jenis || !form.nominal}>
              {mode === 'edit' ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}
