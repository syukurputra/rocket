'use client'

import { useState, useEffect, useMemo } from 'react'

import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
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

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Utils
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

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

const columnHelper = createColumnHelper<InvoiceClient>()

const InvoiceListTable = () => {
  const [data, setData] = useState<InvoiceClient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCountState, setPageCountState] = useState(0)
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; invoice: InvoiceClient | null }>({
    open: false,
    invoice: null
  })
  const [cancelling, setCancelling] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  const fetchData = async (page = 0, limit = 10, status = '') => {
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(limit)
      })

      if (status) params.append('status', status)

      const result = await apiFetchClient<{
        data: InvoiceClient[]
        pagination: {
          totalCount: number
          totalPages: number
          page: number
          limit: number
        }
      }>(`/api/invoice?${params.toString()}`, undefined, { redirectOn401: '/login' })

      setData(result.data || [])
      setTotalCount(result.pagination?.totalCount ?? 0)
      setPageCountState(result.pagination?.totalPages ?? 0)
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    }
  }

  useEffect(() => {
    fetchData(currentPage, pageSize, statusFilter)
  }, [currentPage, pageSize, statusFilter])

  const formatRupiah = (num: number | string): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(n)
  }

  const handleCancelConfirm = async () => {
    if (!cancelDialog.invoice) return

    setCancelling(true)

    try {
      await apiFetchClient(`/api/invoice/${cancelDialog.invoice.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' })
      })

      showSnack('Invoice berhasil dibatalkan')
      setCancelDialog({ open: false, invoice: null })
      fetchData(currentPage, pageSize, statusFilter)
    } catch {
      showSnack('Gagal membatalkan invoice', 'error')
    } finally {
      setCancelling(false)
    }
  }

  const columns = useMemo<ColumnDef<InvoiceClient, any>[]>(
    () => [
      columnHelper.accessor('nomorInvoice', {
        header: 'No. Invoice',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Link href={`/setting/invoice/preview/${row.original.id}`}>
              <Typography color='primary.main' className='font-medium hover:underline cursor-pointer'>
                {row.original.nomorInvoice}
              </Typography>
            </Link>
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status as InvoiceStatus

          return (
            <Chip
              label={statusLabels[status] || status}
              color={statusColors[status] || 'default'}
              size='small'
              variant='tonal'
            />
          )
        }
      }),
      columnHelper.accessor('paketId', {
        header: 'Paket',
        cell: ({ row }) => (
          <Typography>{row.original.paket?.nama || '-'}</Typography>
        )
      }),
      columnHelper.accessor('billingCycle', {
        header: 'Siklus',
        cell: ({ row }) => (
          <Chip
            label={row.original.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'}
            size='small'
            variant='tonal'
            color='info'
          />
        )
      }),
      columnHelper.accessor('total', {
        header: 'Total',
        cell: ({ row }) => (
          <Typography className='font-medium'>{formatRupiah(row.original.total)}</Typography>
        )
      }),
      columnHelper.accessor('tanggalInvoice', {
        header: 'Tanggal',
        cell: ({ row }) => (
          <Typography>{dayjs(row.original.tanggalInvoice).format('DD-MM-YYYY')}</Typography>
        )
      }),
      columnHelper.accessor('tanggalJatuhTempo', {
        header: 'Jatuh Tempo',
        cell: ({ row }) => {
          const due = dayjs(row.original.tanggalJatuhTempo)
          const isOverdue = due.isBefore(dayjs()) && row.original.status === 'PENDING'

          return (
            <Typography color={isOverdue ? 'error.main' : 'text.primary'}>
              {due.format('DD-MM-YYYY')}
            </Typography>
          )
        }
      }),
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }: any) => (
          <div className='flex items-center'>
            <Tooltip title='Lihat Detail'>
              <IconButton
                component={Link}
                href={`/setting/invoice/preview/${row.original.id}`}
                aria-label='Preview'
              >
                <i className='tabler-eye text-textSecondary' />
              </IconButton>
            </Tooltip>
            {row.original.status === 'PENDING' && (
              <Tooltip title='Batalkan Invoice'>
                <IconButton
                  aria-label='Cancel'
                  color='error'
                  onClick={() => setCancelDialog({ open: true, invoice: row.original })}
                >
                  <i className='tabler-ban' />
                </IconButton>
              </Tooltip>
            )}
          </div>
        )
      }
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: () => true },
    state: {
      pagination: {
        pageIndex: currentPage,
        pageSize
      }
    },
    pageCount: pageCountState || Math.ceil(totalCount / pageSize),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card>
      <CardHeader title='Daftar Invoice' />
      <Divider />
      <CardContent className='flex justify-between flex-wrap items-center gap-4'>
        <div className='flex items-center gap-4 flex-wrap'>
          <div className='flex items-center gap-2'>
            <Typography className='hidden sm:block'>Show</Typography>
            <CustomTextField
              select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value))
                setCurrentPage(0)
              }}
              className='is-[70px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>
          </div>
          <CustomTextField
            select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
              setCurrentPage(0)
            }}
            className='is-[160px]'
            label='Filter Status'
          >
            <MenuItem value=''>Semua</MenuItem>
            <MenuItem value='PENDING'>Menunggu</MenuItem>
            <MenuItem value='KONFIRMASI'>Konfirmasi</MenuItem>
            <MenuItem value='PAID'>Lunas</MenuItem>
            <MenuItem value='CANCELLED'>Dibatalkan</MenuItem>
            <MenuItem value='EXPIRED'>Kadaluarsa</MenuItem>
          </CustomTextField>
        </div>
        <DebouncedInput
          value={searchQuery}
          onChange={value => {
            setSearchQuery(String(value))
            setCurrentPage(0)
          }}
          placeholder='Cari Invoice'
          className='sm:is-[250px]'
        />
      </CardContent>

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

      {/* Konfirmasi Batalkan Invoice */}
      <Dialog
        open={cancelDialog.open}
        onClose={() => !cancelling && setCancelDialog({ open: false, invoice: null })}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Batalkan Invoice</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin membatalkan invoice{' '}
            <strong>{cancelDialog.invoice?.nomorInvoice}</strong>?
          </Typography>
          <Typography variant='caption' color='text.secondary' className='mt-2 block'>
            Tindakan ini tidak dapat diurungkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCancelDialog({ open: false, invoice: null })}
            disabled={cancelling}
            color='secondary'
          >
            Tutup
          </Button>
          <Button
            onClick={handleCancelConfirm}
            disabled={cancelling}
            color='error'
            variant='contained'
            startIcon={cancelling ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-ban' />}
          >
            {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </Card>
  )
}

export default InvoiceListTable
