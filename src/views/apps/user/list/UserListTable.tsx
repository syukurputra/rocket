'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import type { TextFieldProps } from '@mui/material/TextField'
import Button from '@mui/material/Button'

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
import type { UserClient } from '@/src/types/apps/userTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Util Imports
import { apiFetchClient } from '@/src/utils/apiFetchClient'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

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

  addMeta({ itemRank })

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

type UserClientWithAction = UserClient & { action?: string }

const columnHelper = createColumnHelper<UserClientWithAction>()

const UserListTable = () => {
  const [data, setData] = useState<UserClientWithAction[]>([])
  const [filteredData, setFilteredData] = useState<UserClientWithAction[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiFetchClient<{
        data: UserClient[]
        message?: string
      }>('/api/user', undefined, {
        redirectOn401: '/id/login'
      })

      const userData = result.data || []

      setData(userData)
      setFilteredData(userData)
    } catch (err) {
      console.error('Failed to fetch user data:', err)

      if (err instanceof Error && !err.message.includes('Request failed (401)')) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const columns = useMemo<ColumnDef<UserClientWithAction, any>[]>(
    () => [
      columnHelper.accessor('username', {
        header: 'Username',
        cell: ({ row }) => <Typography fontWeight={600}>{row.original.username}</Typography>
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: ({ row }) => <Typography>{row.original.email}</Typography>
      }),
      columnHelper.accessor('company', {
        header: 'Company',
        cell: ({ row }) => <Typography>{row.original.company?.nama || '-'}</Typography>
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: ({ row }) => <Typography>{row.original.role?.nama || '-'}</Typography>
      }),
      columnHelper.accessor('isSuperAdmin', {
        header: 'Super Admin',
        cell: ({ row }) => {
          return row.original.isSuperAdmin ? (
            <Chip label='Yes' color='primary' size='small' variant='tonal' />
          ) : (
            <Chip label='No' color='default' size='small' variant='tonal' />
          )
        }
      }),
      columnHelper.accessor('verifikasi', {
        header: 'Verified',
        cell: ({ row }) => {
          return row.original.verifikasi ? (
            <Chip label='Verified' color='success' size='small' variant='tonal' />
          ) : (
            <Chip label='Not Verified' color='warning' size='small' variant='tonal' />
          )
        }
      })
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      globalFilter
    },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
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
            <Button onClick={() => fetchUserData()} sx={{ ml: 2 }}>
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
              Memuat data user...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className='flex justify-between flex-col items-start md:items-center md:flex-row gap-4'>
          <div className='flex items-center gap-2'>
            <Typography variant='h5'>User Management</Typography>
          </div>
          <div className='flex max-sm:flex-col max-sm:is-full sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search User'
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
                    {loading ? 'Memuat data...' : 'No data available'}
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
                      <tr key={row.id}>
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
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
          onRowsPerPageChange={e => {
            table.setPageSize(Number(e.target.value))
          }}
        />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant='filled' sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Card>
    </>
  )
}

export default UserListTable
