'use client'

import { useState, useEffect, useMemo } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import type { TextFieldProps } from '@mui/material/TextField'

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

type JenisAset = {
  id: string
  nama: string
  status: boolean
  createdAt: string
  updatedAt: string
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

  useEffect(() => { setValue(initialValue) }, [initialValue])
  useEffect(() => {
    const timeout = setTimeout(() => onChange(value), debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const EMPTY_FORM = { id: '', nama: '', status: true }
const columnHelper = createColumnHelper<JenisAset>()

const JenisAsetListTable = () => {
  const [data, setData] = useState<JenisAset[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [dialog, setDialog] = useState<{ open: boolean; mode: 'create' | 'edit' }>({ open: false, mode: 'create' })
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: JenisAset | null }>({ open: false, item: null })
  const [deleting, setDeleting] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  const fetchData = async () => {
    try {
      const result = await apiFetchClient<{ data: JenisAset[] }>('/api/master/jenis-aset', undefined, {
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
    setDialog({ open: true, mode: 'create' })
  }

  const handleOpenEdit = (item: JenisAset) => {
    setForm({ id: item.id, nama: item.nama, status: item.status })
    setDialog({ open: true, mode: 'edit' })
  }

  const handleSave = async () => {
    if (!form.nama.trim()) { showSnack('Nama harus diisi', 'error'); return }
    setSaving(true)
    try {
      if (dialog.mode === 'create') {
        await apiFetchClient('/api/master/jenis-aset', {
          method: 'POST',
          body: JSON.stringify({ nama: form.nama, status: form.status })
        })
        showSnack('Jenis aset berhasil ditambahkan')
      } else {
        await apiFetchClient(`/api/master/jenis-aset/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nama: form.nama, status: form.status })
        })
        showSnack('Jenis aset berhasil diupdate')
      }
      setDialog({ open: false, mode: 'create' })
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
      await apiFetchClient(`/api/master/jenis-aset/${deleteDialog.item.id}`, { method: 'DELETE' })
      showSnack('Jenis aset berhasil dihapus')
      setDeleteDialog({ open: false, item: null })
      fetchData()
    } catch {
      showSnack('Gagal menghapus data', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<JenisAset, any>[]>(
    () => [
      columnHelper.accessor('nama', {
        header: 'Nama Jenis Aset',
        cell: ({ row }) => <Typography fontWeight={600}>{row.original.nama}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={row.original.status ? 'Aktif' : 'Non Aktif'}
            color={row.original.status ? 'success' : 'error'}
            size='small'
            variant='tonal'
          />
        )
      }),
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }: any) => (
          <div className='flex items-center gap-1'>
            <Tooltip title='Edit'>
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
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card>
      <CardHeader title='Master Jenis Aset' />
      <Divider />
      <CardContent className='flex justify-between items-center flex-wrap gap-4'>
        <DebouncedInput
          value={globalFilter}
          onChange={val => setGlobalFilter(String(val))}
          placeholder='Cari jenis aset...'
          className='sm:is-[250px]'
        />
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
              <tr><td colSpan={columns.length} className='text-center'>Tidak ada data</td></tr>
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
      <Dialog open={dialog.open} onClose={() => !saving && setDialog({ open: false, mode: 'create' })} maxWidth='xs' fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Tambah Jenis Aset' : 'Edit Jenis Aset'}</DialogTitle>
        <DialogContent>
          <div className='flex flex-col gap-4 mt-2'>
            <TextField
              fullWidth
              label='Nama Jenis Aset'
              value={form.nama}
              onChange={e => setForm(prev => ({ ...prev, nama: e.target.value }))}
              placeholder='Contoh: Rumah, Apartemen, Kantor'
              autoFocus
            />
            <FormControlLabel
              control={<Switch checked={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.checked }))} />}
              label='Status Aktif'
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, mode: 'create' })} disabled={saving}>Batal</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || !form.nama.trim()}>
            {saving ? <CircularProgress size={18} color='inherit' /> : dialog.mode === 'create' ? 'Tambah' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => !deleting && setDeleteDialog({ open: false, item: null })} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Jenis Aset</DialogTitle>
        <DialogContent>
          <Typography>Hapus <strong>{deleteDialog.item?.nama}</strong>? Tindakan ini tidak dapat diurungkan.</Typography>
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

export default JenisAsetListTable
