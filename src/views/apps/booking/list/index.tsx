'use client'

import { useState, useEffect, useMemo } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import TablePagination from '@mui/material/TablePagination'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Badge from '@mui/material/Badge'
import Collapse from '@mui/material/Collapse'
import Grid from '@mui/material/Grid2'

import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

import dayjs from 'dayjs'

import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import BookingDetailDialog from './BookingDetailDialog'

declare module '@tanstack/table-core' {
  interface FilterFns { fuzzy: FilterFn<unknown> }
  interface FilterMeta { itemRank: RankingInfo }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

type TagihanBooking = {
  id: string
  keterangan: string
  nominal: number
  status: string
  mulaiSewa: string
  selesaiSewa: string
  metodeBayar?: string | null
  buktiPembayaran?: string | null
  penyewa?: {
    id: string
    nama: string
    nomorTelepon?: string
    email?: string
    mulaiSewa: string
    selesaiSewa: string
    periodeSewa?: string
    status: string
    aset?: { id: string; nama: string }
    ruangan?: { id: string; nama: string }
  }
}

type TagihanWithAction = TagihanBooking & { action?: string }

const columnHelper = createColumnHelper<TagihanWithAction>()

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const BookingList = () => {
  const [data, setData] = useState<TagihanWithAction[]>([])
  const [filteredData, setFilteredData] = useState<TagihanWithAction[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCountState, setPageCountState] = useState(0)

  const [filterOpen, setFilterOpen] = useState(false)
  const [pendingSearch, setPendingSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const [selectedTagihan, setSelectedTagihan] = useState<TagihanBooking | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { snack, showSnack, closeSnack } = useSnackbar()

  const activeFilterCount = [activeSearch].filter(Boolean).length

  const fetchData = async (pageNum = 0, limit = 10, search = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(pageNum + 1), limit: String(limit) })

      if (search.trim()) params.append('search', search.trim())

      const result = await apiFetchClient<{
        data: TagihanBooking[]
        pagination: { totalCount: number; totalPages: number; page: number; limit: number }
      }>(`/api/booking?${params}`, undefined, { redirectOn401: '/login' })

      const rows = result.data || []
      const totalPages = result.pagination?.totalPages ?? 0
      const total = result.pagination?.totalCount ?? rows.length

      setData(rows)
      setFilteredData(rows)
      setTotalCount(total)
      setPageCountState(totalPages || Math.ceil(total / limit))
    } catch (err) {
      console.error('Fetch booking error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(currentPage, pageSize, activeSearch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, activeSearch])

  const handleApplyFilter = () => {
    setActiveSearch(pendingSearch)
    setCurrentPage(0)
  }

  const handleResetFilter = () => {
    setPendingSearch('')
    setActiveSearch('')
    setCurrentPage(0)
  }

  const columns = useMemo<ColumnDef<TagihanWithAction, any>[]>(
    () => [
      columnHelper.accessor('penyewa', {
        id: 'aset',
        header: 'Aset',
        cell: ({ row }) => <Typography>{row.original.penyewa?.aset?.nama || '-'}</Typography>
      }),
      columnHelper.accessor('penyewa', {
        id: 'ruangan',
        header: 'Nama Item Sewa',
        cell: ({ row }) => <Typography>{row.original.penyewa?.ruangan?.nama || '-'}</Typography>
      }),
      columnHelper.accessor('keterangan', {
        header: 'Keterangan',
        cell: ({ row }) => <Typography variant='body2'>{row.original.keterangan}</Typography>
      }),
      columnHelper.accessor('penyewa', {
        id: 'periodeSewa',
        header: 'Periode Sewa',
        cell: ({ row }) => (
          <Typography className='capitalize'>{row.original.penyewa?.periodeSewa || '-'}</Typography>
        )
      }),
      columnHelper.accessor('mulaiSewa', {
        header: 'Tanggal Mulai Sewa',
        cell: ({ row }) => <Typography>{dayjs(row.original.mulaiSewa).format('DD-MM-YYYY')}</Typography>
      }),
      columnHelper.accessor('selesaiSewa', {
        header: 'Tanggal Selesai Sewa',
        cell: ({ row }) => <Typography>{dayjs(row.original.selesaiSewa).format('DD-MM-YYYY')}</Typography>
      }),
      columnHelper.accessor('nominal', {
        header: 'Nominal',
        cell: ({ row }) => (
          <Typography fontWeight={600} color='primary.main'>
            {formatCurrency(Number(row.original.nominal))}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const s = row.original.status?.toLowerCase()

          if (s === 'lunas') return <Chip label='Lunas' color='success' size='small' variant='tonal' />
          if (s === 'dibatalkan') return <Chip label='Dibatalkan' color='default' size='small' variant='tonal' />

          return <Chip label='Belum Terbayar' color='error' size='small' variant='tonal' />
        }
      }),
      columnHelper.accessor('action', {
        header: 'Aksi',
        cell: ({ row }) => (
          <Tooltip title='Detail & Bayar'>
            <IconButton
              size='small'
              onClick={() => { setSelectedTagihan(row.original); setDetailOpen(true) }}
            >
              <i className='tabler-eye text-textSecondary' />
            </IconButton>
          </Tooltip>
        ),
        enableSorting: false
      })
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: {
      globalFilter,
      pagination: { pageIndex: currentPage, pageSize }
    },
    pageCount: pageCountState || Math.ceil(totalCount / pageSize),
    manualPagination: true,
    manualFiltering: true,
    globalFilterFn: fuzzyFilter,
    onPaginationChange: updater => {
      if (typeof updater === 'function') {
        const next = updater({ pageIndex: currentPage, pageSize })

        setCurrentPage(next.pageIndex)
        setPageSize(next.pageSize)
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

  if (loading && data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px' flexDirection='column' gap={2}>
            <CircularProgress size={60} />
            <Typography variant='body1' color='textSecondary'>Memuat data booking...</Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {loading && data.length > 0 && (
        <Box
          position='fixed' top={0} left={0} right={0} bottom={0}
          display='flex' justifyContent='center' alignItems='center'
          bgcolor='rgba(255,255,255,0.8)' zIndex={9999}
        >
          <Box display='flex' flexDirection='column' alignItems='center' gap={2} bgcolor='white' padding={4} borderRadius={2} boxShadow={3}>
            <CircularProgress size={60} />
            <Typography variant='body1' color='textSecondary'>Memuat data...</Typography>
          </Box>
        </Box>
      )}

      <Card>
        <CardHeader
          title='Daftar Booking'
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

        <Collapse in={filterOpen}>
          <Divider />
          <CardContent>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <CustomTextField
                  fullWidth
                  label='Cari'
                  placeholder='Cari keterangan / aset...'
                  value={pendingSearch}
                  onChange={e => setPendingSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleApplyFilter() }}
                />
              </Grid>
              <Grid size={{ xs: 12 }} className='flex justify-end'>
                <Button variant='contained' startIcon={<i className='tabler-search' />} onClick={handleApplyFilter}>
                  Cari
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>

        <Divider />

        <CardContent className='flex items-end gap-4 flex-wrap'>
          <CustomTextField
            select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0) }}
            className='is-[70px]'
            label='Show'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
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
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.slice(0, table.getState().pagination.pageSize).map(row => (
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
          count={totalCount || pageCountState * pageSize}
          rowsPerPage={pageSize}
          page={currentPage}
          onPageChange={(_, p) => setCurrentPage(p)}
          onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0) }}
        />

        <AppSnackbar snack={snack} onClose={closeSnack} />
      </Card>

      <BookingDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        tagihan={selectedTagihan}
        onPaid={() => fetchData(currentPage, pageSize, activeSearch)}
      />
    </>
  )
}

export default BookingList
