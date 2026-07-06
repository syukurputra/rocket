'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

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
import type { ButtonProps } from '@mui/material/Button'

import { styled } from '@mui/material/styles'

import type { IconClient } from '@/src/types/apps/iconTypes'

// Component Imports
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// MUI Imports

import AddEditIcon from '@components/dialogs/master/icon'
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

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({
    itemRank
  })

  return itemRank.passed
}

type IconClientWithAction = IconClient & { action?: string }

// Column Definitions
const columnHelper = createColumnHelper<IconClientWithAction>()

interface IconListTableProps {
  initialData?: IconClient[]
}

const Icon = styled('i')({})

const IconListTable = ({ initialData = [] }: IconListTableProps) => {
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<IconClientWithAction[]>(initialData)
  const [filteredData, setFilteredData] = useState<IconClientWithAction[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('') // New state for API search
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
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
    fetchIconData(0, pageSize, pendingSearch)
  }

  const handleResetFilter = () => {
    setFilterAnchor(null)
    setPendingSearch('')
    setSearchQuery('')
    setGlobalFilter('')
    setCurrentPage(0)
    fetchIconData(0, pageSize, '')
  }

  const fetchIconData = async (pageNum: number = 0, limitNum: number = 10, search: string = '') => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: String(pageNum + 1),
        limit: String(limitNum)
      })

      if (search.trim()) {
        params.append('search', search.trim())
      }

      const result = await apiFetchClient<{
        data: IconClient[]
        pagination: {
          totalCount: number
          totalPages: number
          page: number
          limit: number
          hasNext: boolean
          hasPrev: boolean
        }
      }>(`/api/master/icon?${params.toString()}`, undefined, {
        redirectOn401: '/login'
      })

      const iconData = result.data || []
      const totalPagesFromAPI = result.pagination?.totalPages ?? 0
      const totalCountFromAPI = result.pagination?.totalCount

      const inferredTotalCount =
        totalCountFromAPI ?? (totalPagesFromAPI > 0 ? totalPagesFromAPI * limitNum : iconData.length)

      setData(iconData)
      setFilteredData(iconData)
      setTotalCount(inferredTotalCount)
      setPageCountState(totalPagesFromAPI || Math.ceil(inferredTotalCount / limitNum))
    } catch (err) {
      console.error('Failed to fetch icon data:', err)

      if (err instanceof Error && !err.message.includes('Request failed (401)')) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(0)
    fetchIconData(0, pageSize, searchQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize])

  useEffect(() => {
    if (initialData.length === 0) {
      fetchIconData(currentPage, pageSize, searchQuery)
    }
  }, [])

  useEffect(() => {
    if (initialData.length === 0) {
      fetchIconData(currentPage, pageSize, searchQuery)
    }
  }, [currentPage])

  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Tambah'
  }

  const columns = useMemo<ColumnDef<IconClientWithAction, any>[]>(
    () => [
      columnHelper.accessor('nama', {
        header: 'Nama Icon',
        cell: ({ row }) => <Typography fontWeight={600}>{`${row.original.nama}`}</Typography>
      }),
      {
        id: 'render',
        header: 'Render Icon',
        cell: ({ row }: any) => {
          const iconCode = row.original.code

          return (
            <div className='flex items-center justify-center'>
              {iconCode ? (
                <>
                  <Icon className={iconCode} sx={{ fontSize: '2rem', color: 'var(--mui-palette-text-primary)' }} />
                </>
              ) : (
                <Typography variant='caption' color='text.secondary'>
                  No icon
                </Typography>
              )}
            </div>
          )
        }
      },
      columnHelper.accessor('code', {
        header: 'Code Icon',
        cell: ({ row }) => {
          return <Typography className='text-sm font-mono'>{row.original.code}</Typography>
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
                'aria-label': 'Ubah',
                children: <i className='tabler-edit text-textSecondary' />
              }}
              dialog={AddEditIcon}
              dialogProps={{
                mode: 'edit',
                initialData: row.original,
                onSaved: (updated: IconClient) => {
                  fetchIconData(currentPage, pageSize, searchQuery)
                  showSnackbar('Icon berhasil diperbarui', 'success')
                }
              }}
            />
            <IconButton
              onClick={async () => {
                try {
                  await apiFetchClient(
                    `/api/master/icon/${row.original.id}`,
                    {
                      method: 'DELETE'
                    },
                    {
                      redirectOn401: '/login'
                    }
                  )

                  fetchIconData(currentPage, pageSize, searchQuery)
                  showSnackbar('Icon berhasil dihapus', 'success')
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
    [data, filteredData, searchQuery]
  )

  const table = useReactTable({
    data: filteredData as IconClient[],
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
            <Button onClick={() => fetchIconData(currentPage, pageSize, searchQuery)} sx={{ ml: 2 }}>
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
              Memuat data icon...
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
          title='Master Icon'
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
                      placeholder='Cari icon...'
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
          <OpenDialogOnElementClick
            element={Button}
            elementProps={buttonProps}
            dialog={AddEditIcon}
            dialogProps={{}}
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

export default IconListTable


