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
import type { MenuClient } from '@/src/types/apps/menuTypes'
import type { RoleClient } from '@/src/types/apps/roleTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' }

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  role: RoleClient | null
}

type MenuPermission = {
  menuId: string
  menuNama: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export default function RoleMenuAssignment({ open, setOpen, role }: Props) {
  const [menus, setMenus] = useState<MenuClient[]>([])
  const [permissions, setPermissions] = useState<MenuPermission[]>([])
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
        // Fetch all menus
        const menusResult = await apiFetchClient<{ data: MenuClient[] }>('/api/menu')
        const allMenus = menusResult.data || []

        setMenus(allMenus)

        // Fetch current role with menu assignments
        const roleResult = await apiFetchClient<{ data: any }>(`/api/role/${role.id}`)
        const roleMenus = roleResult.data?.roleMenus || []

        // Create permissions map
        const permissionsMap = new Map()

        roleMenus.forEach((rm: any) => {
          permissionsMap.set(rm.menuId, {
            canCreate: rm.canCreate,
            canRead: rm.canRead,
            canUpdate: rm.canUpdate,
            canDelete: rm.canDelete
          })
        })

        // Initialize permissions for all menus
        const initialPermissions = allMenus.map(menu => ({
          menuId: menu.id,
          menuNama: menu.nama,
          canCreate: permissionsMap.get(menu.id)?.canCreate || false,
          canRead: permissionsMap.get(menu.id)?.canRead || false,
          canUpdate: permissionsMap.get(menu.id)?.canUpdate || false,
          canDelete: permissionsMap.get(menu.id)?.canDelete || false
        }))

        setPermissions(initialPermissions)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setSnack({ open: true, message: 'Gagal memuat data', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, role])

  const handlePermissionChange = (menuId: string, permission: keyof Omit<MenuPermission, 'menuId' | 'menuNama'>) => {
    setPermissions(prev => prev.map(p => (p.menuId === menuId ? { ...p, [permission]: !p[permission] } : p)))
  }

  const handleSelectAll = (permission: keyof Omit<MenuPermission, 'menuId' | 'menuNama'>) => {
    const allChecked = permissions.every(p => p[permission])

    setPermissions(prev => prev.map(p => ({ ...p, [permission]: !allChecked })))
  }

  const handleSubmit = async () => {
    if (!role) return

    setSaving(true)

    try {
      // Filter only menus with at least one permission
      const menusToAssign = permissions
        .filter(p => p.canCreate || p.canRead || p.canUpdate || p.canDelete)
        .map(p => ({
          menuId: p.menuId,
          canCreate: p.canCreate,
          canRead: p.canRead,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete
        }))

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
      <Dialog open={open} maxWidth='lg' fullWidth scroll='body'>
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
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Menu</TableCell>
                    <TableCell align='center'>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permissions.every(p => p.canCreate)}
                            onChange={() => handleSelectAll('canCreate')}
                          />
                        }
                        label='Create'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permissions.every(p => p.canRead)}
                            onChange={() => handleSelectAll('canRead')}
                          />
                        }
                        label='Read'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permissions.every(p => p.canUpdate)}
                            onChange={() => handleSelectAll('canUpdate')}
                          />
                        }
                        label='Update'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permissions.every(p => p.canDelete)}
                            onChange={() => handleSelectAll('canDelete')}
                          />
                        }
                        label='Delete'
                      />
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map(perm => (
                    <TableRow key={perm.menuId} hover>
                      <TableCell>{perm.menuNama}</TableCell>
                      <TableCell align='center'>
                        <Checkbox
                          checked={perm.canCreate}
                          onChange={() => handlePermissionChange(perm.menuId, 'canCreate')}
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <Checkbox
                          checked={perm.canRead}
                          onChange={() => handlePermissionChange(perm.menuId, 'canRead')}
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <Checkbox
                          checked={perm.canUpdate}
                          onChange={() => handlePermissionChange(perm.menuId, 'canUpdate')}
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <Checkbox
                          checked={perm.canDelete}
                          onChange={() => handlePermissionChange(perm.menuId, 'canDelete')}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
