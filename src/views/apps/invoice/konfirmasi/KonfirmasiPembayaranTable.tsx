'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TablePagination from '@mui/material/TablePagination'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Alert from '@mui/material/Alert'

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

import type { InvoiceClient, InvoiceStatus } from '@/src/types/apps/invoiceTypes'
import CustomTextField from '@core/components/mui/TextField'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import tableStyles from '@core/styles/table.module.css'

const statusColors: Record<InvoiceStatus, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  PENDING: 'warning',
  KONFIRMASI: 'info',
  PAID: 'success',
  CANCELLED: 'error',
  EXPIRED: 'default'
}

const statusLabels: Record<InvoiceStatus, string> = {
  PENDING: 'Menunggu',
  KONFIRMASI: 'Konfirmasi',
  PAID: 'Lunas',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kadaluarsa'
}

const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif)$/i.test(url)
const isPdfUrl = (url: string) => /\.pdf$/i.test(url)

type InvoiceWithCompany = InvoiceClient & {
  company?: { id: string; nama: string; email?: string; alamat?: string; telepon?: string }
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

const columnHelper = createColumnHelper<InvoiceWithCompany>()

// Ambil nilai field dari row Excel dengan beberapa kemungkinan nama kolom
const getExcelField = (row: Record<string, any>, ...keys: string[]): string => {
  for (const key of keys) {
    const val = row[key] ?? row[key.toLowerCase()] ?? row[key.toUpperCase()]

    if (val !== undefined && val !== null && val !== '') return String(val).trim()
  }

  return ''
}

const KonfirmasiPembayaranTable = () => {
  const [data, setData] = useState<InvoiceWithCompany[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [tanggalDari, setTanggalDari] = useState('')
  const [tanggalSampai, setTanggalSampai] = useState('')
  const [invoiceDari, setInvoiceDari] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'))
  const [invoiceSampai, setInvoiceSampai] = useState(() => dayjs().endOf('month').format('YYYY-MM-DD'))
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const filterOpen = Boolean(filterAnchor)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCountState, setPageCountState] = useState(0)

  // Rekon state
  const [rekonData, setRekonData] = useState<Map<string, ExcelRekonRow>>(new Map())
  const [rekonFileName, setRekonFileName] = useState('')
  const [rekonParsed, setRekonParsed] = useState<ExcelRekonRow[]>([])
  const [rekonDialog, setRekonDialog] = useState(false)
  const [rekonProcessing, setRekonProcessing] = useState(false)
  const [rekonResult, setRekonResult] = useState<{ total: number; matched: number; updated: number; unmatched: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [buktiDialog, setBuktiDialog] = useState<{ open: boolean; url: string }>({ open: false, url: '' })
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; invoice: InvoiceWithCompany | null }>({
    open: false,
    invoice: null
  })
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; invoice: InvoiceWithCompany | null }>({
    open: false,
    invoice: null
  })
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; invoice: InvoiceWithCompany | null }>({
    open: false,
    invoice: null
  })
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  // Pending states (apa yang user edit, belum diapply)
  const [pendingStatus, setPendingStatus] = useState('')
  const [pendingCompany, setPendingCompany] = useState('')
  const [pendingInvoiceDari, setPendingInvoiceDari] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'))
  const [pendingInvoiceSampai, setPendingInvoiceSampai] = useState(() => dayjs().endOf('month').format('YYYY-MM-DD'))
  const [pendingTanggalDari, setPendingTanggalDari] = useState('')
  const [pendingTanggalSampai, setPendingTanggalSampai] = useState('')

  // Stats
  type StatsData = { countSukses: number; totalSukses: number; countRekon: number; totalRekon: number; totalFee: number }
  const [stats, setStats] = useState<StatsData>({ countSukses: 0, totalSukses: 0, countRekon: 0, totalRekon: 0, totalFee: 0 })

  const activeFilterCount = [statusFilter, companyFilter, tanggalDari, tanggalSampai, invoiceDari, invoiceSampai].filter(Boolean).length

  const handleApplyFilter = () => {
    setFilterAnchor(null)
    setStatusFilter(pendingStatus)
    setCompanyFilter(pendingCompany)
    setInvoiceDari(pendingInvoiceDari)
    setInvoiceSampai(pendingInvoiceSampai)
    setTanggalDari(pendingTanggalDari)
    setTanggalSampai(pendingTanggalSampai)
    setCurrentPage(0)
  }

  const handleResetFilter = () => {
    setFilterAnchor(null)
    setPendingStatus('')
    setPendingCompany('')
    setPendingInvoiceDari('')
    setPendingInvoiceSampai('')
    setPendingTanggalDari('')
    setPendingTanggalSampai('')
    setStatusFilter('')
    setCompanyFilter('')
    setInvoiceDari('')
    setInvoiceSampai('')
    setTanggalDari('')
    setTanggalSampai('')
    setCurrentPage(0)
  }

  const fetchData = async (page = 0, limit = 10, status = '', company = '', dari = '', sampai = '', invDari = '', invSampai = '') => {
    try {
      const params = new URLSearchParams({ page: String(page + 1), limit: String(limit) })

      if (status) params.append('status', status)
      if (company) params.append('company', company)
      if (dari) params.append('dari', dari)
      if (sampai) params.append('sampai', sampai)
      if (invDari) params.append('invDari', invDari)
      if (invSampai) params.append('invSampai', invSampai)

      const result = await apiFetchClient<{
        data: InvoiceWithCompany[]
        pagination: { totalCount: number; totalPages: number; page: number; limit: number }
      }>(`/api/admin/invoice?${params.toString()}`, undefined, { redirectOn401: '/login' })

      setData(result.data || [])
      setTotalCount(result.pagination?.totalCount ?? 0)
      setPageCountState(result.pagination?.totalPages ?? 0)
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    }
  }

  const fetchStats = async (status = '', company = '', dari = '', sampai = '', invDari = '', invSampai = '') => {
    try {
      const p = new URLSearchParams()

      if (status) p.append('status', status)
      if (company) p.append('company', company)
      if (dari) p.append('dari', dari)
      if (sampai) p.append('sampai', sampai)
      if (invDari) p.append('invDari', invDari)
      if (invSampai) p.append('invSampai', invSampai)

      const result = await apiFetchClient<{ data: StatsData }>(`/api/admin/invoice/stats?${p.toString()}`, undefined, { redirectOn401: '/login' })

      setStats(result.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  useEffect(() => {
    fetchData(currentPage, pageSize, statusFilter, companyFilter, tanggalDari, tanggalSampai, invoiceDari, invoiceSampai)
    fetchStats(statusFilter, companyFilter, tanggalDari, tanggalSampai, invoiceDari, invoiceSampai)
  }, [currentPage, pageSize, statusFilter, companyFilter, tanggalDari, tanggalSampai, invoiceDari, invoiceSampai])

  const formatRupiah = (num: number | string) => {
    const n = typeof num === 'string' ? parseFloat(num) : num

    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  }

  // ─── Rekon Excel ───────────────────────────────────────────────────────────
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

        const map = new Map<string, ExcelRekonRow>()
        const parsed: ExcelRekonRow[] = []

        rows.forEach(row => {
          const refId = getExcelField(row, 'Ref ID', 'RefID', 'ref_id', 'Reference ID', 'referenceId')

          if (!refId) return

          const item: ExcelRekonRow = {
            refId,
            amount: Number(getExcelField(row, 'Amount', 'amount')) || 0,
            fee: Number(getExcelField(row, 'Fee', 'fee')) || 0,
            type: getExcelField(row, 'Type', 'type'),
            paymentChannel: getExcelField(row, 'Payment Channel', 'PaymentChannel', 'Payment channel', 'payment_channel'),
            paymentNo: getExcelField(row, 'Payment No', 'PaymentNo', 'Payment No.', 'payment_no', 'Payment Number'),
            status: getExcelField(row, 'Status', 'status')
          }

          map.set(refId, item)
          parsed.push(item)
        })

        setRekonData(map)
        setRekonParsed(parsed)
        setRekonFileName(file.name)
        setRekonResult(null)
        setRekonDialog(true)
      } catch (err) {
        console.error('Parse Excel error:', err)
        showSnack('Gagal membaca file Excel', 'error')
      }
    }

    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const handleProsesRekon = async () => {
    setRekonProcessing(true)

    try {
      const result = await apiFetchClient<{
        data: { total: number; matched: number; updated: number; unmatched: number }
        message: string
      }>('/api/admin/invoice/rekon', {
        method: 'POST',
        body: JSON.stringify({ rows: rekonParsed })
      })

      setRekonResult(result.data)
      showSnack(result.message)
      fetchData(currentPage, pageSize, statusFilter, companyFilter, tanggalDari, tanggalSampai, invoiceDari, invoiceSampai)
      fetchStats(statusFilter, companyFilter, tanggalDari, tanggalSampai, invoiceDari, invoiceSampai)
    } catch (err) {
      showSnack('Gagal memproses rekon', 'error')
    } finally {
      setRekonProcessing(false)
    }
  }

  const handleResetRekon = () => {
    setRekonData(new Map())
    setRekonParsed([])
    setRekonFileName('')
    setRekonResult(null)
    setRekonDialog(false)
  }

  // ─── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<InvoiceWithCompany, any>[]>(() => [
    columnHelper.accessor('id', {
      header: 'ID Invoice',
      cell: ({ row }) => (
        <div>
          <Typography variant='body2' color='primary.main' className='font-medium' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {row.original.id}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {row.original.nomorInvoice}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('company' as any, {
      header: 'Perusahaan',
      cell: ({ row }) => (
        <div>
          <Typography className='font-medium'>{row.original.company?.nama || '-'}</Typography>
          {row.original.company?.email && (
            <Typography variant='caption' color='text.secondary'>
              {row.original.company.email}
            </Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('paketId', {
      header: 'Paket',
      cell: ({ row }) => <Typography>{row.original.paket?.nama || '-'}</Typography>
    }),
    columnHelper.accessor('total', {
      header: 'Total',
      cell: ({ row }) => (
        <Typography className='font-medium'>{formatRupiah(row.original.total)}</Typography>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status as InvoiceStatus

        return <Chip label={statusLabels[s] || s} color={statusColors[s] || 'default'} size='small' variant='tonal' />
      }
    }),
    columnHelper.accessor('tanggalInvoice', {
      header: 'Tanggal',
      cell: ({ row }) => (
        <Typography>{dayjs(row.original.tanggalInvoice).format('DD-MM-YYYY')}</Typography>
      )
    }),
    // Kolom rekon — selalu tampil, data dari DB
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
        <Typography variant='body2'>
          {row.original.amountPembayaran != null ? formatRupiah(row.original.amountPembayaran) : '-'}
        </Typography>
      )
    },
    {
      id: 'rekon_fee',
      header: 'Fee',
      cell: ({ row }: any) => (
        <Typography variant='body2'>
          {row.original.amountFee != null ? formatRupiah(row.original.amountFee) : '-'}
        </Typography>
      )
    },
    {
      id: 'rekon_type',
      header: 'Type',
      cell: ({ row }: any) => (
        <Typography variant='body2'>{row.original.typePembayaran || '-'}</Typography>
      )
    },
    {
      id: 'rekon_channel',
      header: 'Payment Channel',
      cell: ({ row }: any) => (
        <Typography variant='body2'>{row.original.paymentChannel || '-'}</Typography>
      )
    },
    {
      id: 'rekon_no',
      header: 'Payment No',
      cell: ({ row }: any) => (
        <Typography variant='body2'>{row.original.paymentNo || '-'}</Typography>
      )
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }: any) => (
        <Tooltip title='Detail Invoice'>
          <IconButton
            size='small'
            color='primary'
            onClick={() => setDetailDialog({ open: true, invoice: row.original })}
          >
            <i className='tabler-eye' />
          </IconButton>
        </Tooltip>
      )
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
    {
      label: 'Total Transaksi Sukses',
      value: formatRupiah(stats.totalSukses),
      icon: 'tabler-cash',
      color: '#28c76f',
      bg: 'rgba(40,199,111,0.12)'
    },
    {
      label: 'Total Transaksi Rekon',
      value: formatRupiah(stats.totalRekon),
      icon: 'tabler-spacing-horizontal',
      color: '#7367f0',
      bg: 'rgba(115,103,240,0.12)'
    },
    {
      label: 'Jumlah Transaksi Sukses',
      value: stats.countSukses,
      icon: 'tabler-receipt',
      color: '#00cfe8',
      bg: 'rgba(0,207,232,0.12)'
    },
    {
      label: 'Jumlah Transaksi Rekon',
      value: stats.countRekon,
      icon: 'tabler-list-check',
      color: '#ff9f43',
      bg: 'rgba(255,159,67,0.12)'
    },
    {
      label: 'Jumlah Fee Layanan',
      value: formatRupiah(stats.totalFee),
      icon: 'tabler-coins',
      color: '#ea5455',
      bg: 'rgba(234,84,85,0.12)'
    }
  ]

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        accept='.xlsx,.xls,.csv'
        style={{ display: 'none' }}
        onChange={handleRekonUpload}
      />

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
          title='Konfirmasi Paket'
          action={
            <Box display='flex' alignItems='center' gap={2} flexWrap='wrap'>
              {/* Upload / Lihat Rekon */}
              {rekonData.size > 0 ? (
                <>
                  <Button
                    size='small'
                    variant='outlined'
                    color='success'
                    startIcon={<i className='tabler-table-check text-base' />}
                    onClick={() => setRekonDialog(true)}
                    sx={{ textTransform: 'none', fontSize: '0.875rem' }}
                  >
                    Rekon: {rekonData.size} data
                  </Button>
                  <Chip
                    label='Reset'
                    size='small'
                    color='default'
                    onDelete={handleResetRekon}
                    onClick={handleResetRekon}
                  />
                </>
              ) : (
                <Button
                  size='small'
                  variant='outlined'
                  color='secondary'
                  startIcon={<i className='tabler-table-import text-base' />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: 'none', fontSize: '0.875rem' }}
                >
                  Upload Rekon
                </Button>
              )}

              {/* Filter */}
              <Button
                size='small'
                onMouseEnter={e => setFilterAnchor(e.currentTarget)}
                onClick={e => setFilterAnchor(filterAnchor ? null : e.currentTarget)}
                endIcon={<i className={`tabler-chevron-${filterOpen ? 'up' : 'down'} text-base`} />}
                sx={{
                  border: '1px solid',
                  borderColor: activeFilterCount > 0 ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  px: 2,
                  py: 0.75,
                  color: activeFilterCount > 0 ? 'primary.main' : 'text.secondary',
                  bgcolor: 'transparent',
                  fontWeight: 400,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  gap: 1,
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'transparent' }
                }}
              >
                <i className='tabler-filter text-base' />
                Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Button>

              {activeFilterCount > 0 && (
                <Chip label='Reset' size='small' onDelete={handleResetFilter} onClick={handleResetFilter} />
              )}

              <Popover
                open={filterOpen}
                anchorEl={filterAnchor}
                onClose={() => setFilterAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { mt: 1, p: 3, minWidth: 400 } } }}
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      select
                      fullWidth
                      value={pendingStatus}
                      onChange={e => setPendingStatus(e.target.value)}
                      label='Status'
                      slotProps={{ select: { displayEmpty: true } }}
                    >
                      <MenuItem value=''>Semua Status</MenuItem>
                      <MenuItem value='KONFIRMASI'>Konfirmasi</MenuItem>
                      <MenuItem value='PAID'>Lunas</MenuItem>
                      <MenuItem value='PENDING'>Menunggu</MenuItem>
                      <MenuItem value='CANCELLED'>Dibatalkan</MenuItem>
                      <MenuItem value='EXPIRED'>Kadaluarsa</MenuItem>
                    </CustomTextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      autoFocus
                      fullWidth
                      value={pendingCompany}
                      onChange={e => setPendingCompany(e.target.value)}
                      label='Nama Perusahaan'
                      placeholder='Cari perusahaan...'
                      onKeyDown={e => { if (e.key === 'Enter') handleApplyFilter() }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      type='date'
                      fullWidth
                      value={pendingInvoiceDari}
                      onChange={e => setPendingInvoiceDari(e.target.value)}
                      label='Invoice Dari'
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      type='date'
                      fullWidth
                      value={pendingInvoiceSampai}
                      onChange={e => setPendingInvoiceSampai(e.target.value)}
                      label='Invoice Sampai'
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      type='date'
                      fullWidth
                      value={pendingTanggalDari}
                      onChange={e => setPendingTanggalDari(e.target.value)}
                      label='Bayar Dari'
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      type='date'
                      fullWidth
                      value={pendingTanggalSampai}
                      onChange={e => setPendingTanggalSampai(e.target.value)}
                      label='Bayar Sampai'
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }} className='flex justify-end gap-2'>
                    <Button size='small' variant='outlined' color='secondary' onClick={() => setFilterAnchor(null)}>
                      Tutup
                    </Button>
                    <Button size='small' variant='contained' onClick={handleApplyFilter}>
                      Terapkan
                    </Button>
                  </Grid>
                </Grid>
              </Popover>
            </Box>
          }
        />

        {/* Info bar saat rekon aktif */}
        {rekonData.size > 0 && (
          <Box sx={{ px: 4, pb: 2 }}>
            <Alert
              severity='info'
              icon={<i className='tabler-table-check' />}
              sx={{ py: 0.5 }}
            >
              Rekon aktif dari <strong>{rekonFileName}</strong> — {rekonData.size} transaksi dimuat.
              Kolom rekon ditampilkan di tabel.
            </Alert>
          </Box>
        )}

        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
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
                    Tidak ada data invoice
                  </td>
                </tr>
              </tbody>
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
          component='div'
          count={totalCount}
          rowsPerPage={pageSize}
          page={currentPage}
          onPageChange={(_, page) => setCurrentPage(page)}
          onRowsPerPageChange={e => {
            setPageSize(Number(e.target.value))
            setCurrentPage(0)
          }}
        />
      </Card>

      {/* Dialog Rekon Excel */}
      <Dialog open={rekonDialog} onClose={() => !rekonProcessing && setRekonDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <i className='tabler-table-import text-xl' />
              <Typography variant='h6'>Rekonsiliasi Pembayaran</Typography>
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
                    {rekonParsed.filter(r => ['berhasil','success','paid','settlement'].includes(r.status.toLowerCase())).length}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>Status Berhasil</Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Hasil setelah proses */}
            {rekonResult && (
              <Box className='flex flex-col gap-2'>
                <Divider />
                <Typography variant='subtitle2'>Hasil Rekonsiliasi</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 3 }}>
                    <Box className='text-center p-2 border rounded'>
                      <Typography variant='h6' color='primary.main' className='font-bold'>{rekonResult.matched}</Typography>
                      <Typography variant='caption' color='text.secondary'>Cocok</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Box className='text-center p-2 border rounded'>
                      <Typography variant='h6' color='success.main' className='font-bold'>{rekonResult.updated}</Typography>
                      <Typography variant='caption' color='text.secondary'>Diupdate</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Box className='text-center p-2 border rounded'>
                      <Typography variant='h6' color='error.main' className='font-bold'>{rekonResult.unmatched}</Typography>
                      <Typography variant='caption' color='text.secondary'>Tidak Cocok</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Box className='text-center p-2 border rounded'>
                      <Typography variant='h6' color='text.secondary' className='font-bold'>{rekonResult.total}</Typography>
                      <Typography variant='caption' color='text.secondary'>Total</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {!rekonResult && (
              <Alert severity='info' icon={<i className='tabler-info-circle' />} sx={{ py: 0.5 }}>
                Proses rekon akan mencocokkan <strong>Ref ID</strong> dari Excel dengan <strong>ID Invoice</strong> di sistem.
                Invoice yang cocok dan berstatus <strong>Berhasil</strong> akan diupdate ke <strong>Lunas</strong>.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRekonDialog(false)} color='secondary' disabled={rekonProcessing}>
            Tutup
          </Button>
          {!rekonResult ? (
            <Button
              onClick={handleProsesRekon}
              variant='contained'
              color='primary'
              disabled={rekonProcessing}
              startIcon={rekonProcessing ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-check' />}
            >
              {rekonProcessing ? 'Memproses...' : 'Proses Rekon'}
            </Button>
          ) : (
            <Button
              onClick={handleResetRekon}
              variant='outlined'
              color='error'
              startIcon={<i className='tabler-trash' />}
            >
              Hapus Data Rekon
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog Detail Invoice */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, invoice: null })}
        maxWidth='md'
        fullWidth
        scroll='body'
      >
        <DialogTitle>
          <Box className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Typography variant='h6'>Detail Invoice</Typography>
              {detailDialog.invoice && (
                <Chip
                  label={statusLabels[detailDialog.invoice.status as InvoiceStatus] || detailDialog.invoice.status}
                  color={statusColors[detailDialog.invoice.status as InvoiceStatus] || 'default'}
                  size='small'
                  variant='tonal'
                />
              )}
            </div>
            <IconButton onClick={() => setDetailDialog({ open: false, invoice: null })} size='small'>
              <i className='tabler-x' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailDialog.invoice && (
            <Box className='flex flex-col gap-6'>
              {/* Header */}
              <Box className='p-4 bg-actionHover rounded flex justify-between flex-wrap gap-4'>
                <div>
                  <Typography variant='h6' color='primary' className='font-bold'>Rocket</Typography>
                  <Typography variant='caption' color='text.secondary'>Property Management System</Typography>
                </div>
                <div className='text-right'>
                  <Typography variant='h6' className='font-bold'>{detailDialog.invoice.nomorInvoice}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {dayjs(detailDialog.invoice.tanggalInvoice).format('DD MMMM YYYY')}
                  </Typography>
                </div>
              </Box>

              {/* Company & Dates */}
              <Box className='flex flex-wrap gap-6'>
                <Box className='flex-1 min-w-[200px]'>
                  <Typography variant='subtitle2' color='text.secondary' className='mb-1'>Ditagihkan Kepada</Typography>
                  <Typography className='font-semibold'>{detailDialog.invoice.company?.nama || '-'}</Typography>
                  {detailDialog.invoice.company?.alamat && (
                    <Typography variant='body2' color='text.secondary'>{detailDialog.invoice.company.alamat}</Typography>
                  )}
                  {detailDialog.invoice.company?.email && (
                    <Typography variant='body2' color='text.secondary'>{detailDialog.invoice.company.email}</Typography>
                  )}
                  {detailDialog.invoice.company?.telepon && (
                    <Typography variant='body2' color='text.secondary'>{detailDialog.invoice.company.telepon}</Typography>
                  )}
                </Box>
                <Box className='flex-1 min-w-[200px]'>
                  <Typography variant='subtitle2' color='text.secondary' className='mb-1'>Info Pembayaran</Typography>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='body2'><span className='font-medium'>Siklus:</span> {detailDialog.invoice.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'}</Typography>
                    <Typography variant='body2'><span className='font-medium'>Jatuh Tempo:</span> {dayjs(detailDialog.invoice.tanggalJatuhTempo).format('DD MMMM YYYY')}</Typography>
                    {detailDialog.invoice.tanggalBayar && (
                      <Typography variant='body2' color='success.main'><span className='font-medium'>Dibayar:</span> {dayjs(detailDialog.invoice.tanggalBayar).format('DD MMMM YYYY')}</Typography>
                    )}
                  </div>
                </Box>
              </Box>

              <Divider />

              {/* Amounts */}
              <Box className='flex flex-col gap-2'>
                <Typography variant='subtitle2' className='mb-1'>Rincian</Typography>
                <Box className='flex justify-between'>
                  <Typography color='text.secondary'>Paket {detailDialog.invoice.paket?.nama || '-'} ({detailDialog.invoice.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'})</Typography>
                  <Typography>{formatRupiah(detailDialog.invoice.subtotal)}</Typography>
                </Box>
                <Box className='flex justify-between'>
                  <Typography color='text.secondary'>PPN (11%)</Typography>
                  <Typography>{formatRupiah(detailDialog.invoice.pajak)}</Typography>
                </Box>
                <Divider className='my-1' />
                <Box className='flex justify-between'>
                  <Typography className='font-semibold'>Total</Typography>
                  <Typography color='primary.main' className='font-bold text-lg'>{formatRupiah(detailDialog.invoice.total)}</Typography>
                </Box>
              </Box>

              {/* Data Rekon dari DB */}
              {detailDialog.invoice.statusRekon && (
                <>
                  <Divider />
                  <Box>
                    <Box className='flex items-center gap-2 mb-3'>
                      <Typography variant='subtitle2'>Data Rekonsiliasi</Typography>
                      <Chip
                        label={detailDialog.invoice.statusRekon === 'SESUAI' ? 'Sesuai' : 'Tidak Sesuai'}
                        color={detailDialog.invoice.statusRekon === 'SESUAI' ? 'success' : 'error'}
                        size='small'
                        variant='tonal'
                      />
                    </Box>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Amount Bayar', value: detailDialog.invoice.amountPembayaran != null ? formatRupiah(detailDialog.invoice.amountPembayaran) : '-' },
                        { label: 'Fee', value: detailDialog.invoice.amountFee != null ? formatRupiah(detailDialog.invoice.amountFee) : '-' },
                        { label: 'Type', value: detailDialog.invoice.typePembayaran || '-' },
                        { label: 'Payment Channel', value: detailDialog.invoice.paymentChannel || '-' },
                        { label: 'Payment No', value: detailDialog.invoice.paymentNo || '-' }
                      ].map(item => (
                        <Grid key={item.label} size={{ xs: 6, sm: 4 }}>
                          <Typography variant='caption' color='text.secondary'>{item.label}</Typography>
                          <Typography variant='body2' className='font-medium'>{item.value}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </>
              )}

              {/* Bukti Pembayaran */}
              {detailDialog.invoice.buktiPembayaran && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant='subtitle2' className='mb-2'>Bukti Pembayaran</Typography>
                    {isImageUrl(detailDialog.invoice.buktiPembayaran) ? (
                      <Box className='flex justify-center p-2 border rounded'>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={detailDialog.invoice.buktiPembayaran}
                          alt='Bukti Pembayaran'
                          style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: 8 }}
                        />
                      </Box>
                    ) : isPdfUrl(detailDialog.invoice.buktiPembayaran) ? (
                      <Box sx={{ height: '400px' }} className='border rounded'>
                        <iframe
                          src={detailDialog.invoice.buktiPembayaran}
                          title='Bukti Pembayaran'
                          width='100%'
                          height='100%'
                          style={{ border: 'none', borderRadius: 8 }}
                        />
                      </Box>
                    ) : (
                      <Box className='text-center py-4 border rounded'>
                        <i className='tabler-file text-3xl text-textSecondary mb-2 block' />
                        <Typography variant='body2' color='text.secondary'>File tidak dapat ditampilkan</Typography>
                      </Box>
                    )}
                    <Button
                      component='a'
                      href={detailDialog.invoice.buktiPembayaran}
                      download
                      size='small'
                      variant='outlined'
                      startIcon={<i className='tabler-download' />}
                      className='mt-2'
                    >
                      Download Bukti
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {detailDialog.invoice?.status === 'KONFIRMASI' && (
            <>
              <Button
                color='error'
                variant='outlined'
                startIcon={<i className='tabler-circle-x' />}
                onClick={() => {
                  setDetailDialog({ open: false, invoice: null })
                  setRejectDialog({ open: true, invoice: detailDialog.invoice })
                }}
              >
                Tolak
              </Button>
              <Button
                color='success'
                variant='contained'
                startIcon={<i className='tabler-circle-check' />}
                onClick={() => {
                  setDetailDialog({ open: false, invoice: null })
                  setApproveDialog({ open: true, invoice: detailDialog.invoice })
                }}
              >
                Konfirmasi Lunas
              </Button>
            </>
          )}
          <Button onClick={() => setDetailDialog({ open: false, invoice: null })} color='secondary'>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Popup Bukti Pembayaran */}
      <Dialog open={buktiDialog.open} onClose={() => setBuktiDialog({ open: false, url: '' })} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box className='flex items-center justify-between'>
            <Typography variant='h6'>Bukti Pembayaran</Typography>
            <IconButton onClick={() => setBuktiDialog({ open: false, url: '' })} size='small'>
              <i className='tabler-x' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {buktiDialog.url && isImageUrl(buktiDialog.url) && (
            <Box className='flex justify-center'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buktiDialog.url}
                alt='Bukti Pembayaran'
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
              />
            </Box>
          )}
          {buktiDialog.url && isPdfUrl(buktiDialog.url) && (
            <Box sx={{ height: '70vh' }}>
              <iframe
                src={buktiDialog.url}
                title='Bukti Pembayaran'
                width='100%'
                height='100%'
                style={{ border: 'none', borderRadius: 8 }}
              />
            </Box>
          )}
          {buktiDialog.url && !isImageUrl(buktiDialog.url) && !isPdfUrl(buktiDialog.url) && (
            <Box className='text-center py-8'>
              <i className='tabler-file text-5xl text-textSecondary mb-4 block' />
              <Typography color='text.secondary'>File tidak dapat ditampilkan. Silakan download.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button component='a' href={buktiDialog.url} download variant='outlined' startIcon={<i className='tabler-download' />}>
            Download
          </Button>
          <Button onClick={() => setBuktiDialog({ open: false, url: '' })} variant='contained' color='secondary'>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Konfirmasi Lunas */}
      <Dialog
        open={approveDialog.open}
        onClose={() => !processing && setApproveDialog({ open: false, invoice: null })}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
        <DialogContent>
          <Typography>
            Tandai invoice <strong>{approveDialog.invoice?.nomorInvoice}</strong> dari{' '}
            <strong>{approveDialog.invoice?.company?.nama}</strong> sebagai <strong>Lunas</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ open: false, invoice: null })} disabled={processing} color='secondary'>
            Batal
          </Button>
          <Button
            onClick={async () => {
              if (!approveDialog.invoice) return
              setProcessing(true)
              try {
                await apiFetchClient(`/api/admin/invoice/${approveDialog.invoice.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ status: 'PAID' })
                })
                showSnack('Invoice berhasil dikonfirmasi sebagai Lunas')
                setApproveDialog({ open: false, invoice: null })
                fetchData(currentPage, pageSize, statusFilter, companyFilter, tanggalDari, tanggalSampai, invoiceDari, invoiceSampai)
              } catch {
                showSnack('Gagal mengkonfirmasi invoice', 'error')
              } finally {
                setProcessing(false)
              }
            }}
            disabled={processing}
            color='success'
            variant='contained'
            startIcon={processing ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-circle-check' />}
          >
            {processing ? 'Memproses...' : 'Ya, Lunas'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Tolak Konfirmasi */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => {
          if (!processing) {
            setRejectDialog({ open: false, invoice: null })
            setRejectReason('')
          }
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Tolak Konfirmasi</DialogTitle>
        <DialogContent>
          <Typography>
            Kembalikan invoice <strong>{rejectDialog.invoice?.nomorInvoice}</strong> ke status{' '}
            <strong>Menunggu Pembayaran</strong>?
          </Typography>
          <Typography variant='caption' color='text.secondary' className='mt-2 block'>
            Tenant perlu mengupload ulang bukti pembayaran.
          </Typography>
          <CustomTextField
            fullWidth
            multiline
            rows={3}
            label='Keterangan Penolakan *'
            placeholder='Tuliskan alasan penolakan...'
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className='mt-4'
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectDialog({ open: false, invoice: null })
              setRejectReason('')
            }}
            disabled={processing}
            color='secondary'
          >
            Batal
          </Button>
          <Button
            onClick={async () => {
              if (!rejectDialog.invoice) return
              if (!rejectReason.trim()) { showSnack('Keterangan penolakan wajib diisi', 'error'); return }
              setProcessing(true)
              try {
                await apiFetchClient(`/api/admin/invoice/${rejectDialog.invoice.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ status: 'PENDING', catatan: rejectReason.trim() })
                })
                showSnack('Invoice dikembalikan ke status Menunggu Pembayaran')
                setRejectDialog({ open: false, invoice: null })
                setRejectReason('')
                fetchData(currentPage, pageSize, statusFilter, companyFilter, tanggalDari, tanggalSampai, invoiceDari, invoiceSampai)
              } catch {
                showSnack('Gagal menolak konfirmasi', 'error')
              } finally {
                setProcessing(false)
              }
            }}
            disabled={processing || !rejectReason.trim()}
            color='error'
            variant='contained'
            startIcon={processing ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-circle-x' />}
          >
            {processing ? 'Memproses...' : 'Ya, Tolak'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default KonfirmasiPembayaranTable
