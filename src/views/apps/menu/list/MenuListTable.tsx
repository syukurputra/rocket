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
import Badge from '@mui/material/Badge'
import Collapse from '@mui/material/Collapse'
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
import type { MenuClient } from '@/src/types/apps/menuTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import AddEditMenu from '@/src/components/dialogs/menu'

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

type MenuClientWithAction = MenuClient & { action?: string }

const columnHelper = createColumnHelper<MenuClientWithAction>()

const MenuListTable = () => {
  const [data, setData] = useState<MenuClientWithAction[]>([])
  const [filteredData, setFilteredData] = useState<MenuClientWithAction[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState<MenuClient | null>(null)

  const { snack, showSnack: showSnackbar, closeSnack } = useSnackbar()

  const [filterOpen, setFilterOpen] = useState(false)
  const [pendingSearch, setPendingSearch] = useState('')

  const activeFilterCount = [pendingSearch].filter(Boolean).length

  const handleApplyFilter = () => {
    setGlobalFilter(pendingSearch)
  }

  const handleResetFilter = () => {
    setPendingSearch('')
    setGlobalFilter('')
  }

  const fetchMenuData = async () => {
    try {
      setError(null)

      const result = await apiFetchClient<{
        data: MenuClient[]
        message?: string
      }>('/api/menu', undefined, {
        redirectOn401: '/login'
      })

      const menuData = result.data || []

      setData(menuData)
      setFilteredData(menuData)
    } catch (err) {
      console.error('Failed to fetch menu data:', err)

      if (err instanceof Error && !err.message.includes('Request failed (401)')) {
        setError(err.message)
      }
    }
  }

  useEffect(() => {
    fetchMenuData()
  }, [])

  const handleEdit = (menu: MenuClient) => {
    setSelectedMenu(menu)
    setDialogOpen(true)
  }

  const handleDelete = async (menu: MenuClient) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${menu.nama}"?`)) {
      return
    }

    try {
      await apiFetchClient(
        `/api/menu/${menu.id}`,
        {
          method: 'DELETE'
        },
        {
          redirectOn401: '/login'
        }
      )

      showSnackbar('Menu berhasil dihapus', 'success')
      fetchMenuData()
    } catch (err) {
      console.error('Failed to delete menu:', err)

      if (err instanceof Error) {
        showSnackbar(err.message || 'Gagal menghapus menu', 'error')
      } else {
        showSnackbar('Gagal menghapus menu', 'error')
      }
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedMenu(null)
  }

  const columns = useMemo<ColumnDef<MenuClientWithAction, any>[]>(
    () => [
      columnHelper.accessor('nama', {
        header: 'Nama Menu',
        cell: ({ row }) => <Typography fontWeight={600}>{row.original.nama}</Typography>
      }),
      columnHelper.accessor('keterangan', {
        header: 'Keterangan',
        cell: ({ row }) => <Typography>{row.original.keterangan || '-'}</Typography>
      }),
      columnHelper.accessor('path', {
        header: 'Path',
        cell: ({ row }) => <Typography className='font-mono text-sm'>{row.original.path || '-'}</Typography>
      }),
      columnHelper.accessor('icon', {
        header: 'Icon',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            {row.original.icon && <i className={row.original.icon} />}
            <Typography className='text-sm'>{row.original.icon || '-'}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('urutan', {
        header: 'Urutan',
        cell: ({ row }) => <Typography>{row.original.urutan}</Typography>
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
            <IconButton onClick={() => handleDelete(row.original)} title='Delete' color='error'>
              <i className='tabler-trash text-error' />
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
            <Button onClick={() => fetchMenuData()} sx={{ ml: 2 }}>
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
          title='Menu Management'
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
                  placeholder='Cari menu...'
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
        <CardContent className='flex items-end justify-end gap-4 flex-wrap'>
          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => setDialogOpen(true)}>
            Tambah Menu
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
        <AppSnackbar snack={snack} onClose={closeSnack} />
      </Card>
      <AddEditMenu
        open={dialogOpen}
        setOpen={setDialogOpen}
        mode={selectedMenu ? 'edit' : 'create'}
        initialData={selectedMenu}
        onSaved={() => {
          fetchMenuData()
          handleCloseDialog()
        }}
      />
    </>
  )
}

export default MenuListTable
