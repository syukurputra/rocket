'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

type SubPoin = { text: string }
type PoinUtama = { text: string; subPoin: SubPoin[] }

const SUBPOIN_LABELS = 'abcdefghijklmnopqrstuvwxyz'

const parse = (raw: string | null): PoinUtama[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === 'object' && 'text' in parsed[0]) return parsed
      return parsed.map((t: string) => ({ text: t, subPoin: [] }))
    }
  } catch {
    const lines = raw.split('\n').filter(l => l.trim())
    return lines.map(t => ({ text: t, subPoin: [] }))
  }
  return []
}

type Props = {
  syaratKetentuan: string | null
}

const SyaratKetentuanDialog = ({ syaratKetentuan }: Props) => {
  const [open, setOpen] = useState(false)
  const poin = parse(syaratKetentuan)

  if (!syaratKetentuan || poin.length === 0) return null

  return (
    <>
      <Button
        variant='tonal'
        color='secondary'
        startIcon={<i className='tabler-file-text' />}
        onClick={() => setOpen(true)}
      >
        Syarat dan Ketentuan
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle className='flex items-center justify-between'>
          <span>Syarat dan Ketentuan</span>
          <IconButton size='small' onClick={() => setOpen(false)}>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <div className='flex flex-col gap-3'>
            {poin.map((item, pi) => (
              <div key={pi}>
                <Typography variant='body1'>
                  <strong>{pi + 1}.</strong> {item.text}
                </Typography>
                {item.subPoin.length > 0 && (
                  <div className='flex flex-col gap-1 mt-1 ml-5'>
                    {item.subPoin.map((sub, si) => (
                      <Typography key={si} variant='body2' color='text.secondary'>
                        {SUBPOIN_LABELS[si] || si + 1}. {sub.text}
                      </Typography>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SyaratKetentuanDialog
