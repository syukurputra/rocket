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
import AddEditUserDialog from './AddEditUserDialog'

// Util Imports
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
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
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'invite'>('add')
  const [selectedUser, setSelectedUser] = useState<UserClient | null>(null)

  const { snack: snackbar, showSnack: showSnackbar, closeSnack } = useSnackbar()

  const fetchUserData = async () => {
    try {
      setError(null)

      const result = await apiFetchClient<{
        data: UserClient[]
        message?: string
      }>('/api/user', undefined, {
        redirectOn401: '/login'
      })

      const userData = result.data || []

      setData(userData)
      setFilteredData(userData)
    } catch (err) {
      console.error('Failed to fetch user data:', err)

      if (err instanceof Error && !err.message.includes('Request failed (401)')) {
        setError(err.message)
      }
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const handleEdit = (user: UserClient) => {
    setDialogMode('edit')
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleInvite = () => {
    setDialogMode('invite')
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const handleToggleStatus = async (user: UserClient) => {
    const action = user.status ? 'menonaktifkan' : 'mengaktifkan'

    if (!confirm(`Apakah Anda yakin ingin ${action} user ini?`)) return

    try {
      await apiFetchClient(`/api/user/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: !user.status })
      })

      fetchUserData()
      showSnackbar(`User berhasil ${user.status ? 'dinonaktifkan' : 'diaktifkan'}`, 'success')
    } catch (err) {
      console.error('Toggle status failed:', err)

      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status'

      showSnackbar(errorMessage, 'error')
    }
  }

  const handleDelete = async (user: UserClient) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return

    try {
      await apiFetchClient(`/api/user/${user.id}`, {
        method: 'DELETE'
      })

      fetchUserData()
      showSnackbar('User berhasil dihapus', 'success')
    } catch (err) {
      console.error('Delete failed:', err)

      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'

      showSnackbar(errorMessage, 'error')
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedUser(null)
  }

  const handleDialogSuccess = () => {
    fetchUserData()
    const message =
      dialogMode === 'add'
        ? 'User berhasil ditambahkan'
        : dialogMode === 'invite'
          ? 'Undangan berhasil dikirim'
          : 'User berhasil diupdate'

    showSnackbar(message, 'success')
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
      columnHelper.accessor('role.nama', {
        header: 'Role',
        cell: ({ row }) => <Typography>{row.original.role?.nama || '-'}</Typography>
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
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          return row.original.status ? (
            <Chip label='Active' color='success' size='small' variant='tonal' />
          ) : (
            <Chip label='Inactive' color='error' size='small' variant='tonal' />
          )
        }
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton onClick={() => handleEdit(row.original)} title='Edit'>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton
              onClick={() => handleToggleStatus(row.original)}
              title={row.original.status ? 'Nonaktifkan User' : 'Aktifkan User'}
            >
              <i
                className={classnames(
                  'text-textSecondary',
                  row.original.status ? 'tabler-toggle-right' : 'tabler-toggle-left'
                )}
              />
            </IconButton>
            <IconButton onClick={() => handleDelete(row.original)} title='Delete'>
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
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
            <Button variant='contained' startIcon={<i className='tabler-mail' />} onClick={handleInvite}>
              Undang User
            </Button>
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
        <AppSnackbar snack={snackbar} onClose={closeSnack} />
      </Card>
      <AddEditUserDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        userData={selectedUser}
        mode={dialogMode}
      />
    </>
  )
}

export default UserListTable
