'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

const getDefaultStartDate = () => {
  const now = new Date()

  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

const getDefaultEndDate = () => {
  const now = new Date()

  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
}

type AsetOption = { id: string; nama: string; jenis: string }
type KategoriOption = { id: string; nama: string; jenis: string }

export type FilterValues = {
  startDate: string
  endDate: string
  jenis: string
  asetId: string
  categoryKeuanganId: string
}

type TableFiltersProps = {
  onFilterChange: (filters: FilterValues) => void
}

const TableFilters = ({ onFilterChange }: TableFiltersProps) => {
  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [endDate, setEndDate] = useState(getDefaultEndDate())
  const [jenis, setJenis] = useState('')
  const [asetId, setAsetId] = useState('')
  const [categoryKeuanganId, setCategoryKeuanganId] = useState('')

  const [asetOptions, setAsetOptions] = useState<AsetOption[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<KategoriOption[]>([])

  useEffect(() => {
    apiFetchClient<{ data: AsetOption[] }>('/api/aset?limit=999', undefined, { redirectOn401: '/login' })
      .then(res => setAsetOptions(res.data || []))
      .catch(() => {})

    apiFetchClient<{ data: KategoriOption[] }>('/api/setting/category-keuangan?limit=999', undefined, {
      redirectOn401: '/login'
    })
      .then(res => setKategoriOptions(res.data || []))
      .catch(() => {})
  }, [])

  // Filter kategori berdasarkan jenis yang dipilih
  const filteredKategoriOptions = useMemo(() => {
    if (!jenis) return kategoriOptions

    return kategoriOptions.filter(k => k.jenis.toLowerCase() === jenis.toLowerCase())
  }, [kategoriOptions, jenis])

  const emit = (overrides: Partial<FilterValues> = {}) => {
    onFilterChange({
      startDate,
      endDate,
      jenis,
      asetId,
      categoryKeuanganId,
      ...overrides
    })
  }

  return (
    <CardContent>
      <Grid container spacing={4}>
        {/* Dari Tanggal */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <CustomTextField
            type='date'
            fullWidth
            label='Dari Tanggal'
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value)
              emit({ startDate: e.target.value })
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: endDate || undefined }}
          />
        </Grid>

        {/* Sampai Tanggal */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <CustomTextField
            type='date'
            fullWidth
            label='Sampai Tanggal'
            value={endDate}
            onChange={e => {
              setEndDate(e.target.value)
              emit({ endDate: e.target.value })
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: startDate || undefined }}
          />
        </Grid>

        {/* Jenis */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <CustomTextField
            select
            fullWidth
            label='Jenis'
            value={jenis}
            onChange={e => {
              setJenis(e.target.value)
              // reset kategori saat jenis berubah
              setCategoryKeuanganId('')
              emit({ jenis: e.target.value, categoryKeuanganId: '' })
            }}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value=''>Semua Jenis</MenuItem>
            <MenuItem value='pemasukan'>Pemasukan</MenuItem>
            <MenuItem value='pengeluaran'>Pengeluaran</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Aset */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <CustomTextField
            select
            fullWidth
            label='Aset'
            value={asetId}
            onChange={e => {
              setAsetId(e.target.value)
              emit({ asetId: e.target.value })
            }}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value=''>Semua Aset</MenuItem>
            {asetOptions.map(a => (
              <MenuItem key={a.id} value={a.id}>
                {a.jenis} - {a.nama}
              </MenuItem>
            ))}
          </CustomTextField>
        </Grid>

        {/* Kategori */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <CustomTextField
            select
            fullWidth
            label='Kategori'
            value={categoryKeuanganId}
            onChange={e => {
              setCategoryKeuanganId(e.target.value)
              emit({ categoryKeuanganId: e.target.value })
            }}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value=''>Semua Kategori</MenuItem>
            {filteredKategoriOptions.map(k => (
              <MenuItem key={k.id} value={k.id}>
                {k.nama}
              </MenuItem>
            ))}
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
