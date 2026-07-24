'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

import * as XLSX from 'xlsx'
import classnames from 'classnames'
import dayjs from 'dayjs'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import CustomTextField from '@core/components/mui/TextField'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import tableStyles from '@core/styles/table.module.css'

type TagihanRow = {
  id: string
  nomorTagihan?: string | null
  keterangan: string
  status: string
  metodeBayar: string | null
  periodeSewa: string | null
  mulaiSewa: string
  selesaiSewa: string
  nominal: number
  adminBooking?: number | string | null
  hargaMerchant?: number | string | null
  createdAt: string
  statusRekon?: string | null
  amountPembayaran?: number | string | null
  amountFee?: number | string | null
  typePembayaran?: string | null
  paymentChannel?: string | null
  paymentNo?: string | null
  company?: { id: string; nama: string }
  penyewa?: { id: string; nama: string; email?: string; nomorTelepon?: string }
  aset?: { id: string; nama: string }
  itemAset?: { id: string; nama: string }
}

type ExcelRekonRow = {
  refId: string
  amount: number
  fee: number
  type: string
  paymentChannel: string
  paymentNo: string
  status: string
}

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  'BELUM TERBAYAR': 'warning',
  'LUNAS': 'success',
  'DIBATALKAN': 'error'
}

const columnHelper = createColumnHelper<TagihanRow>()

const getExcelField = (row: Record<string, any>, ...keys: string[]): string => {
  for (const key of keys) {
    const val = row[key] ?? row[key.toLowerCase()] ?? row[key.toUpperCase()]

    if (val !== undefined && val !== null && val !== '') return String(val).trim()
  }

  return ''
}

