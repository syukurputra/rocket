'use client'

import { useState, useEffect } from 'react'

import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'

import DirectionalIcon from '@components/DirectionalIcon'
import CustomTextField from '@core/components/mui/TextField'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type SubPoin = { text: string }
type PoinUtama = { text: string; subPoin: SubPoin[] }

type Props = {
  activeStep: number
  handleNext: () => void
  handlePrev: () => void
  steps: { title: string; subtitle: string }[]
  asetId: string | null
  initialSyarat?: string
  onShowMessage?: (message: string, type: 'success' | 'error') => void
  onSaved?: (syaratKetentuan: string | null) => void
}

const defaultPoin = (): PoinUtama[] => [{ text: '', subPoin: [] }]

const parse = (raw?: string): PoinUtama[] => {
  if (!raw) return defaultPoin()
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && 'text' in parsed[0]) {
      return parsed
    }
    // legacy: plain string array → poin utama tanpa sub poin
    if (Array.isArray(parsed)) return parsed.map((t: string) => ({ text: t, subPoin: [] }))
  } catch {
    const lines = raw.split('\n').filter(l => l.trim())
    if (lines.length > 0) return lines.map(t => ({ text: t, subPoin: [] }))
  }
  return defaultPoin()
}

const SUBPOIN_LABELS = 'abcdefghijklmnopqrstuvwxyz'

const StepSyaratKetentuan = ({ handleNext, handlePrev, asetId, initialSyarat, onShowMessage, onSaved }: Props) => {
  const [poin, setPoin] = useState<PoinUtama[]>(() => parse(initialSyarat))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPoin(parse(initialSyarat))
  }, [initialSyarat])

  // --- Poin utama ---
  const updatePoin = (i: number, text: string) =>
    setPoin(prev => prev.map((p, idx) => (idx === i ? { ...p, text } : p)))

  const addPoin = () => setPoin(prev => [...prev, { text: '', subPoin: [] }])

  const removePoin = (i: number) => {
    if (poin.length === 1) { setPoin(defaultPoin()); return }
    setPoin(prev => prev.filter((_, idx) => idx !== i))
  }

  // --- Sub poin ---
  const updateSubPoin = (pi: number, si: number, text: string) =>
    setPoin(prev => prev.map((p, idx) =>
      idx === pi ? { ...p, subPoin: p.subPoin.map((s, sidx) => (sidx === si ? { text } : s)) } : p
    ))

  const addSubPoin = (pi: number) =>
    setPoin(prev => prev.map((p, idx) =>
      idx === pi ? { ...p, subPoin: [...p.subPoin, { text: '' }] } : p
    ))

  const removeSubPoin = (pi: number, si: number) =>
    setPoin(prev => prev.map((p, idx) =>
      idx === pi ? { ...p, subPoin: p.subPoin.filter((_, sidx) => sidx !== si) } : p
    ))

  // --- Submit ---
  const handleSubmit = async () => {
    if (!asetId) { handleNext(); return }

    const filled = poin
      .filter(p => p.text.trim() || p.subPoin.some(s => s.text.trim()))
      .map(p => ({ text: p.text, subPoin: p.subPoin.filter(s => s.text.trim()) }))

    const syaratKetentuan = filled.length > 0 ? JSON.stringify(filled) : null

    setLoading(true)
    try {
      await apiFetchClient(`/api/aset/${asetId}`, {
        method: 'PUT',
        body: JSON.stringify({ syaratKetentuan })
      })
      onSaved?.(syaratKetentuan)
      handleNext()
    } catch (error: any) {
      onShowMessage?.(error?.message || 'Gagal menyimpan syarat dan ketentuan', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h5'>Syarat dan Ketentuan</Typography>
        <Typography>Tambahkan poin dan sub poin syarat dan ketentuan aset ini (opsional).</Typography>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Paper variant='outlined' sx={{ p: 3 }}>
          <div className='flex flex-col gap-4'>
            {poin.map((item, pi) => (
              <div key={pi}>
                {/* Poin Utama */}
                <div className='flex items-center gap-2'>
                  <Typography variant='body2' sx={{ minWidth: 24, fontWeight: 700 }}>
                    {pi + 1}.
                  </Typography>
                  <CustomTextField
                    fullWidth
                    placeholder={`Poin ${pi + 1}`}
                    value={item.text}
                    onChange={e => updatePoin(pi, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPoin() } }}
                  />
                  <Tooltip title='Tambah sub poin'>
                    <IconButton size='small' color='primary' onClick={() => addSubPoin(pi)}>
                      <i className='tabler-list-details text-lg' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Hapus poin'>
                    <IconButton size='small' color='error' onClick={() => removePoin(pi)}>
                      <i className='tabler-trash text-lg' />
                    </IconButton>
                  </Tooltip>
                </div>

                {/* Sub Poin */}
                {item.subPoin.length > 0 && (
                  <div className='flex flex-col gap-2 mt-2 ml-8'>
                    {item.subPoin.map((sub, si) => (
                      <div key={si} className='flex items-center gap-2'>
                        <Typography variant='body2' color='text.secondary' sx={{ minWidth: 24, textAlign: 'right' }}>
                          {SUBPOIN_LABELS[si] || si + 1}.
                        </Typography>
                        <CustomTextField
                          fullWidth
                          size='small'
                          placeholder={`Sub poin ${SUBPOIN_LABELS[si] || si + 1}`}
                          value={sub.text}
                          onChange={e => updateSubPoin(pi, si, e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubPoin(pi) } }}
                        />
                        <Tooltip title='Hapus sub poin'>
                          <IconButton size='small' color='error' onClick={() => removeSubPoin(pi, si)}>
                            <i className='tabler-x text-base' />
                          </IconButton>
                        </Tooltip>
                      </div>
                    ))}
                    <Button
                      size='small'
                      variant='text'
                      startIcon={<i className='tabler-plus text-sm' />}
                      onClick={() => addSubPoin(pi)}
                      sx={{ alignSelf: 'flex-start', fontSize: '0.75rem' }}
                    >
                      Tambah Sub Poin
                    </Button>
                  </div>
                )}

                {pi < poin.length - 1 && <Divider sx={{ mt: 2 }} />}
              </div>
            ))}
          </div>

          <Button
            variant='tonal'
            size='small'
            startIcon={<i className='tabler-plus' />}
            onClick={addPoin}
            sx={{ mt: 3 }}
          >
            Tambah Poin
          </Button>
        </Paper>
        <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
          Klik ikon daftar untuk menambah sub poin. Tekan Enter untuk poin/sub poin baru.
        </Typography>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <div className='flex items-center justify-between'>
          <Button
            variant='tonal'
            color='secondary'
            onClick={handlePrev}
            startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
          >
            Previous
          </Button>
          <Button
            variant='contained'
            color='primary'
            onClick={handleSubmit}
            disabled={loading}
            endIcon={
              loading
                ? <CircularProgress size={16} color='inherit' />
                : <DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />
            }
          >
            {loading ? 'Menyimpan...' : 'Next'}
          </Button>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepSyaratKetentuan
