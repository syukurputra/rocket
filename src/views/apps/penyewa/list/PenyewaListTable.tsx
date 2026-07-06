'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import TablePagination from '@mui/material/TablePagination'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import type { TextFieldProps } from '@mui/material/TextField'
import { styled } from '@mui/material/styles'
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

import type { PenyewaClient } from '@/src/types/apps/penyewaTypes'

// Component Imports
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

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

const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({
    itemRank
  })

  return itemRank.passed
}

type PenyewaClientWithAction = PenyewaClient & { action?: string }

const columnHelper = createColumnHelper<PenyewaClientWithAction>()

interface PenyewaListTableProps {
  initialData?: PenyewaClient[]
}

const PenyewaListTable = ({ initialData = [] }: PenyewaListTableProps) => {
  const router = useRouter()
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<PenyewaClientWithAction[]>(initialData)
  const [filteredData, setFilteredData] = useState<PenyewaClientWithAction[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('') // New state for API search
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0) // Table uses 0-based indexing
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCountState, setPageCountState] = useState(0) // jumlah halaman dari API

  const { snack: snackbar, showSnack: showSnackbar, closeSnack } = useSnackbar()

  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const filterOpen = Boolean(filterAnchor)
  const [pendingSearch, setPendingSearch] = useState('')

  const activeFilterCount = [pendingSearch].filter(Boolean).length

  const handleApplyFilter = () => {
    setFilterAnchor(null)
    setSearchQuery(pendingSearch)
    setGlobalFilter(pendingSearch)
    setCurrentPage(0)
    fetchPenyewaData(0, pageSize, pendingSearch)
  }

  const handleResetFilter = () => {
    setFilterAnchor(null)
    setPendingSearch('')
    setSearchQuery('')
    setGlobalFilter('')
    setCurrentPage(0)
    fetchPenyewaData(0, pageSize, '')
  }

  const fetchPenyewaData = async (pageNum: number = 0, limitNum: number = 10, search: string = '') => {
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
        data: PenyewaClient[]
        pagination: {
          totalCount: number
          totalPages: number
          page: number
          limit: number
          hasNext: boolean
          hasPrev: boolean
        }
      }>(`/api/penyewa?${params.toString()}`, undefined, {
        redirectOn401: '/login'
      })

      const penyewaData = result.data || []
      const totalPagesFromAPI = result.pagination?.totalPages ?? 0
      const totalCountFromAPI = result.pagination?.totalCount

      const inferredTotalCount =
        totalCountFromAPI ?? (totalPagesFromAPI > 0 ? totalPagesFromAPI * limitNum : penyewaData.length)

      setData(penyewaData)
      setFilteredData(penyewaData)
      setTotalCount(inferredTotalCount)
      setPageCountState(totalPagesFromAPI || Math.ceil(inferredTotalCount / limitNum))
    } catch (err) {
      console.error('Failed to fetch penyewa data:', err)

      if (err instanceof Error && !err.message.includes('Request failed (401)')) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(0)
    fetchPenyewaData(0, pageSize, searchQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize])

  useEffect(() => {
    if (initialData.length === 0) {
      fetchPenyewaData(currentPage, pageSize, searchQuery)
    }
  }, [])

  useEffect(() => {
    if (initialData.length === 0) {
      fetchPenyewaData(currentPage, pageSize, searchQuery)
    }
  }, [currentPage])

  const columns = useMemo<ColumnDef<PenyewaClientWithAction, any>[]>(
    () => [
      columnHelper.accessor('nama', {
        header: 'Nama Penyewa',
        cell: ({ row }) => <Typography>{row.original.nama}</Typography>
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: ({ row }) => <Typography>{row.original.email || '-'}</Typography>
      }),
      columnHelper.accessor('nomorTelepon', {
        header: 'Nomor Telepon',
        cell: ({ row }) => <Typography>{row.original.nomorTelepon || '-'}</Typography>
      }),
      columnHelper.accessor('nomorKtp', {
        header: 'Nomor KTP',
        cell: ({ row }) => <Typography>{row.original.nomorKtp || '-'}</Typography>
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <Tooltip title='Ubah'>
              <IconButton onClick={() => router.push(`/penyewa/edit/${row.original.id}`)}>
                <i className='tabler-eye text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Hapus'>
              <IconButton
                onClick={async () => {
                  try {
                    await apiFetchClient(
                      `/api/penyewa/${row.original.id}`,
                      {
                        method: 'DELETE'
                      },
                      {
                        redirectOn401: '/login'
                      }
                    )

                    fetchPenyewaData(currentPage, pageSize, searchQuery)
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
            </Tooltip>
          </div>
        ),
        enableSorting: false
      })
    ],
    [data, filteredData, searchQuery, currentPage, pageSize, router]
  )

  const table = useReactTable({
    data: filteredData as PenyewaClient[],
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
            <Button onClick={() => fetchPenyewaData(currentPage, pageSize, searchQuery)} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (loading && data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            minHeight='400px'
            flexDirection='column'
            gap={2}
          >
            <CircularProgress size={60} />
            <Typography variant='body1' color='textSecondary'>
              Memuat data penyewa...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {loading && data.length > 0 && (
        <Box
          position='fixed'
          top={0}
          left={0}
          right={0}
          bottom={0}
          display='flex'
          justifyContent='center'
          alignItems='center'
          bgcolor='rgba(255, 255, 255, 0.8)'
          zIndex={9999}
        >
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={2}
            bgcolor='white'
            padding={4}
            borderRadius={2}
            boxShadow={3}
          >
            <CircularProgress size={60} />
            <Typography variant='body1' color='textSecondary'>
              Memuat data...
            </Typography>
          </Box>
        </Box>
      )}
      <Card>
        <CardHeader
          title='Daftar Penyewa'
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
                      placeholder='Cari penyewa...'
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
          <Button variant='contained' component={Link} href='/penyewa/add' startIcon={<i className='tabler-plus' />}>
            Tambah Penyewa
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
                    No data available
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
        <AppSnackbar snack={snackbar} onClose={closeSnack} />
      </Card>
    </>
  )
}

export default PenyewaListTable