const KonfirmasiTagihanBookingTable = () => {
  const [data, setData] = useState<TagihanRow[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCountState, setPageCountState] = useState(0)

  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const filterOpen = Boolean(filterAnchor)

  const [pendingStatus, setPendingStatus] = useState('')
  const [pendingCompany, setPendingCompany] = useState('')
  const [pendingDari, setPendingDari] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'))
  const [pendingSampai, setPendingSampai] = useState(() => dayjs().endOf('month').format('YYYY-MM-DD'))
  const [pendingSearch, setPendingSearch] = useState('')

  const [statusFilter, setStatusFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [dari, setDari] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'))
  const [sampai, setSampai] = useState(() => dayjs().endOf('month').format('YYYY-MM-DD'))
  const [search, setSearch] = useState('')

  type StatsData = { countSukses: number; totalSukses: number; countRekon: number; totalRekon: number; totalFee: number }
  const [stats, setStats] = useState<StatsData>({ countSukses: 0, totalSukses: 0, countRekon: 0, totalRekon: 0, totalFee: 0 })

  const [rekonParsed, setRekonParsed] = useState<ExcelRekonRow[]>([])
  const [rekonFileName, setRekonFileName] = useState('')
  const [rekonDialog, setRekonDialog] = useState(false)
  const [rekonProcessing, setRekonProcessing] = useState(false)
  const [rekonResult, setRekonResult] = useState<{ total: number; matched: number; updated: number; unmatched: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { snack, showSnack, closeSnack } = useSnackbar()

  const activeFilterCount = [statusFilter, companyFilter, dari, sampai, search].filter(Boolean).length

  const formatRupiah = (num: number | string) => {
    const n = typeof num === 'string' ? parseFloat(num) : num

    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  }

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ page: String(currentPage + 1), limit: String(pageSize) })

      if (statusFilter) params.append('status', statusFilter)
      if (companyFilter) params.append('company', companyFilter)
      if (dari) params.append('dari', dari)
      if (sampai) params.append('sampai', sampai)
      if (search) params.append('search', search)

      const result = await apiFetchClient<{
        data: TagihanRow[]
        pagination: { totalCount: number; totalPages: number }
      }>(`/api/management-master/tagihan?${params.toString()}`, undefined, { redirectOn401: '/login' })

      setData(result.data || [])
      setTotalCount(result.pagination?.totalCount ?? 0)
      setPageCountState(result.pagination?.totalPages ?? 0)
    } catch (err) {
      console.error('Failed to fetch tagihan booking:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const p = new URLSearchParams()

      if (statusFilter) p.append('status', statusFilter)
      if (companyFilter) p.append('company', companyFilter)
      if (dari) p.append('dari', dari)
      if (sampai) p.append('sampai', sampai)
      if (search) p.append('search', search)

      const result = await apiFetchClient<{ data: StatsData }>(`/api/admin/tagihan/stats?${p.toString()}`, undefined, { redirectOn401: '/login' })

      setStats(result.data)
    } catch (err) {
      console.error('Failed to fetch tagihan stats:', err)
    }
  }

  useEffect(() => { fetchData(); fetchStats() }, [currentPage, pageSize, statusFilter, companyFilter, dari, sampai, search])

  const handleApplyFilter = () => {
    setFilterAnchor(null)
    setStatusFilter(pendingStatus)
    setCompanyFilter(pendingCompany)
    setDari(pendingDari)
    setSampai(pendingSampai)
    setSearch(pendingSearch)
    setCurrentPage(0)
  }

  const handleResetFilter = () => {
    setFilterAnchor(null)
    setPendingStatus(''); setPendingCompany(''); setPendingDari(''); setPendingSampai(''); setPendingSearch('')
    setStatusFilter(''); setCompanyFilter(''); setDari(''); setSampai(''); setSearch('')
    setCurrentPage(0)
  }

  const handleRekonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = event => {
      try {
        const bytes = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(bytes, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet)
        const parsed: ExcelRekonRow[] = []

        rows.forEach(row => {
          const refId = getExcelField(row, 'Ref ID', 'RefID', 'ref_id', 'Reference ID', 'referenceId')

          if (!refId) return

          parsed.push({
            refId,
            amount: Number(getExcelField(row, 'Amount', 'amount')) || 0,
            fee: Number(getExcelField(row, 'Fee', 'fee')) || 0,
            type: getExcelField(row, 'Type', 'type'),
            paymentChannel: getExcelField(row, 'Payment Channel', 'PaymentChannel', 'Payment channel', 'payment_channel'),
            paymentNo: getExcelField(row, 'Payment No', 'PaymentNo', 'Payment No.', 'payment_no', 'Payment Number'),
            status: getExcelField(row, 'Status', 'status')
          })
        })

        setRekonParsed(parsed)
        setRekonFileName(file.name)
        setRekonResult(null)
        setRekonDialog(true)
      } catch {
        showSnack('Gagal membaca file Excel', 'error')
      }
    }

    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const handleProsesRekon = async () => {
    setRekonProcessing(true)

    try {
      const result = await apiFetchClient<{ data: { total: number; matched: number; updated: number; unmatched: number }; message: string }>(
        '/api/admin/tagihan/rekon',
        { method: 'POST', body: JSON.stringify({ rows: rekonParsed }) }
      )

      setRekonResult(result.data)
      showSnack(result.message)
      fetchData()
      fetchStats()
    } catch {
      showSnack('Gagal memproses rekon', 'error')
    } finally {
      setRekonProcessing(false)
    }
  }

  const handleResetRekon = () => {
    setRekonParsed([])
    setRekonFileName('')
    setRekonResult(null)
    setRekonDialog(false)
  }

  const columns = useMemo<ColumnDef<TagihanRow, any>[]>(() => [
    columnHelper.accessor('id', {
      header: 'No. Tagihan',
      cell: ({ row }) => (
        <div>
          <Typography variant='body2' color='primary.main' className='font-medium'>
            {row.original.nomorTagihan || '-'}
          </Typography>
          <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {row.original.id}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('company' as any, {
      header: 'Perusahaan',
      cell: ({ row }) => <Typography variant='body2' className='font-medium'>{row.original.company?.nama || '-'}</Typography>
    }),
    columnHelper.accessor('penyewa' as any, {
      header: 'Penyewa',
      cell: ({ row }) => (
        <div>
          <Typography variant='body2' className='font-medium'>{row.original.penyewa?.nama || '-'}</Typography>
          {row.original.penyewa?.nomorTelepon && (
            <Typography variant='caption' color='text.secondary'>{row.original.penyewa.nomorTelepon}</Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('keterangan', {
      header: 'Keterangan',
      cell: ({ row }) => (
        <div>
          <Typography variant='body2' className='line-clamp-2'>{row.original.keterangan}</Typography>
          {row.original.aset && (
            <Typography variant='caption' color='text.secondary'>
              {row.original.aset.nama}{row.original.itemAset ? ` / ${row.original.itemAset.nama}` : ''}
            </Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('nominal', {
      header: 'Nominal',
      cell: ({ row }) => <Typography variant='body2' className='font-medium'>{formatRupiah(row.original.nominal)}</Typography>
    }),
    columnHelper.accessor('adminBooking' as any, {
      header: 'Admin Booking',
      cell: ({ row }) => <Typography variant='body2'>{formatRupiah(row.original.adminBooking ?? 0)}</Typography>
    }),
    columnHelper.accessor('hargaMerchant' as any, {
      header: 'Harga Merchant',
      cell: ({ row }) => <Typography variant='body2'>{formatRupiah(row.original.hargaMerchant ?? 0)}</Typography>
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status

        return <Chip label={s} color={statusColors[s] || 'default'} size='small' variant='tonal' />
      }
    }),
    columnHelper.accessor('mulaiSewa', {
      header: 'Periode',
      cell: ({ row }) => (
        <Typography variant='body2'>
          {dayjs(row.original.mulaiSewa).format('DD/MM/YY')} – {dayjs(row.original.selesaiSewa).format('DD/MM/YY')}
        </Typography>
      )
    }),
    {
      id: 'rekon_status',
      header: 'Status Rekon',
      cell: ({ row }: any) => {
        const sr = row.original.statusRekon

        if (!sr) return <Typography variant='body2' color='text.disabled'>-</Typography>

        return sr === 'SESUAI'
          ? <Chip label='Sesuai' color='success' size='small' variant='tonal' />
          : <Chip label='Tidak Sesuai' color='error' size='small' variant='tonal' />
      }
    },
    {
      id: 'rekon_amount',
      header: 'Amt. Bayar',
      cell: ({ row }: any) => (
        <Typography variant='body2'>{row.original.amountPembayaran != null ? formatRupiah(row.original.amountPembayaran) : '-'}</Typography>
      )
    },
    {
      id: 'rekon_fee',
      header: 'Fee',
      cell: ({ row }: any) => (
        <Typography variant='body2'>{row.original.amountFee != null ? formatRupiah(row.original.amountFee) : '-'}</Typography>
      )
    },
    {
      id: 'rekon_type',
      header: 'Type',
      cell: ({ row }: any) => <Typography variant='body2'>{row.original.typePembayaran || '-'}</Typography>
    },
    {
      id: 'rekon_channel',
      header: 'Payment Channel',
      cell: ({ row }: any) => <Typography variant='body2'>{row.original.paymentChannel || '-'}</Typography>
    },
    {
      id: 'rekon_no',
      header: 'Payment No',
      cell: ({ row }: any) => <Typography variant='body2'>{row.original.paymentNo || '-'}</Typography>
    }
  ], [])

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: () => true },
    state: { pagination: { pageIndex: currentPage, pageSize } },
    pageCount: pageCountState || Math.ceil(totalCount / pageSize),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const statsItems = [
    { label: 'Total Transaksi Sukses', value: formatRupiah(stats.totalSukses), icon: 'tabler-cash', color: '#28c76f', bg: 'rgba(40,199,111,0.12)' },
    { label: 'Total Transaksi Rekon', value: formatRupiah(stats.totalRekon), icon: 'tabler-spacing-horizontal', color: '#7367f0', bg: 'rgba(115,103,240,0.12)' },
    { label: 'Jumlah Transaksi Sukses', value: stats.countSukses, icon: 'tabler-receipt', color: '#00cfe8', bg: 'rgba(0,207,232,0.12)' },
    { label: 'Jumlah Transaksi Rekon', value: stats.countRekon, icon: 'tabler-list-check', color: '#ff9f43', bg: 'rgba(255,159,67,0.12)' },
    { label: 'Jumlah Fee Layanan', value: formatRupiah(stats.totalFee), icon: 'tabler-coins', color: '#ea5455', bg: 'rgba(234,84,85,0.12)' }
  ]

  return (
    <>
      <input ref={fileInputRef} type='file' accept='.xlsx,.xls,.csv' style={{ display: 'none' }} onChange={handleRekonUpload} />

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        {statsItems.map(item => (
          <Card key={item.label} sx={{ flex: '1 1 160px', minWidth: 150 }}>
            <CardContent sx={{ p: '16px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: item.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <i className={`${item.icon} text-xl`} style={{ color: item.color }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant='h6' fontWeight={700} sx={{ lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                  {item.value}
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.3 }}>
                  {item.label}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardHeader
          title='Tagihan Booking'
          action={
            <Box display='flex' alignItems='center' gap={2} flexWrap='wrap'>
              {rekonParsed.length > 0 ? (
                <>
                  <Button size='small' variant='outlined' color='success'
                    startIcon={<i className='tabler-table-check text-base' />}
                    onClick={() => setRekonDialog(true)}
                    sx={{ textTransform: 'none', fontSize: '0.875rem' }}
                  >
                    Rekon: {rekonParsed.length} data
                  </Button>
                  <Chip label='Reset' size='small' onDelete={handleResetRekon} onClick={handleResetRekon} />
                </>
              ) : (
                <Button size='small' variant='outlined' color='secondary'
                  startIcon={<i className='tabler-table-import text-base' />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: 'none', fontSize: '0.875rem' }}
                >
                  Upload Rekon
                </Button>
              )}

              <Button
                size='small'
                onMouseEnter={e => setFilterAnchor(e.currentTarget)}
                onClick={e => setFilterAnchor(filterAnchor ? null : e.currentTarget)}
                endIcon={<i className={`tabler-chevron-${filterOpen ? 'up' : 'down'} text-base`} />}
                sx={{
                  border: '1px solid', borderColor: activeFilterCount > 0 ? 'primary.main' : 'divider',
                  borderRadius: 1, px: 2, py: 0.75, color: activeFilterCount > 0 ? 'primary.main' : 'text.secondary',
                  bgcolor: 'transparent', fontWeight: 400, fontSize: '0.875rem', textTransform: 'none', gap: 1,
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'transparent' }
                }}
              >
                <i className='tabler-filter text-base' />
                Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Button>

              {activeFilterCount > 0 && <Chip label='Reset' size='small' onDelete={handleResetFilter} onClick={handleResetFilter} />}

              <Popover open={filterOpen} anchorEl={filterAnchor} onClose={() => setFilterAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { mt: 1, p: 3, minWidth: 400 } } }}
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField select fullWidth value={pendingStatus} onChange={e => setPendingStatus(e.target.value)}
                      label='Status' slotProps={{ select: { displayEmpty: true } }}
                    >
                      <MenuItem value=''>Semua Status</MenuItem>
                      <MenuItem value='BELUM TERBAYAR'>Belum Terbayar</MenuItem>
                      <MenuItem value='LUNAS'>Lunas</MenuItem>
                      <MenuItem value='DIBATALKAN'>Dibatalkan</MenuItem>
                    </CustomTextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField fullWidth value={pendingCompany} onChange={e => setPendingCompany(e.target.value)}
                      label='Nama Perusahaan' placeholder='Cari perusahaan...'
                      onKeyDown={e => { if (e.key === 'Enter') handleApplyFilter() }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField fullWidth value={pendingSearch} onChange={e => setPendingSearch(e.target.value)}
                      label='Keterangan/Penyewa' placeholder='Cari...'
                      onKeyDown={e => { if (e.key === 'Enter') handleApplyFilter() }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField type='date' fullWidth value={pendingDari} onChange={e => setPendingDari(e.target.value)}
                      label='Dari Tanggal' InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField type='date' fullWidth value={pendingSampai} onChange={e => setPendingSampai(e.target.value)}
                      label='Sampai Tanggal' InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }} className='flex justify-end gap-2'>
                    <Button size='small' variant='outlined' color='secondary' onClick={() => setFilterAnchor(null)}>Tutup</Button>
                    <Button size='small' variant='contained' onClick={handleApplyFilter}>Terapkan</Button>
                  </Grid>
                </Grid>
              </Popover>
            </Box>
          }
        />

        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({ 'flex items-center': header.column.getIsSorted(), 'cursor-pointer select-none': header.column.getCanSort() })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: <i className='tabler-chevron-up text-xl' />, desc: <i className='tabler-chevron-down text-xl' /> }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody><tr><td colSpan={table.getVisibleFlatColumns().length} className='text-center'>Tidak ada data tagihan booking</td></tr></tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        <TablePagination
          component='div' count={totalCount} rowsPerPage={pageSize} page={currentPage}
          onPageChange={(_, page) => setCurrentPage(page)}
          onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0) }}
        />
      </Card>

      {/* Dialog Rekon */}
      <Dialog open={rekonDialog} onClose={() => !rekonProcessing && setRekonDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <i className='tabler-table-import text-xl' />
              <Typography variant='h6'>Rekonsiliasi Tagihan Booking</Typography>
            </div>
            <IconButton onClick={() => setRekonDialog(false)} size='small' disabled={rekonProcessing}>
              <i className='tabler-x' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box className='flex flex-col gap-4'>
            <Box className='p-3 bg-actionHover rounded'>
              <Typography variant='body2' color='text.secondary' className='mb-1'>File</Typography>
              <Typography className='font-medium'>{rekonFileName}</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Box className='text-center p-3 border rounded'>
                  <Typography variant='h5' color='primary.main' className='font-bold'>{rekonParsed.length}</Typography>
                  <Typography variant='caption' color='text.secondary'>Total Transaksi Excel</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Box className='text-center p-3 border rounded'>
                  <Typography variant='h5' color='warning.main' className='font-bold'>
                    {rekonParsed.filter(r => ['berhasil','success','paid','settlement'].includes((r.status || '').toLowerCase())).length}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>Status Berhasil</Typography>
                </Box>
              </Grid>
            </Grid>

            {rekonResult && (
              <>
                <Divider />
                <Typography variant='subtitle2'>Hasil Rekonsiliasi</Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Cocok', value: rekonResult.matched, color: 'primary.main' },
                    { label: 'Diupdate', value: rekonResult.updated, color: 'success.main' },
                    { label: 'Tdk Cocok', value: rekonResult.unmatched, color: 'error.main' },
                    { label: 'Total', value: rekonResult.total, color: 'text.secondary' }
                  ].map(item => (
                    <Grid key={item.label} size={{ xs: 3 }}>
                      <Box className='text-center p-2 border rounded'>
                        <Typography variant='h6' color={item.color} className='font-bold'>{item.value}</Typography>
                        <Typography variant='caption' color='text.secondary'>{item.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {!rekonResult && (
              <Alert severity='info' icon={<i className='tabler-info-circle' />} sx={{ py: 0.5 }}>
                Pencocokan via <strong>Ref ID ↔ ID Tagihan</strong>.
                Tagihan yang cocok dan berstatus <strong>Berhasil</strong> akan diupdate ke <strong>Lunas</strong>.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRekonDialog(false)} color='secondary' disabled={rekonProcessing}>Tutup</Button>
          {!rekonResult ? (
            <Button onClick={handleProsesRekon} variant='contained' disabled={rekonProcessing}
              startIcon={rekonProcessing ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-check' />}
            >
              {rekonProcessing ? 'Memproses...' : 'Proses Rekon'}
            </Button>
          ) : (
            <Button onClick={handleResetRekon} variant='outlined' color='error' startIcon={<i className='tabler-trash' />}>
              Hapus Data Rekon
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default KonfirmasiTagihanBookingTable
