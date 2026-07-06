'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import type { TextFieldProps } from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Popover from '@mui/material/Popover'
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

// Type Imports

import type { AsetClient } from '@/src/types/apps/asetTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Util Imports

// Style Imports
import tableStyles from '@core/styles/table.module.css'

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

type AsetClientWithAction = AsetClient & { action?: string }

// Column Definitions
const columnHelper = createColumnHelper<AsetClientWithAction>()

interface AsetListTableProps {
  initialData?: AsetClient[]
}

const AsetListTable = ({ initialData = [] }: AsetListTableProps) => {
  const router = useRouter()
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<AsetClientWithAction[]>(initialData)
  const [filteredData, setFilteredData] = useState<AsetClientWithAction[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('') // New state for API search
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0) // Table uses 0-based indexing
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCountState, setPageCountState] = useState(0) // jumlah halaman dari API

  const { snack, showSnack: showSnackbar, closeSnack } = useSnackbar()

  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const filterOpen = Boolean(filterAnchor)
  const [pendingSearch, setPendingSearch] = useState('')

  const activeFilterCount = [pendingSearch].filter(Boolean).length

  const handleApplyFilter = () => {
    setFilterAnchor(null)
    setSearchQuery(pendingSearch)
    setGlobalFilter(pendingSearch)
    setCurrentPage(0)
    fetchAsetData(0, pageSize, pendingSearch)
  }

  const handleResetFilter = () => {
    setFilterAnchor(null)
    setPendingSearch('')
    setSearchQuery('')
    setGlobalFilter('')
    setCurrentPage(0)
    fetchAsetData(0, pageSize, '')
  }

  const fetchAsetData = async (pageNum: number = 0, limitNum: number = 10, search: string = '') => {
    try {
      setError(null)

      const params = new URLSearchParams({
        page: String(pageNum + 1),
        limit: String(limitNum)
      })

      if (search.trim()) {
        params.append('search', search.trim())
      }

      const result = await apiFetchClient<{
        data: AsetClient[]
        pagination: {
          totalCount: number
          totalPages: number
          page: number
          limit: number
          hasNext: boolean
          hasPrev: boolean
        }
      }>(`/api/aset?${params.toString()}`, undefined, {
        redirectOn401: '/login'
      })

      const asetData = result.data || []
      const totalPagesFromAPI = result.pagination?.totalPages ?? 0
      const totalCountFromAPI = result.pagination?.totalCount

      const inferredTotalCount =
        totalCountFromAPI ?? (totalPagesFromAPI > 0 ? totalPagesFromAPI * limitNum : asetData.length)

      setData(asetData)
      setFilteredData(asetData)
      setTotalCount(inferredTotalCount)
      setPageCountState(totalPagesFromAPI || Math.ceil(inferredTotalCount / limitNum))
    } catch (err) {
      console.error('Failed to fetch aset data:', err)

      if (err instanceof Error && !err.message.includes('Request failed (401)')) {
        setError(err.message)
      }
    }
  }

  useEffect(() => {
    setCurrentPage(0)
    fetchAsetData(0, pageSize, searchQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize])

  useEffect(() => {
    if (initialData.length === 0) {
      fetchAsetData(currentPage, pageSize, searchQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (initialData.length === 0) {
      fetchAsetData(currentPage, pageSize, searchQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const columns = useMemo<ColumnDef<AsetClientWithAction, any>[]>(
    () => [
      columnHelper.accessor('jenis', {
        header: 'Jenis Aset',
        cell: ({ row }) => <Typography>{`${row.original.jenis}`}</Typography>
      }),
      columnHelper.accessor('nama', {
        header: 'Nama Aset',
        cell: ({ row }) => <Typography>{`${row.original.nama}`}</Typography>
      }),
      columnHelper.accessor('alamat', {
        header: 'Alamat Aset',
        cell: ({ row }) => <Typography>{`${row.original.alamat}`}</Typography>
      }),
      columnHelper.accessor('kota', {
        header: 'Kota',
        cell: ({ row }) => <Typography>{`${row.original.kota}`}</Typography>
      }),
      columnHelper.accessor('provinsi', {
        header: 'Provinsi',
        cell: ({ row }) => <Typography>{`${row.original.provinsi}`}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status

          if (status === 'aktif') {
            return <Chip label='Aktif' color='success' size='small' variant='tonal' />
          } else if (status === 'non aktif') {
            return <Chip label='Non Aktif' color='error' size='small' variant='tonal' />
          } else if (status === 'publish') {
            return <Chip label='Publish' color='info' size='small' variant='tonal' />
          }

          return <Chip label={status} color='default' size='small' variant='tonal' />
        }
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <Tooltip title='Jika Status Publish Bisa Dibuka'>
              <IconButton
                aria-label='Lihat'
                onClick={() => window.open(`/publish/${row.original.id}`, '_blank')}
                className='flex'
              >
                <i className='tabler-world-www text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Ubah'>
              <IconButton
                aria-label='Ubah'
                onClick={() => router.push(`/aset/edit/${row.original.id}`)}
                className='flex'
              >
                <i className='tabler-home-edit text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Hapus'>
              <IconButton
                onClick={async () => {
                  try {
                    await apiFetchClient(
                      `/api/aset/${row.original.id}`,
                      {
                        method: 'DELETE'
                      },
                      {
                        redirectOn401: '/login'
                      }
                    )

                    fetchAsetData(currentPage, pageSize, searchQuery)
                    showSnackbar('Aset berhasil dihapus', 'success')
                  } catch (err) {
                    console.error('Delete failed:', err)
                    const errorMessage = err instanceof Error ? err.message : 'Failed to delete item'

                    showSnackbar(errorMessage, 'error')
                  }
                }}
              >
                <i className='tabler-trash text-textSecondary' />
              </IconButton>
            </Tooltip>
          </div>
        ),
        enableSorting: false
      })
    ],
    [currentPage, pageSize, searchQuery, router]
  )

  const table = useReactTable({
    data: filteredData as AsetClient[],
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
            <Button onClick={() => fetchAsetData(currentPage, pageSize, searchQuery)} sx={{ ml: 2 }}>
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
          title='Daftar Aset'
          action={
            <Box display='flex' alignItems='center' gap={2}>
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
                slotProps={{ paper: { sx: { mt: 1, p: 3, minWidth: 320 } } }}
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <CustomTextField
                      autoFocus
                      fullWidth
                      label='Cari'
                      placeholder='Cari aset...'
                      value={pendingSearch}
                      onChange={e => setPendingSearch(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleApplyFilter() }}
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
        <Divider />
        <CardContent className='flex items-end gap-4 flex-wrap'>
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
          <Button variant='contained' component={Link} href='/aset/add' startIcon={<i className='tabler-plus' />}>
            Tambah Aset
          </Button>
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
                {table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => {
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

export default AsetListTable
