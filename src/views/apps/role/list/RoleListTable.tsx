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
import type { RoleClient } from '@/src/types/apps/roleTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import AddEditRole from '@/src/components/dialogs/role'
import AssignMenuToRole from '@/src/components/dialogs/assign-menu-to-role'

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

type RoleClientWithAction = RoleClient & { action?: string }

const columnHelper = createColumnHelper<RoleClientWithAction>()

interface RoleListTableProps {
  apiEndpoint?: string
}

const RoleListTable = ({ apiEndpoint = '/api/role' }: RoleListTableProps) => {
  const [data, setData] = useState<RoleClientWithAction[]>([])
  const [filteredData, setFilteredData] = useState<RoleClientWithAction[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleClient | null>(null)
  const { snack: snackbar, showSnack: showSnackbar, closeSnack } = useSnackbar()

  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const filterOpen = Boolean(filterAnchor)
  const [pendingSearch, setPendingSearch] = useState('')

  const activeFilterCount = [pendingSearch].filter(Boolean).length

  const handleApplyFilter = () => {
    setFilterAnchor(null)
    setGlobalFilter(pendingSearch)
  }

  const handleResetFilter = () => {
    setFilterAnchor(null)
    setPendingSearch('')
    setGlobalFilter('')
  }

  const fetchRoleData = async () => {
    try {
      setError(null)

      const result = await apiFetchClient<{
        data: RoleClient[]
        message?: string
      }>(apiEndpoint, undefined, {
        redirectOn401: '/login'
      })

      const roleData = result.data || []

      setData(roleData)
      setFilteredData(roleData)
    } catch (err) {
      console.error('Failed to fetch role data:', err)

      if (err instanceof Error && !err.message.includes('Request failed (401)')) {
        setError(err.message)
      }
    }
  }

  useEffect(() => {
    fetchRoleData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus role ini?')) return

    try {
      await apiFetchClient(`/api/role/${id}`, {
        method: 'DELETE'
      })

      fetchRoleData()
      showSnackbar('Role berhasil dihapus', 'success')
    } catch (err) {
      console.error('Delete failed:', err)

      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role'

      showSnackbar(errorMessage, 'error')
    }
  }

  const handleEdit = (role: RoleClient) => {
    setSelectedRole(role)
    setDialogOpen(true)
  }

  const handleAssignMenu = (role: RoleClient) => {
    if (!role || !role.id) {
      showSnackbar('Role ID tidak valid', 'error')
      console.error('handleAssignMenu: Invalid role or role ID', role)

      return
    }

    setSelectedRole(role)
    setAssignDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedRole(null)
  }

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false)
    setSelectedRole(null)
  }

  const columns = useMemo<ColumnDef<RoleClientWithAction, any>[]>(
    () => [
      columnHelper.accessor('nama', {
        header: 'Nama Role',
        cell: ({ row }) => <Typography fontWeight={600}>{row.original.nama}</Typography>
      }),
      columnHelper.accessor('deskripsi', {
        header: 'Deskripsi',
        cell: ({ row }) => <Typography>{row.original.deskripsi || '-'}</Typography>
      }),
      columnHelper.accessor('companyId', {
        header: 'Company',
        cell: ({ row }) => <Typography>{row.original.company?.nama || '-'}</Typography>
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
          <div className='flex items-center gap-2'>
            <IconButton onClick={() => handleEdit(row.original)} title='Ubah'>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleAssignMenu(row.original)} title='Assign Menu'>
              <i className='tabler-menu-2 text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleDelete(row.original.id)} title='Delete'>
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
            <Button onClick={() => fetchRoleData()} sx={{ ml: 2 }}>
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
          title='Role Management'
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
                      placeholder='Cari role...'
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
        <CardContent className='flex items-end justify-end gap-4 flex-wrap'>
          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => setDialogOpen(true)}>
            Tambah Role
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
      <AddEditRole
        open={dialogOpen}
        setOpen={setDialogOpen}
        mode={selectedRole ? 'edit' : 'create'}
        initialData={selectedRole}
        onSaved={() => {
          fetchRoleData()
          handleCloseDialog()
        }}
      />
      <AssignMenuToRole
        open={assignDialogOpen}
        setOpen={setAssignDialogOpen}
        roleId={selectedRole?.id || null}
        roleName={selectedRole?.nama || ''}
        onSaved={() => {
          fetchRoleData()
          handleCloseAssignDialog()
        }}
      />
    </>
  )
}

export default RoleListTable
