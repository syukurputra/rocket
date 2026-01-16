'use client'

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import type { MenuClient } from '@/src/types/apps/menuTypes'
import type { RoleClient } from '@/src/types/apps/roleTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  role: RoleClient | null
}

type MenuAssignment = {
  id: string
  nama: string
  assigned: boolean
}

export default function RoleMenuAssignment({ open, setOpen, role }: Props) {
  const [menus, setMenus] = useState<MenuAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' })

  const handleSnackClose = () => {
    setSnack(prev => ({ ...prev, open: false }))
  }

  // Fetch menus and current role-menu assignments
  useEffect(() => {
    if (!open || !role) return

    const fetchData = async () => {
      setLoading(true)

      try {
        // Fetch menus filtered by company paket with current role assignments
        const menusResult = await apiFetchClient<{ data: any[] }>(`/api/role/${role.id}/menus`)
        const menusData = menusResult.data || []

        // Initialize menu assignments
        const menuAssignments = menusData.map((m: any) => ({
          id: m.id,
          nama: m.nama,
          assigned: m.assigned || false
        }))

        setMenus(menuAssignments)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setSnack({ open: true, message: 'Gagal memuat data', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, role])

  const handleToggleMenu = (menuId: string) => {
    setMenus(prev => prev.map(m => (m.id === menuId ? { ...m, assigned: !m.assigned } : m)))
  }

  const handleSelectAll = () => {
    const allAssigned = menus.every(m => m.assigned)

    setMenus(prev => prev.map(m => ({ ...m, assigned: !allAssigned })))
  }

  const handleSubmit = async () => {
    if (!role) return

    setSaving(true)

    try {
      // Filter only assigned menus
      const menusToAssign = menus.filter(m => m.assigned).map(m => ({ menuId: m.id }))

      await apiFetchClient(`/api/role/${role.id}/menu`, {
        method: 'PUT',
        body: JSON.stringify({ menus: menusToAssign })
      })

      setSnack({ open: true, message: 'Menu berhasil di-assign ke role', severity: 'success' })
      setTimeout(() => {
        setOpen(false)
        window.location.reload()
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
          Assign Menu ke Role: {role?.nama}
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
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox checked={menus.every(m => m.assigned)} onChange={handleSelectAll} color='primary' />
                  }
                  label='Pilih Semua'
                />
              </Box>
              <List>
                {menus.map(menu => (
                  <ListItem key={menu.id} dense>
                    <FormControlLabel
                      control={
                        <Checkbox checked={menu.assigned} onChange={() => handleToggleMenu(menu.id)} color='primary' />
                      }
                      label={menu.nama}
                    />
                  </ListItem>
                ))}
              </List>
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
