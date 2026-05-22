'use client'

import { useState, useEffect, useMemo } from 'react'

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
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'

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

const columnHelper = createColumnHelper<InvoiceWithCompany>()

const KonfirmasiPembayaranTable = () => {
  const [data, setData] = useState<InvoiceWithCompany[]>([])
  const [statusFilter, setStatusFilter] = useState('KONFIRMASI')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCountState, setPageCountState] = useState(0)

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

  const fetchData = async (page = 0, limit = 10, status = 'KONFIRMASI') => {
    try {
      const params = new URLSearchParams({ page: String(page + 1), limit: String(limit) })

      if (status) params.append('status', status)

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

  useEffect(() => {
    fetchData(currentPage, pageSize, statusFilter)
  }, [currentPage, pageSize, statusFilter])

  const formatRupiah = (num: number | string) => {
    const n = typeof num === 'string' ? parseFloat(num) : num

    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  }

  const handleApprove = async () => {
    if (!approveDialog.invoice) return

    setProcessing(true)

    try {
      await apiFetchClient(`/api/admin/invoice/${approveDialog.invoice.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PAID' })
      })

      showSnack('Invoice berhasil dikonfirmasi sebagai Lunas')
      setApproveDialog({ open: false, invoice: null })
      fetchData(currentPage, pageSize, statusFilter)
    } catch {
      showSnack('Gagal mengkonfirmasi invoice', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog.invoice) return

    if (!rejectReason.trim()) {
      showSnack('Keterangan penolakan wajib diisi', 'error')

      return
    }

    setProcessing(true)

    try {
      await apiFetchClient(`/api/admin/invoice/${rejectDialog.invoice.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PENDING', catatan: rejectReason.trim() })
      })

      showSnack('Invoice dikembalikan ke status Menunggu Pembayaran')
      setRejectDialog({ open: false, invoice: null })
      setRejectReason('')
      fetchData(currentPage, pageSize, statusFilter)
    } catch {
      showSnack('Gagal menolak konfirmasi', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const columns = useMemo<ColumnDef<InvoiceWithCompany, any>[]>(
    () => [
      columnHelper.accessor('nomorInvoice', {
        header: 'No. Invoice',
        cell: ({ row }) => (
          <Typography color='primary.main' className='font-medium'>
            {row.original.nomorInvoice}
          </Typography>
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
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: { pagination: { pageIndex: currentPage, pageSize } },
    pageCount: pageCountState || Math.ceil(totalCount / pageSize),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader title='Konfirmasi Pembayaran' />
        <Divider />
        <CardContent className='flex justify-between flex-wrap items-center gap-4'>
          <CustomTextField
            select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
              setCurrentPage(0)
            }}
            className='is-[180px]'
            label='Filter Status'
          >
            <MenuItem value='KONFIRMASI'>Konfirmasi</MenuItem>
            <MenuItem value='PAID'>Lunas</MenuItem>
            <MenuItem value='PENDING'>Menunggu</MenuItem>
            <MenuItem value=''>Semua</MenuItem>
          </CustomTextField>
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
      </Card>

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

              {/* Catatan */}
              {detailDialog.invoice.catatan && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant='subtitle2' className='mb-1'>Catatan</Typography>
                    <Typography variant='body2' color='text.secondary'>{detailDialog.invoice.catatan}</Typography>
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
            onClick={handleApprove}
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
            onClick={handleReject}
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
