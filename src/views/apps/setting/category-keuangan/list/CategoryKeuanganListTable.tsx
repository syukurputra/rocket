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
import { styled } from '@mui/material/styles'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { ButtonProps } from '@mui/material/Button'

import type { CategoryKeuanganClient } from '@/src/types/apps/categoryKeuanganTypes'
import AddEditCategoryKeuangan from '@components/dialogs/setting/category-keuangan'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import ConfirmDialog, { useConfirm } from '@/src/components/ConfirmDialog'
import tableStyles from '@core/styles/table.module.css'

type CategoryKeuanganWithAction = CategoryKeuanganClient & {
  action?: string
}

const columnHelper = createColumnHelper<CategoryKeuanganWithAction>()
const Icon = styled('i')({})

const CategoryKeuanganListTable = () => {
  const [data, setData] = useState<CategoryKeuanganClient[]>([])
  const { snack: snackbar, showSnack: showSnackbar, closeSnack } = useSnackbar()
  const { confirm, confirmProps } = useConfirm()

  const fetchData = async () => {
    try {
      const response = await apiFetchClient<{ data: CategoryKeuanganClient[] }>('/api/setting/category-keuangan')

      setData(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      showSnackbar('Gagal memuat data', 'error')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const columns = useMemo<ColumnDef<CategoryKeuanganWithAction, any>[]>(
    () => [
      {
        id: 'icon',
        header: 'Icon',
        cell: ({ row }) => {
          if (!row.original.icon) return <Typography variant='caption'>-</Typography>

          return (
            <div className='flex items-center justify-center'>
              <Icon className={row.original.icon.code} sx={{ fontSize: '2rem' }} />
            </div>
          )
        }
      },
      columnHelper.accessor('nama', {
        header: 'Nama Category',
        cell: ({ row }) => <Typography fontWeight={600}>{row.original.nama}</Typography>
      }),
      columnHelper.accessor('deskripsi', {
        header: 'Deskripsi',
        cell: ({ row }) => <Typography variant='body2'>{row.original.deskripsi || '-'}</Typography>
      }),
      {
        id: 'color',
        header: 'Color',
        cell: ({ row }) => {
          if (!row.original.color) return <Typography variant='caption'>-</Typography>

          return (
            <div className='flex items-center gap-2'>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: row.original.color,
                  border: '1px solid #ddd'
                }}
              />
              <Typography variant='caption' className='font-mono'>
                {row.original.color}
              </Typography>
            </div>
          )
        }
      },
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
            <OpenDialogOnElementClick
              element={IconButton}
              elementProps={{
                className: 'flex',
                'aria-label': 'Ubah',
                children: <i className='tabler-edit text-textSecondary' />
              }}
              dialog={AddEditCategoryKeuangan}
              dialogProps={{
                mode: 'edit',
                initialData: row.original,
                onSaved: () => {
                  fetchData()
                  showSnackbar('Category berhasil diperbarui', 'success')
                }
              }}
            />
            <IconButton
              onClick={async () => {
                const setuju = await confirm({
                  title: 'Hapus Kategori',
                  message: 'Apakah Anda yakin ingin menghapus kategori ini?'
                })

                if (!setuju) return

                try {
                  await apiFetchClient(`/api/setting/category-keuangan/${row.original.id}`, {
                    method: 'DELETE'
                  })

                  fetchData()
                  showSnackbar('Category berhasil dihapus', 'success')
                } catch (err) {
                  console.error('Delete failed:', err)
                  const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus category'

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
        <Typography variant='h5'>Category Keuangan</Typography>
        <div className='flex gap-4'>
          <OpenDialogOnElementClick
            element={Button}
            elementProps={buttonProps}
            dialog={AddEditCategoryKeuangan}
            dialogProps={{
              mode: 'create',
              onSaved: () => {
                fetchData()
                showSnackbar('Category berhasil ditambahkan', 'success')
              }
            }}
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

      <AppSnackbar snack={snackbar} onClose={closeSnack} />
      <ConfirmDialog {...confirmProps} />
    </Card>
  )
}

export default CategoryKeuanganListTable
