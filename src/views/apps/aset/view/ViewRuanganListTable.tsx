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
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import type { TextFieldProps } from '@mui/material/TextField'

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
import type { ThemeColor } from '@core/types'
import type { RuanganClient } from '@/src/types/apps/ruanganTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// Util Imports
import { getInitials } from '@/src/utils/getInitials'
import { getLocalizedUrl } from '@/src/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import type { ButtonProps } from '@mui/material/Button'

import AddEditRuang from '@components/dialogs/ruangan'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
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

type RuanganClientWithAction = RuanganClient & { action?: string }

// Column Definitions
const columnHelper = createColumnHelper<RuanganClientWithAction>()

interface RuanganListTableProps {
  asetId?: string
  initialData?: RuanganClient[]
}

const ViewRuanganListTable = ({ asetId, initialData = [] }: RuanganListTableProps) => {
  const params = useParams()
  const id = asetId || (params?.id as string)

  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<RuanganClientWithAction[]>(initialData)
  const [filteredData, setFilteredData] = useState<RuanganClientWithAction[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0) // Table uses 0-based indexing
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const fetchRuanganData = async (pageNum: number = 0, limitNum: number = 10) => {
    try {
      setLoading(true)
      setError(null)

      const qs = new URLSearchParams({
        page: String(pageNum + 1),
        limit: String(limitNum)
      })

      const result = await apiFetchClient<{data: RuanganClient[], total: number}>(
        `/api/ruangan?${qs.toString()}`,
        undefined, {
        redirectOn401: '/id/login'
      })

      const asetData = result.data || []
      const total = result.total || 0

      setData(asetData)
      setFilteredData(asetData)
      setTotalCount(total)
    } catch (err) {
      console.error('Failed to fetch ruangan data:', err)
      if (err instanceof Error && !err.message.includes('Request failed (401)')) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialData.length === 0) {
      fetchRuanganData(currentPage, pageSize)
    } else {
      setTotalCount(initialData.length)
    }
  }, [])

  useEffect(() => {
    if (initialData.length === 0) {
      fetchRuanganData(currentPage, pageSize)
    }
  }, [currentPage, pageSize])

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Tambah'
  }

  const columns = useMemo<ColumnDef<RuanganClientWithAction, any>[]>(
    () => [
      columnHelper.accessor('nama', {
        header: 'Nama Ruangan',
        cell: ({ row }) => <Typography>{`${row.original.nama}`}</Typography>
      }),
      columnHelper.accessor('nominal', {
        header: 'Nominal Sewa',
        cell: ({ row }) => {
          const formatNumber = (num: number): string => {
            if (!num || num === 0) return '0'
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          }

          return (
            <Typography>
              Rp{formatNumber(row.original.nominal)}
            </Typography>
          )
        }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          return row.original.status === true ? (
            <Chip label='Aktif' color='success' size='small' variant='tonal' />
          ) : (
            <Chip label='Non Aktif' color='error' size='small' variant='tonal' />
          )
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
                'aria-label': 'Preview / Edit',
                children: <i className='tabler-eye text-textSecondary' />
              }}
              dialog={AddEditRuang}
              // kirim prop ke dialog untuk mode edit + data awal
              dialogProps={{
                asetId: asetId,
                mode: 'edit',
                initialData: row.original,
                onSaved: (updated: RuanganClient) => {
                  setData(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))
                  setFilteredData(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))
                  showSnackbar('Aset berhasil diperbarui', 'success')
                }
              }}
            />
            <IconButton onClick={async () => {
              try {
                await apiFetchClient(`/api/ruangan/${row.original.id}`, {
                  method: 'DELETE'
                }, {
                  redirectOn401: '/id/login'
                })

                setData(prev => prev.filter(ruangan => ruangan.id !== row.original.id))
                setFilteredData(prev => prev.filter(ruangan => ruangan.id !== row.original.id))

                setTotalCount(prev => prev - 1)
                showSnackbar('Ruangan berhasil dihapus', 'success')
              } catch (err) {
                console.error('Delete failed:', err)
                const errorMessage = err instanceof Error ? err.message : 'Failed to delete item'
                showSnackbar(errorMessage, 'error')
              }
            }}>
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    [data, filteredData]
  )

  const table = useReactTable({
    data: filteredData as RuanganClient[],
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
    pageCount: Math.ceil(totalCount / pageSize),
    manualPagination: true,
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
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
          <Alert severity="error">
            {error}
            <Button onClick={() => fetchRuanganData(currentPage, pageSize)} sx={{ ml: 2 }}>
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
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
            flexDirection="column"
            gap={2}
          >
            <CircularProgress size={60} />
            <Typography variant="body1" color="textSecondary">
              Memuat data ruangan...
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
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor="rgba(255, 255, 255, 0.8)"
          zIndex={9999}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
            bgcolor="white"
            padding={4}
            borderRadius={2}
            boxShadow={3}
          >
            <CircularProgress size={60} />
            <Typography variant="body1" color="textSecondary">
              Memuat data...
            </Typography>
          </Box>
        </Box>
      )}
      <Card>
        <CardContent className='flex justify-between flex-col items-start md:items-center md:flex-row gap-4'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4 is-full sm:is-auto'>
            <div className='flex items-center gap-2 is-full sm:is-auto'>
              <Typography className='hidden sm:block'>Show</Typography>
              <CustomTextField
                select
                value={table.getState().pagination.pageSize}
                onChange={e => {
                  const newPageSize = Number(e.target.value)
                  setPageSize(newPageSize)
                  setCurrentPage(0)
                  table.setPageSize(newPageSize)
                }}
                className='is-[70px] max-sm:is-full'
              >
                <MenuItem value='10'>10</MenuItem>
                <MenuItem value='25'>25</MenuItem>
                <MenuItem value='50'>50</MenuItem>
              </CustomTextField>
            </div>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps}
              dialog={AddEditRuang}
              dialogProps={{
                asetId: asetId
              }}
            />
          </div>
          <div className='flex max-sm:flex-col max-sm:is-full sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Aset'
              className='max-sm:is-full sm:is-[250px]'
            />
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
                    Tidak ada data yang ditambahkan
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
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            setCurrentPage(page)
            table.setPageIndex(page)
          }}
          onRowsPerPageChange={e => {
            const newPageSize = Number(e.target.value)
            setPageSize(newPageSize)
            setCurrentPage(0)
            table.setPageSize(newPageSize)
          }}
        />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Card>
    </>
  )
}

export default ViewRuanganListTable
