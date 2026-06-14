'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Collapse from '@mui/material/Collapse'
import Grid from '@mui/material/Grid2'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

import type { ButtonProps } from '@mui/material/Button'

import dayjs from 'dayjs'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

import type { KeuanganClient } from '@/src/types/apps/keuanganTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import AddEditKeuangan from '@components/dialogs/keuangan'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

type KeuanganClientWithAction = KeuanganClient & { action?: string }

// Column Definitions
const columnHelper = createColumnHelper<KeuanganClientWithAction>()

interface KeuanganListTableProps {
  initialData?: KeuanganClient[]
  onFiltersChange?: (filters: any) => void
}

const KeuanganListTable = ({ initialData = [], onFiltersChange }: KeuanganListTableProps) => {
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<KeuanganClientWithAction[]>(initialData)
  const [filteredData, setFilteredData] = useState<KeuanganClientWithAction[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('') // New state for API search

  const getDefaultStartDate = () => {
    const now = new Date()

    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  }

  const getDefaultEndDate = () => {
    const now = new Date()

    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  }

  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [endDate, setEndDate] = useState(getDefaultEndDate())
  const [jenis, setJenis] = useState('')
  const [asetId, setAsetId] = useState('')
  const [categoryKeuanganId, setCategoryKeuanganId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0) // Table uses 0-based indexing
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCountState, setPageCountState] = useState(0) // jumlah halaman dari API

  const { snack, showSnack: showSnackbar, closeSnack } = useSnackbar()

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)
  const exportMenuOpen = Boolean(exportAnchorEl)

  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false)
  const [pendingStartDate, setPendingStartDate] = useState(getDefaultStartDate())
  const [pendingEndDate, setPendingEndDate] = useState(getDefaultEndDate())
  const [pendingJenis, setPendingJenis] = useState('')
  const [pendingAsetId, setPendingAsetId] = useState('')
  const [pendingCategoryId, setPendingCategoryId] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')

  const [asetOptions, setAsetOptions] = useState<{ id: string; nama: string; jenis: string }[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<{ id: string; nama: string; jenis: string }[]>([])

  useEffect(() => {
    apiFetchClient<{ data: { id: string; nama: string; jenis: string }[] }>('/api/aset?limit=999', undefined, { redirectOn401: '/login' })
      .then(res => setAsetOptions(res.data || []))
      .catch(() => {})
    apiFetchClient<{ data: { id: string; nama: string; jenis: string }[] }>('/api/setting/category-keuangan?limit=999', undefined, { redirectOn401: '/login' })
      .then(res => setKategoriOptions(res.data || []))
      .catch(() => {})
  }, [])

  const filteredKategoriOptions = useMemo(
    () => (!pendingJenis ? kategoriOptions : kategoriOptions.filter(k => k.jenis.toLowerCase() === pendingJenis.toLowerCase())),
    [kategoriOptions, pendingJenis]
  )

  const activeFilterCount = [
    pendingStartDate !== getDefaultStartDate(),
    pendingEndDate !== getDefaultEndDate(),
    pendingJenis,
    pendingAsetId,
    pendingCategoryId,
    pendingSearch
  ].filter(Boolean).length

  const handleApplyFilter = () => {
    setStartDate(pendingStartDate)
    setEndDate(pendingEndDate)
    setJenis(pendingJenis)
    setAsetId(pendingAsetId)
    setCategoryKeuanganId(pendingCategoryId)
    setSearchQuery(pendingSearch)
    setCurrentPage(0)
    fetchKeuanganData(0, pageSize, pendingSearch, pendingStartDate, pendingEndDate, pendingJenis, pendingAsetId, pendingCategoryId)
  }

  const handleResetFilter = () => {
    const s = getDefaultStartDate()
    const e = getDefaultEndDate()
    setPendingStartDate(s)
    setPendingEndDate(e)
    setPendingJenis('')
    setPendingAsetId('')
    setPendingCategoryId('')
    setPendingSearch('')
    setStartDate(s)
    setEndDate(e)
    setJenis('')
    setAsetId('')
    setCategoryKeuanganId('')
    setSearchQuery('')
    setCurrentPage(0)
    fetchKeuanganData(0, pageSize, '', s, e, '', '', '')
  }

  const fetchKeuanganData = async (
    pageNum: number = 0,
    limitNum: number = 10,
    search: string = '',
    start: string = startDate,
    end: string = endDate,
    jenisVal: string = jenis,
    asetIdVal: string = asetId,
    categoryIdVal: string = categoryKeuanganId
  ) => {
    try {
      setError(null)

      const params = new URLSearchParams({
        page: String(pageNum + 1),
        limit: String(limitNum)
      })

      if (search.trim()) params.append('search', search.trim())
      if (start) params.append('startDate', start)
      if (end) params.append('endDate', end)
      if (jenisVal) params.append('jenis', jenisVal)
      if (asetIdVal) params.append('asetId', asetIdVal)
      if (categoryIdVal) params.append('categoryKeuanganId', categoryIdVal)

      const result = await apiFetchClient<{
        data: KeuanganClient[]
        pagination: {
          totalCount: number
          totalPages: number
          page: number
          limit: number
          hasNext: boolean
          hasPrev: boolean
        }
      }>(`/api/keuangan?${params.toString()}`, undefined, {
        redirectOn401: '/login'
      })

      const keuanganData = result.data || []
      const totalPagesFromAPI = result.pagination?.totalPages ?? 0
      const totalCountFromAPI = result.pagination?.totalCount

      const inferredTotalCount =
        totalCountFromAPI ?? (totalPagesFromAPI > 0 ? totalPagesFromAPI * limitNum : keuanganData.length)

      setData(keuanganData)
      setFilteredData(keuanganData)
      setTotalCount(inferredTotalCount)
      setPageCountState(totalPagesFromAPI || Math.ceil(inferredTotalCount / limitNum))
    } catch (err) {
      console.error('Failed to fetch keuangan data:', err)

      if (err instanceof Error && !err.message.includes('Request failed (401)')) {
        setError(err.message)
      }
    }
  }

  useEffect(() => {
    fetchKeuanganData(currentPage, pageSize, searchQuery, startDate, endDate, jenis, asetId, categoryKeuanganId)
  }, [pageSize])

  useEffect(() => {
    if (initialData.length === 0) {
      fetchKeuanganData(currentPage, pageSize, searchQuery, startDate, endDate)
    }
  }, [])

  useEffect(() => {
    if (initialData.length === 0) {
      fetchKeuanganData(currentPage, pageSize, searchQuery, startDate, endDate)
    }
  }, [currentPage])

  // Emit initial filters
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        startDate,
        endDate,
        jenis,
        asetId,
        categoryKeuanganId,
        searchQuery
      })
    }
  }, [])

  const getExportFilename = () => {
    const start = startDate ? dayjs(startDate).format('DDMMYYYY') : 'all'
    const end = endDate ? dayjs(endDate).format('DDMMYYYY') : 'all'

    return `keuangan_${start}_${end}`
  }

  const fetchAllForExport = async (): Promise<KeuanganClient[]> => {
    const params = new URLSearchParams({ page: '1', limit: '99999' })

    if (searchQuery.trim()) params.append('search', searchQuery.trim())
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (jenis) params.append('jenis', jenis)
    if (asetId) params.append('asetId', asetId)
    if (categoryKeuanganId) params.append('categoryKeuanganId', categoryKeuanganId)

    const result = await apiFetchClient<{ data: KeuanganClient[] }>(
      `/api/keuangan?${params.toString()}`,
      undefined,
      { redirectOn401: '/login' }
    )

    return result.data || []
  }

  const handleExportExcel = async () => {
    setExportAnchorEl(null)

    let allData: KeuanganClient[]

    try {
      allData = await fetchAllForExport()
    } catch {
      showSnackbar('Gagal mengambil data untuk export', 'error')

      return
    }

    const totalPemasukan = allData
      .filter(item => item.jenis === 'pemasukan')
      .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)

    const totalPengeluaran = allData
      .filter(item => item.jenis === 'pengeluaran')
      .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)

    const rows = allData.map(item => ({
      'Jenis': item.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
      'Aset': (item as any).aset ? `${(item as any).aset.jenis} - ${(item as any).aset.nama}` : '-',
      'Kategori': (item as any).categoryKeuangan?.nama || '-',
      'Tanggal Transaksi': dayjs(item.tanggal).format('DD-MM-YYYY'),
      'Keterangan': item.keterangan || '-',
      'Nominal': item.nominal
    }))

    // Tambah baris kosong dan ringkasan total
    const summaryRows = [
      { 'Jenis': '', 'Aset': '', 'Kategori': '', 'Tanggal Transaksi': '', 'Keterangan': 'Total Pemasukan', 'Nominal': totalPemasukan },
      { 'Jenis': '', 'Aset': '', 'Kategori': '', 'Tanggal Transaksi': '', 'Keterangan': 'Total Pengeluaran', 'Nominal': totalPengeluaran },
      { 'Jenis': '', 'Aset': '', 'Kategori': '', 'Tanggal Transaksi': '', 'Keterangan': 'Saldo', 'Nominal': totalPemasukan - totalPengeluaran }
    ]

    const ws = XLSX.utils.json_to_sheet([...rows, {}, ...summaryRows])
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, ws, 'Keuangan')

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${getExportFilename()}.xlsx`)
  }

  const handleExportPDF = async () => {
    setExportAnchorEl(null)

    let allData: KeuanganClient[]

    try {
      allData = await fetchAllForExport()
    } catch {
      showSnackbar('Gagal mengambil data untuk export', 'error')

      return
    }

    const formatRp = (num: number) =>
      `Rp${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`

    const totalPemasukan = allData
      .filter(item => item.jenis === 'pemasukan')
      .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)

    const totalPengeluaran = allData
      .filter(item => item.jenis === 'pengeluaran')
      .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)

    const saldo = totalPemasukan - totalPengeluaran

    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(14)
    doc.text('Laporan Keuangan', 14, 15)

    if (startDate || endDate) {
      doc.setFontSize(10)
      doc.text(
        `Periode: ${startDate ? dayjs(startDate).format('DD/MM/YYYY') : '-'} s/d ${endDate ? dayjs(endDate).format('DD/MM/YYYY') : '-'}`,
        14,
        22
      )
    }

    autoTable(doc, {
      startY: startDate || endDate ? 28 : 20,
      head: [['Jenis', 'Aset', 'Kategori', 'Tanggal Transaksi', 'Keterangan', 'Nominal']],
      body: [
        ...allData.map(item => [
          item.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
          (item as any).aset ? `${(item as any).aset.jenis} - ${(item as any).aset.nama}` : '-',
          (item as any).categoryKeuangan?.nama || '-',
          dayjs(item.tanggal).format('DD-MM-YYYY'),
          item.keterangan || '-',
          formatRp(item.nominal)
        ]),
        // Baris ringkasan
        ['', '', '', '', 'Total Pemasukan', formatRp(totalPemasukan)],
        ['', '', '', '', 'Total Pengeluaran', formatRp(totalPengeluaran)],
        ['', '', '', '', 'Saldo', formatRp(saldo)]
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 91, 255] },
      didParseCell: (hookData) => {
        const lastRowIdx = allData.length
        if (hookData.row.index >= lastRowIdx) {
          hookData.cell.styles.fontStyle = 'bold'
          if (hookData.column.index === 4 || hookData.column.index === 5) {
            hookData.cell.styles.fillColor = [240, 240, 240]
          }
        }
      }
    })

    doc.save(`${getExportFilename()}.pdf`)
  }



  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Tambah'
  }

  const columns = useMemo<ColumnDef<KeuanganClientWithAction, any>[]>(
    () => [
      columnHelper.accessor('jenis', {
        header: 'Jenis Keuangan',
        cell: ({ row }) => {
          return row.original.jenis === 'pemasukan' ? (
            <Chip label='Pemasukan' color='success' size='small' variant='tonal' />
          ) : (
            <Chip label='Pengeluaran' color='error' size='small' variant='tonal' />
          )
        }
      }),
      columnHelper.accessor('asetId', {
        header: 'Aset',
        cell: ({ row }) => {
          const aset = (row.original as any).aset

          return <Typography>{aset ? `${aset.jenis} - ${aset.nama}` : 'Aset tidak ditemukan'}</Typography>
        }
      }),
      columnHelper.accessor('categoryKeuanganId', {
        header: 'Kategori',
        cell: ({ row }) => {
          const category = (row.original as any).categoryKeuangan

          if (!category) return <Typography>-</Typography>

          return (
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
          )
        }
      }),
      columnHelper.accessor('tanggal', {
        header: 'Tanggal Transaksi',
        cell: ({ row }) => <Typography>{dayjs(row.original.tanggal).format('DD-MM-YYYY')}</Typography>
      }),
      columnHelper.accessor('keterangan', {
        header: 'Keterangan',
        cell: ({ row }) => <Typography>{`${row.original.keterangan}`}</Typography>
      }),
      columnHelper.accessor('nominal', {
        header: 'Nominal',
        cell: ({ row }) => {
          const formatNumber = (num: number): string => {
            if (!num || num === 0) return '0'

            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          }

          return <Typography>Rp{formatNumber(row.original.nominal)}</Typography>
        }
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <OpenDialogOnElementClick
              element={IconButton}
              elementProps={{
                className: 'flex',
                'aria-label': 'Preview / Ubah',
                children: <i className='tabler-eye text-textSecondary' />
              }}
              dialog={AddEditKeuangan}
              dialogProps={{
                mode: 'edit',
                initialData: row.original,
                onSaved: () => {
                  fetchKeuanganData(currentPage, pageSize, searchQuery, startDate, endDate)
                }
              }}
            />
            <IconButton
              onClick={async () => {
                try {
                  await apiFetchClient(
                    `/api/keuangan/${row.original.id}`,
                    {
                      method: 'DELETE'
                    },
                    {
                      redirectOn401: '/login'
                    }
                  )

                  fetchKeuanganData(currentPage, pageSize, searchQuery, startDate, endDate)
                  showSnackbar('Keuangan berhasil dihapus', 'success')
                } catch (err) {
                  console.error('Delete failed:', err)
                  const errorMessage = err instanceof Error ? err.message : 'Failed to delete item'

                  showSnackbar(errorMessage, 'error')
                }
              }}
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    [currentPage, pageSize, searchQuery, startDate, endDate]
  )

  const table = useReactTable({
    data: filteredData as KeuanganClient[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: currentPage,
        pageSize: pageSize
      }
    },
    pageCount: pageCountState || Math.ceil(totalCount / pageSize),
    manualPagination: true,
    manualFiltering: true,
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: updater => {
      if (typeof updater === 'function') {
        const newPagination = updater({ pageIndex: currentPage, pageSize: pageSize })

        setCurrentPage(newPagination.pageIndex)
        setPageSize(newPagination.pageSize)
      }
    },
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>
            {error}
            <Button
              onClick={() => fetchKeuanganData(currentPage, pageSize, searchQuery, startDate, endDate)}
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Data Keuangan'
          action={
            <div className='flex items-center gap-2'>
              <Badge badgeContent={activeFilterCount || undefined} color='error'>
                <Button
                  variant={filterOpen ? 'contained' : 'outlined'}
                  size='small'
                  startIcon={<i className='tabler-filter' />}
                  onClick={() => setFilterOpen(o => !o)}
                >
                  Filter
                </Button>
              </Badge>
              {activeFilterCount > 0 && (
                <Chip label='Reset' size='small' onDelete={handleResetFilter} onClick={handleResetFilter} />
              )}
            </div>
          }
        />

        {/* Collapsible Filter Panel */}
        <Collapse in={filterOpen}>
          <Divider />
          <CardContent>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <CustomTextField
                  type='date'
                  fullWidth
                  label='Dari Tanggal'
                  value={pendingStartDate}
                  onChange={e => setPendingStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: pendingEndDate || undefined }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <CustomTextField
                  type='date'
                  fullWidth
                  label='Sampai Tanggal'
                  value={pendingEndDate}
                  onChange={e => setPendingEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: pendingStartDate || undefined }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Jenis'
                  value={pendingJenis}
                  onChange={e => { setPendingJenis(e.target.value); setPendingCategoryId('') }}
                  slotProps={{ select: { displayEmpty: true } }}
                >
                  <MenuItem value=''>Semua Jenis</MenuItem>
                  <MenuItem value='pemasukan'>Pemasukan</MenuItem>
                  <MenuItem value='pengeluaran'>Pengeluaran</MenuItem>
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Aset'
                  value={pendingAsetId}
                  onChange={e => setPendingAsetId(e.target.value)}
                  slotProps={{ select: { displayEmpty: true } }}
                >
                  <MenuItem value=''>Semua Aset</MenuItem>
                  {asetOptions.map(a => (
                    <MenuItem key={a.id} value={a.id}>{a.jenis} - {a.nama}</MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Kategori'
                  value={pendingCategoryId}
                  onChange={e => setPendingCategoryId(e.target.value)}
                  slotProps={{ select: { displayEmpty: true } }}
                >
                  <MenuItem value=''>Semua Kategori</MenuItem>
                  {filteredKategoriOptions.map(k => (
                    <MenuItem key={k.id} value={k.id}>{k.nama}</MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <CustomTextField
                  fullWidth
                  label='Cari'
                  placeholder='Cari keuangan...'
                  value={pendingSearch}
                  onChange={e => setPendingSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleApplyFilter() }}
                />
              </Grid>
              <Grid size={{ xs: 12 }} className='flex justify-end gap-2'>
                <Button variant='contained' startIcon={<i className='tabler-search' />} onClick={handleApplyFilter}>
                  Cari
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>

        <Divider />

        {/* Toolbar Section */}
        <CardContent className='flex justify-between flex-wrap items-end gap-4'>
          <div className='flex items-end gap-4 flex-wrap'>
            <CustomTextField
              select
              value={pageSize}
              onChange={e => {
                const newPageSize = Number(e.target.value)

                setPageSize(newPageSize)
                setCurrentPage(0)
              }}
              className='is-[70px]'
              label='Show'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps}
              dialog={AddEditKeuangan}
              dialogProps={{
                onSaved: () => {
                  fetchKeuanganData(currentPage, pageSize, searchQuery, startDate, endDate)
                }
              }}
            />
            <Button
              variant='outlined'
              color='secondary'
              startIcon={<i className='tabler-upload' />}
              endIcon={<i className='tabler-chevron-down' />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Menu
              anchorEl={exportAnchorEl}
              open={exportMenuOpen}
              onClose={() => setExportAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem onClick={handleExportExcel}>
                <ListItemIcon>
                  <i className='tabler-file-spreadsheet text-xl' />
                </ListItemIcon>
                <ListItemText>Excel (.xlsx)</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleExportPDF}>
                <ListItemIcon>
                  <i className='tabler-file-type-pdf text-xl' />
                </ListItemIcon>
                <ListItemText>PDF (.pdf)</ListItemText>
              </MenuItem>
            </Menu>
          </div>
        </CardContent>

        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='tabler-chevron-up text-xl' />,
                              desc: <i className='tabler-chevron-down text-xl' />
                            }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                          </div>
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    {searchQuery ? `Tidak ditemukan data untuk pencarian "${searchQuery}"` : 'No data available'}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => {
                  return (
                    <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          component='div'
          count={totalCount || pageCountState * pageSize}
          rowsPerPage={pageSize}
          page={currentPage}
          onPageChange={(_, page) => {
            setCurrentPage(page)
          }}
          onRowsPerPageChange={e => {
            const newPageSize = Number(e.target.value)

            setPageSize(newPageSize)
            setCurrentPage(0)
          }}
        />
        <AppSnackbar snack={snack} onClose={closeSnack} />
      </Card>
    </>
  )
}

export default KeuanganListTable
