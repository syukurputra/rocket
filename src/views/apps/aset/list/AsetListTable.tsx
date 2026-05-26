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
    const timeoutId = setTimeout(() => {
      setCurrentPage(0)
      fetchAsetData(0, pageSize, searchQuery)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, pageSize])

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

  const handleSearchChange = (value: string | number) => {
    const searchValue = String(value)

    setSearchQuery(searchValue)
    setGlobalFilter(searchValue) // Keep local filter in sync for UI
  }

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
        <CardContent className='flex justify-between flex-col items-start md:items-center md:flex-row gap-4'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4 is-full sm:is-auto'>
            <div className='flex items-center gap-2 is-full sm:is-auto'>
              <Typography className='hidden sm:block'>Show</Typography>
              <CustomTextField
                select
                value={pageSize}
                onChange={e => {
                  const newPageSize = Number(e.target.value)

                  setPageSize(newPageSize)
                  setCurrentPage(0)
                }}
                className='is-[70px] max-sm:is-full'
              >
                <MenuItem value='10'>10</MenuItem>
                <MenuItem value='25'>25</MenuItem>
                <MenuItem value='50'>50</MenuItem>
              </CustomTextField>
            </div>
            <Button variant='contained' component={Link} href='/aset/add' startIcon={<i className='tabler-plus' />}>
              Tambah Aset
            </Button>
          </div>
          <div className='flex max-sm:flex-col max-sm:is-full sm:items-center gap-4'>
            <DebouncedInput
              value={searchQuery}
              onChange={handleSearchChange}
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
