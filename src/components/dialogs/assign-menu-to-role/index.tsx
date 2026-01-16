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
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import type { MenuClient } from '@/src/types/apps/menuTypes'

type MenuAssignment = {
  menuId: string
  assigned: boolean
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
  const [assignments, setAssignments] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    if (!open || !roleId) {
      if (open && !roleId) {
        console.error('AssignMenuToRole: roleId is required but was:', roleId)
        setSnack({
          open: true,
          message: 'Role ID tidak valid. Silakan tutup dialog dan coba lagi.',
          severity: 'error'
        })
      }

      return
    }

    const fetchData = async () => {
      setLoading(true)

      try {
        // Fetch all menus
        const menusResult = await apiFetchClient<{ data: MenuClient[] }>('/api/menu')

        setMenus(menusResult.data || [])

        // Fetch role with existing assignments
        const roleResult = await apiFetchClient<{
          data: {
            menuRoles: Array<{
              menuId: string
            }>
          }
        }>(`/api/role/${roleId}`)

        // Build assignments map
        const assignmentsMap = new Map<string, boolean>()

        roleResult.data.menuRoles.forEach(rm => {
          assignmentsMap.set(rm.menuId, true)
        })

        setAssignments(assignmentsMap)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load data'

        setSnack({ open: true, message: errorMessage, severity: 'error' })
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
      newAssignments.set(menuId, true)
    }

    setAssignments(newAssignments)
  }

  const handleSelectAll = () => {
    const allAssigned = menus.every(m => assignments.has(m.id))
    const newAssignments = new Map<string, boolean>()

    if (!allAssigned) {
      menus.forEach(m => newAssignments.set(m.id, true))
    }

    setAssignments(newAssignments)
  }

  const handleSave = async () => {
    if (!roleId) return

    setSaving(true)

    try {
      const menusToAssign = Array.from(assignments.keys()).map(menuId => ({ menuId }))

      await apiFetchClient(`/api/role/${roleId}/menus`, {
        method: 'PUT',
        body: JSON.stringify({
          menus: menusToAssign
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
      <Dialog open={open} maxWidth='md' fullWidth scroll='body'>
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
            <>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={menus.every(m => assignments.has(m.id))}
                      onChange={handleSelectAll}
                      color='primary'
                    />
                  }
                  label='Pilih Semua'
                />
              </Box>
              <List>
                {menus.map(menu => (
                  <ListItem key={menu.id} dense>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={assignments.has(menu.id)}
                          onChange={() => handleToggleMenu(menu.id)}
                          color='primary'
                        />
                      }
                      label={
                        <div className='flex items-center gap-2'>
                          {menu.icon && <i className={menu.icon} />}
                          <span>{menu.nama}</span>
                        </div>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
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
