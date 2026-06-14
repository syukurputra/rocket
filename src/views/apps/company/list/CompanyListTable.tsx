'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

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
import type { CompanyClient } from '@/src/types/apps/companyTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import AddEditCompanyDialog from './AddEditCompanyDialog'

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

type CompanyClientWithAction = CompanyClient & { action?: string }

const columnHelper = createColumnHelper<CompanyClientWithAction>()

const CompanyListTable = () => {
  const [data, setData] = useState<CompanyClientWithAction[]>([])
  const [filteredData, setFilteredData] = useState<CompanyClientWithAction[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedCompany, setSelectedCompany] = useState<CompanyClient | null>(null)
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

  const fetchCompanyData = async () => {
    try {
      setError(null)

      const result = await apiFetchClient<{
        data: CompanyClient[]
        message?: string
      }>('/api/company', undefined, {
        redirectOn401: '/login'
      })

      const companyData = result.data || []

      setData(companyData)
      setFilteredData(companyData)
      setTotalCount(companyData.length)
    } catch (err) {
      console.error('Failed to fetch company data:', err)

      if (err instanceof Error && !err.message.includes('Request failed (401)')) {
        setError(err.message)
      }
    }
  }

  useEffect(() => {
    fetchCompanyData()
  }, [])

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedCompany(null)
    setDialogOpen(true)
  }

  const handleEdit = (company: CompanyClient) => {
    setDialogMode('edit')
    setSelectedCompany(company)
    setDialogOpen(true)
  }

  const handleToggleStatus = async (company: CompanyClient) => {
    const action = company.status ? 'menonaktifkan' : 'mengaktifkan'
    if (!confirm(`Apakah Anda yakin ingin ${action} company ini?`)) return

    try {
      await apiFetchClient(`/api/company/${company.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: !company.status })
      })

      fetchCompanyData()
      showSnackbar(`Company berhasil ${company.status ? 'dinonaktifkan' : 'diaktifkan'}`, 'success')
    } catch (err) {
      console.error('Toggle status failed:', err)

      const errorMessage = err instanceof Error ? err.message : 'Failed to update company status'

      showSnackbar(errorMessage, 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus company ini?')) return

    try {
      await apiFetchClient(`/api/company/${id}`, {
        method: 'DELETE'
      })

      fetchCompanyData()
      showSnackbar('Company berhasil dihapus', 'success')
    } catch (err) {
      console.error('Delete failed:', err)

      const errorMessage = err instanceof Error ? err.message : 'Failed to delete company'

      showSnackbar(errorMessage, 'error')
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedCompany(null)
  }

  const handleDialogSuccess = () => {
    fetchCompanyData()
    showSnackbar(dialogMode === 'add' ? 'Company berhasil ditambahkan' : 'Company berhasil diupdate', 'success')
  }

  const columns = useMemo<ColumnDef<CompanyClientWithAction, any>[]>(
    () => [
      columnHelper.accessor('nama', {
        header: 'Nama Company',
        cell: ({ row }) => <Typography fontWeight={600}>{row.original.nama}</Typography>
      }),
      columnHelper.accessor('alamat', {
        header: 'Alamat',
        cell: ({ row }) => <Typography>{row.original.alamat || '-'}</Typography>
      }),
      columnHelper.accessor('telepon', {
        header: 'Telepon',
        cell: ({ row }) => <Typography>{row.original.telepon || '-'}</Typography>
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: ({ row }) => <Typography>{row.original.email || '-'}</Typography>
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
            <IconButton
              onClick={() => handleToggleStatus(row.original)}
              title={row.original.status ? 'Nonaktifkan' : 'Aktifkan'}
            >
              <i
                className={classnames(
                  'text-textSecondary',
                  row.original.status ? 'tabler-toggle-right' : 'tabler-toggle-left'
                )}
              />
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
            <Button onClick={() => fetchCompanyData()} sx={{ ml: 2 }}>
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
          title='Company Management'
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
                  placeholder='Cari company...'
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
          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleAdd}>
            Tambah Company
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
      <AddEditCompanyDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        companyData={selectedCompany}
        mode={dialogMode}
      />
    </>
  )
}

export default CompanyListTable
