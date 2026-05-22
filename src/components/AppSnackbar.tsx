'use client'

import { useState, useCallback } from 'react'

import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info'

export interface SnackbarState {
  open: boolean
  message: string
  severity: SnackbarSeverity
}

export interface AppSnackbarProps {
  snack: SnackbarState
  onClose: () => void
  autoHideDuration?: number
}

const AppSnackbar = ({ snack, onClose, autoHideDuration = 4000 }: AppSnackbarProps) => {
  return (
    <Snackbar
      open={snack.open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{
        top: 'calc(var(--header-height) + 16px) !important',
        zIndex: theme => theme.zIndex.snackbar + 1
      }}
    >
      <Alert severity={snack.severity} variant='filled' onClose={onClose}>
        {snack.message}
      </Alert>
    </Snackbar>
  )
}

export const useSnackbar = () => {
  const [snack, setSnack] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })

  const showSnack = useCallback((message: string, severity: SnackbarSeverity = 'success') => {
    setSnack({ open: true, message, severity })
  }, [])

  const closeSnack = useCallback(() => {
    setSnack(prev => ({ ...prev, open: false }))
  }, [])

  return { snack, showSnack, closeSnack }
}

export default AppSnackbar
