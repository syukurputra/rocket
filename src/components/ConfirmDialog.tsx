'use client'

// Pengganti `window.confirm()` — tampilannya mengikuti tema aplikasi, bukan
// dialog bawaan browser.
//
// Pemakaian:
//   const { confirm, confirmProps } = useConfirm()
//   ...
//   if (!(await confirm({ title: 'Hapus Harga', message: 'Hapus harga ini?' }))) return
//   ...
//   <ConfirmDialog {...confirmProps} />

import { useCallback, useRef, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  color?: 'error' | 'primary' | 'warning' | 'success'
}

export type ConfirmDialogProps = {
  opsi: ConfirmOptions | null
  onJawab: (setuju: boolean) => void
}

/**
 * Menyediakan `confirm()` berbasis Promise sehingga alur `if (!confirm(...)) return`
 * cukup diganti jadi `if (!(await confirm(...))) return`.
 */
export function useConfirm() {
  const [opsi, setOpsi] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((setuju: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpsi(options)

    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve
    })
  }, [])

  const onJawab = useCallback((setuju: boolean) => {
    resolverRef.current?.(setuju)
    resolverRef.current = null
    setOpsi(null)
  }, [])

  return { confirm, confirmProps: { opsi, onJawab } }
}

const ConfirmDialog = ({ opsi, onJawab }: ConfirmDialogProps) => (
  <Dialog open={!!opsi} onClose={() => onJawab(false)} maxWidth='xs' fullWidth>
    <DialogTitle>{opsi?.title || 'Konfirmasi'}</DialogTitle>
    <DialogContent>
      <DialogContentText>{opsi?.message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button variant='tonal' color='secondary' onClick={() => onJawab(false)}>
        {opsi?.cancelLabel || 'Batal'}
      </Button>
      <Button variant='contained' color={opsi?.color || 'error'} onClick={() => onJawab(true)}>
        {opsi?.confirmLabel || 'Hapus'}
      </Button>
    </DialogActions>
  </Dialog>
)

export default ConfirmDialog
