'use client'

import { useState, useEffect, useMemo } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { ButtonProps } from '@mui/material/Button'

import type { MasterPaketClient } from '@/src/types/apps/paketTypes'
import AddEditPaket from '@components/dialogs/master/paket'
import PaketMenuAssignment from '@components/dialogs/paket/PaketMenuAssignment'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import tableStyles from '@core/styles/table.module.css'

type PaketWithAction = MasterPaketClient & {
  action?: string
}

const columnHelper = createColumnHelper<PaketWithAction>()

const MasterPaketListTable = () => {
  const [data, setData] = useState<MasterPaketClient[]>([])
  const [loading, setLoading] = useState(true)
  const [menuDialogOpen, setMenuDialogOpen] = useState(false)
  const [selectedPaket, setSelectedPaket] = useState<MasterPaketClient | null>(null)
  const { snack, showSnack: showSnackbar, closeSnack } = useSnackbar()

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await apiFetchClient<{ data: MasterPaketClient[] }>('/api/master/paket')

      setData(response.data || [])
    } catch (error) {
      console.error('Failed to fetch pakets:', error)
      showSnackbar('Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num)
  }

  const columns = useMemo<ColumnDef<PaketWithAction, any>[]>(
    () => [
      columnHelper.display({
        id: 'icon',
        header: 'Icon',
        cell: ({ row }) => (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--mui-palette-action-hover)'
            }}
          >
            {row.original.iconUrl ? (
              <img
                src={row.original.iconUrl}
                alt={row.original.nama}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
              />
            ) : (
              <i className='tabler-package text-xl' style={{ opacity: 0.4 }} />
            )}
          </div>
        ),
        enableSorting: false
      }),
      columnHelper.accessor('nama', {
        header: 'Nama Paket',
        cell: ({ row }) => <Typography fontWeight={600}>{row.original.nama}</Typography>
      }),
      columnHelper.accessor('urutan', {
        header: 'Urutan',
        cell: ({ row }) => <Typography>{row.original.urutan}</Typography>
      }),
      columnHelper.accessor('deskripsi', {
        header: 'Deskripsi',
        cell: ({ row }) => <Typography variant='body2'>{row.original.deskripsi || '-'}</Typography>
      }),
      columnHelper.accessor('hargaBulanan', {
        header: 'Harga Bulanan',
        cell: ({ row }) => <Typography>{formatCurrency(row.original.hargaBulanan)}</Typography>
      }),
      columnHelper.accessor('hargaTahunan', {
        header: 'Harga Tahunan',
        cell: ({ row }) => <Typography>{formatCurrency(row.original.hargaTahunan)}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) =>
          row.original.status ? (
            <Chip label='Aktif' color='success' size='small' variant='tonal' />
          ) : (
            <Chip label='Nonaktif' color='error' size='small' variant='tonal' />
          )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton
              onClick={() => {
                setSelectedPaket(row.original)
                setMenuDialogOpen(true)
              }}
              title='Assign Menu'
            >
              <i className='tabler-list-check text-textSecondary' />
            </IconButton>
            <OpenDialogOnElementClick
              element={IconButton}
              elementProps={{
                className: 'flex',
                'aria-label': 'Ubah',
                children: <i className='tabler-edit text-textSecondary' />
              }}
              dialog={AddEditPaket}
              dialogProps={{
                mode: 'edit',
                initialData: row.original,
                onSaved: () => {
                  fetchData()
                  showSnackbar('Paket berhasil diperbarui', 'success')
                }
              }}
            />
            <IconButton
              onClick={async () => {
                if (!confirm('Apakah Anda yakin ingin menghapus paket ini?')) return

                try {
                  await apiFetchClient(`/api/master/paket/${row.original.id}`, {
                    method: 'DELETE'
                  })

                  fetchData()
                  showSnackbar('Paket berhasil dihapus', 'success')
                } catch (err) {
                  console.error('Delete failed:', err)
                  const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus paket'

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
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    filterFns: {
      fuzzy: () => true
    }
  })

  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Tambah'
  }

  return (
    <Card>
      <CardContent className='flex justify-between flex-wrap gap-4'>
        <Typography variant='h5'>Master Paket</Typography>
        <div className='flex gap-4'>
          <OpenDialogOnElementClick
            element={Button}
            elementProps={buttonProps}
            dialog={AddEditPaket}
            dialogProps={{
              mode: 'create',
              onSaved: () => {
                fetchData()
                showSnackbar('Paket berhasil ditambahkan', 'success')
              }
            }}
          />
        </div>
      </CardContent>

      {loading ? (
        <div className='flex justify-center items-center p-10'>
          <CircularProgress />
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <AppSnackbar snack={snack} onClose={closeSnack} />
      <PaketMenuAssignment
        open={menuDialogOpen}
        setOpen={setMenuDialogOpen}
        paket={selectedPaket}
        onSaved={() => {
          showSnackbar('Menu berhasil di-assign', 'success')
        }}
      />
    </Card>
  )
}

export default MasterPaketListTable


