'use client'

import { useState, useEffect, useMemo } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Popover from '@mui/material/Popover'
import Grid from '@mui/material/Grid2'

import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Parameter = {
  id: string
  nama: string
  value: string
  createdAt: string
  updatedAt: string
}

const EMPTY_FORM = { id: '', nama: '', value: '' }

const toParamId = (str: string) =>
  str.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')
const columnHelper = createColumnHelper<Parameter>()

const ParameterListTable = () => {
  const [data, setData] = useState<Parameter[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [dialog, setDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; originalId: string }>({ open: false, mode: 'create', originalId: '' })
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Parameter | null }>({ open: false, item: null })
  const [deleting, setDeleting] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

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

  const fetchData = async () => {
    try {
      const result = await apiFetchClient<{ data: Parameter[] }>('/api/master/parameter', undefined, {
        redirectOn401: '/login'
      })

      setData(result.data || [])
    } catch {
      showSnack('Gagal memuat data', 'error')
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM)
    setDialog({ open: true, mode: 'create', originalId: '' })
  }

  const handleOpenEdit = (item: Parameter) => {
    setForm({ id: item.id, nama: item.nama, value: item.value })
    setDialog({ open: true, mode: 'edit', originalId: item.id })
  }

  const handleSave = async () => {
    if (!form.id.trim()) { showSnack('ID harus diisi', 'error'); return }
    if (!form.nama.trim()) { showSnack('Nama harus diisi', 'error'); return }
    if (!form.value.trim()) { showSnack('Value harus diisi', 'error'); return }
    setSaving(true)
    try {
      if (dialog.mode === 'create') {
        await apiFetchClient('/api/master/parameter', {
          method: 'POST',
          body: JSON.stringify({ id: form.id, nama: form.nama, value: form.value })
        })
        showSnack('Parameter berhasil ditambahkan')
      } else {
        await apiFetchClient(`/api/master/parameter/${dialog.originalId}`, {
          method: 'PUT',
          body: JSON.stringify({ id: form.id, nama: form.nama, value: form.value })
        })
        showSnack('Parameter berhasil diupdate')
      }
      setDialog({ open: false, mode: 'create', originalId: '' })
      fetchData()
    } catch {
      showSnack('Gagal menyimpan data', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.item) return
    setDeleting(true)
    try {
      await apiFetchClient(`/api/master/parameter/${deleteDialog.item.id}`, { method: 'DELETE' })
      showSnack('Parameter berhasil dihapus')
      setDeleteDialog({ open: false, item: null })
      fetchData()
    } catch {
      showSnack('Gagal menghapus data', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<Parameter, any>[]>(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ row }) => (
          <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} color='text.secondary'>
            {row.original.id}
          </Typography>
        )
      }),
      columnHelper.accessor('nama', {
        header: 'Nama',
        cell: ({ row }) => <Typography fontWeight={600}>{row.original.nama}</Typography>
      }),
      columnHelper.accessor('value', {
        header: 'Value',
        cell: ({ row }) => (
          <Typography
            variant='body2'
            sx={{
              fontFamily: 'monospace',
              bgcolor: 'action.hover',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              display: 'inline-block',
              maxWidth: 300,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {row.original.value}
          </Typography>
        )
      }),
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }: any) => (
          <div className='flex items-center gap-1'>
            <Tooltip title='Ubah'>
              <IconButton onClick={() => handleOpenEdit(row.original)}>
                <i className='tabler-edit text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Hapus'>
              <IconButton color='error' onClick={() => setDeleteDialog({ open: true, item: row.original })}>
                <i className='tabler-trash' />
              </IconButton>
            </Tooltip>
          </div>
        )
      }
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: () => true },
    state: { globalFilter },
    globalFilterFn: (row, _colId, filterValue) => {
      const search = filterValue.toLowerCase()

      return (
        row.original.nama.toLowerCase().includes(search) ||
        row.original.value.toLowerCase().includes(search) ||
        row.original.id.toLowerCase().includes(search)
      )
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card>
      <CardHeader
        title='Master Parameter'
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
                borderRadius: 1, px: 2, py: 0.75,
                color: activeFilterCount > 0 ? 'primary.main' : 'text.secondary',
                bgcolor: 'transparent', fontWeight: 400, fontSize: '0.875rem', textTransform: 'none', gap: 1,
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
                    autoFocus fullWidth label='Cari' placeholder='Cari nama atau value...'
                    value={pendingSearch}
                    onChange={e => setPendingSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleApplyFilter() }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }} className='flex justify-end gap-2'>
                  <Button size='small' variant='outlined' color='secondary' onClick={() => setFilterAnchor(null)}>Tutup</Button>
                  <Button size='small' variant='contained' onClick={handleApplyFilter}>Terapkan</Button>
                </Grid>
              </Grid>
            </Popover>
          </Box>
        }
      />
      <Divider />
      <CardContent className='flex justify-end items-end flex-wrap gap-4'>
        <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleOpenCreate}>
          Tambah
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
                        {{ asc: <i className='tabler-chevron-up text-xl' />, desc: <i className='tabler-chevron-down text-xl' /> }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          {table.getFilteredRowModel().rows.length === 0 ? (
            <tbody>
              <tr><td colSpan={columns.length} className='text-center'>Tidak ada data parameter</td></tr>
            </tbody>
          ) : (
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      <TablePagination
        component='div'
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => table.setPageIndex(page)}
        onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onClose={() => !saving && setDialog({ open: false, mode: 'create', originalId: '' })} maxWidth='sm' fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Tambah Parameter' : 'Ubah Parameter'}</DialogTitle>
        <DialogContent>
          <div className='flex flex-col gap-4 mt-2'>
            <TextField
              fullWidth label='ID'
              value={form.id}
              onChange={e => setForm(prev => ({ ...prev, id: toParamId(e.target.value) }))}
              placeholder='Contoh: COMPANY_SUPER, MAX_UPLOAD_SIZE'
              autoFocus
              slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
              helperText='Otomatis diformat ke HURUF_BESAR_UNDERSCORE.'
            />
            <TextField
              fullWidth label='Nama'
              value={form.nama}
              onChange={e => setForm(prev => ({ ...prev, nama: e.target.value }))}
              placeholder='Contoh: Company Super Admin'
              autoFocus={dialog.mode === 'edit'}
            />
            <TextField
              fullWidth label='Value'
              value={form.value}
              onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
              placeholder='Contoh: company-demo-001'
              multiline
              minRows={2}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, mode: 'create', originalId: '' })} disabled={saving}>Batal</Button>
          <Button
            variant='contained' onClick={handleSave}
            disabled={saving || !form.id.trim() || !form.nama.trim() || !form.value.trim()}
          >
            {saving ? <CircularProgress size={18} color='inherit' /> : dialog.mode === 'create' ? 'Tambah' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => !deleting && setDeleteDialog({ open: false, item: null })} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Parameter</DialogTitle>
        <DialogContent>
          <Typography>
            Hapus parameter <strong>{deleteDialog.item?.nama}</strong>? Tindakan ini tidak dapat diurungkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })} disabled={deleting}>Batal</Button>
          <Button variant='contained' color='error' onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color='inherit' /> : null}>
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </Card>
  )
}

export default ParameterListTable
