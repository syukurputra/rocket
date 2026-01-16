'use client'

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import type { MasterPaketClient } from '@/src/types/apps/paketTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  paket: MasterPaketClient | null
  onSaved?: () => void
}

type MenuWithStatus = {
  id: string
  nama: string
  path: string | null
  icon: string | null
  isAssigned: boolean
}

export default function PaketMenuAssignment({ open, setOpen, paket, onSaved }: Props) {
  const [menus, setMenus] = useState<MenuWithStatus[]>([])
  const [selectedMenuIds, setSelectedMenuIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
  }

  // Fetch menus and current paket-menu assignments
  useEffect(() => {
    if (!open || !paket) return

    const fetchData = async () => {
      setLoading(true)

      try {
        const result = await apiFetchClient<{ data: { paket: any; menus: MenuWithStatus[] } }>(
          `/api/master/paket/${paket.id}/menu`
        )

        const fetchedMenus = result.data?.menus || []

        setMenus(fetchedMenus)

        // Set initially selected menu IDs
        const initiallySelected = new Set(fetchedMenus.filter(m => m.isAssigned).map(m => m.id))

        setSelectedMenuIds(initiallySelected)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setSnack({ open: true, message: 'Gagal memuat data', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, paket])

  const handleToggleMenu = (menuId: string) => {
    setSelectedMenuIds(prev => {
      const newSet = new Set(prev)

      if (newSet.has(menuId)) {
        newSet.delete(menuId)
      } else {
        newSet.add(menuId)
      }

      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedMenuIds.size === menus.length) {
      // Deselect all
      setSelectedMenuIds(new Set())
    } else {
      // Select all
      setSelectedMenuIds(new Set(menus.map(m => m.id)))
    }
  }

  const handleSubmit = async () => {
    if (!paket) return

    setSaving(true)

    try {
      await apiFetchClient(`/api/master/paket/${paket.id}/menu`, {
        method: 'PUT',
        body: JSON.stringify({ menuIds: Array.from(selectedMenuIds) })
      })

      setSnack({ open: true, message: 'Menu berhasil di-assign ke paket', severity: 'success' })
      setTimeout(() => {
        setOpen(false)
        onSaved?.()
      }, 1500)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'

      setSnack({ open: true, message: msg, severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} maxWidth='md' fullWidth scroll='body'>
        <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          Assign Menu ke Paket: {paket?.nama}
        </DialogTitle>
        <DialogContent className='pbs-0 sm:pli-16'>
          <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>

          {loading ? (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box mb={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedMenuIds.size === menus.length && menus.length > 0}
                      indeterminate={selectedMenuIds.size > 0 && selectedMenuIds.size < menus.length}
                      onChange={handleSelectAll}
                    />
                  }
                  label='Pilih Semua'
                />
              </Box>
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell width='50px'>Pilih</TableCell>
                      <TableCell>Nama Menu</TableCell>
                      <TableCell>Icon</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {menus.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align='center'>
                          Tidak ada menu tersedia
                        </TableCell>
                      </TableRow>
                    ) : (
                      menus.map(menu => (
                        <TableRow key={menu.id} hover>
                          <TableCell>
                            <Checkbox
                              checked={selectedMenuIds.has(menu.id)}
                              onChange={() => handleToggleMenu(menu.id)}
                            />
                          </TableCell>
                          <TableCell>{menu.nama}</TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              {menu.icon && <i className={menu.icon} />}
                              <span className='text-sm'>{menu.icon || '-'}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='text' onClick={() => setOpen(false)} disabled={saving || loading}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleSubmit} disabled={saving || loading}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: theme => theme.zIndex.snackbar + 1 }}
      >
        <Alert onClose={handleSnackClose} severity={snack.severity} variant='filled' sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  )
}
