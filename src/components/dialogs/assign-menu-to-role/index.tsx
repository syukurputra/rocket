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
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import type { MenuClient } from '@/src/types/apps/menuTypes'

type MenuAssignment = {
  menuId: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  roleId: string | null
  roleName: string
  onSaved?: () => void
}

export default function AssignMenuToRole({ open, setOpen, roleId, roleName, onSaved }: Props) {
  const [menus, setMenus] = useState<MenuClient[]>([])
  const [assignments, setAssignments] = useState<Map<string, MenuAssignment>>(new Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    if (!open || !roleId) return

    const fetchData = async () => {
      setLoading(true)

      try {
        // Fetch all menus
        const menusResult = await apiFetchClient<{ data: MenuClient[] }>('/api/menu')

        setMenus(menusResult.data || [])

        // Fetch role with existing assignments
        const roleResult = await apiFetchClient<{
          data: {
            roleMenus: Array<{
              menuId: string
              canCreate: boolean
              canRead: boolean
              canUpdate: boolean
              canDelete: boolean
            }>
          }
        }>(`/api/role/${roleId}`)

        // Build assignments map
        const assignmentsMap = new Map<string, MenuAssignment>()

        roleResult.data.roleMenus.forEach(rm => {
          assignmentsMap.set(rm.menuId, {
            menuId: rm.menuId,
            canCreate: rm.canCreate,
            canRead: rm.canRead,
            canUpdate: rm.canUpdate,
            canDelete: rm.canDelete
          })
        })

        setAssignments(assignmentsMap)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setSnack({ open: true, message: 'Failed to load data', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, roleId])

  const handleToggleMenu = (menuId: string) => {
    const newAssignments = new Map(assignments)

    if (newAssignments.has(menuId)) {
      newAssignments.delete(menuId)
    } else {
      newAssignments.set(menuId, {
        menuId,
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false
      })
    }

    setAssignments(newAssignments)
  }

  const handleTogglePermission = (menuId: string, permission: keyof Omit<MenuAssignment, 'menuId'>) => {
    const assignment = assignments.get(menuId)

    if (!assignment) return

    const newAssignments = new Map(assignments)

    newAssignments.set(menuId, {
      ...assignment,
      [permission]: !assignment[permission]
    })

    setAssignments(newAssignments)
  }

  const handleSave = async () => {
    if (!roleId) return

    setSaving(true)

    try {
      await apiFetchClient(`/api/role/${roleId}/menus`, {
        method: 'PUT',
        body: JSON.stringify({
          menus: Array.from(assignments.values())
        })
      })

      setSnack({ open: true, message: 'Menus assigned successfully', severity: 'success' })
      onSaved?.()
      setTimeout(() => setOpen(false), 1500)
    } catch (error) {
      console.error('Failed to assign menus:', error)
      setSnack({ open: true, message: 'Failed to assign menus', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} maxWidth='lg' fullWidth scroll='body'>
        <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
        <DialogTitle variant='h4' className='text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          Assign Menu to {roleName}
        </DialogTitle>
        <DialogContent className='pbs-0 sm:pli-16'>
          {loading ? (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Menu</TableCell>
                    <TableCell align='center'>Assigned</TableCell>
                    <TableCell align='center'>Create</TableCell>
                    <TableCell align='center'>Read</TableCell>
                    <TableCell align='center'>Update</TableCell>
                    <TableCell align='center'>Delete</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {menus.map(menu => {
                    const assignment = assignments.get(menu.id)
                    const isAssigned = !!assignment

                    return (
                      <TableRow key={menu.id}>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            {menu.icon && <i className={menu.icon} />}
                            <span>{menu.nama}</span>
                          </div>
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox checked={isAssigned} onChange={() => handleToggleMenu(menu.id)} />
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={assignment?.canCreate ?? false}
                            disabled={!isAssigned}
                            onChange={() => handleTogglePermission(menu.id, 'canCreate')}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={assignment?.canRead ?? false}
                            disabled={!isAssigned}
                            onChange={() => handleTogglePermission(menu.id, 'canRead')}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={assignment?.canUpdate ?? false}
                            disabled={!isAssigned}
                            onChange={() => handleTogglePermission(menu.id, 'canUpdate')}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={assignment?.canDelete ?? false}
                            disabled={!isAssigned}
                            onChange={() => handleTogglePermission(menu.id, 'canDelete')}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='text' onClick={() => setOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack(prev => ({ ...prev, open: false }))}
          severity={snack.severity}
          variant='filled'
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  )
}
