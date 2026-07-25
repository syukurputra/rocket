'use client'

import { useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Checkbox from '@mui/material/Checkbox'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

import dayjs from 'dayjs'

import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type EligibleTagihan = {
  id: string
  nomorTagihan: string | null
  keterangan: string
  nominal: number
  hargaMerchant: number
  adminBooking: number
  createdAt: string
  penyewaNama: string | null
  asetNama: string | null
  itemAsetNama: string | null
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const TarikSaldoView = () => {
  const router = useRouter()
  const { snack, showSnack, closeSnack } = useSnackbar()

  const [data, setData] = useState<EligibleTagihan[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rekeningLengkap, setRekeningLengkap] = useState(true)
  const [checkingRekening, setCheckingRekening] = useState(true)
  const [biayaLayanan, setBiayaLayanan] = useState(0)
  const [rekening, setRekening] = useState({ bankPenerima: '', nomorRekening: '', rekeningPenerima: '' })

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await apiFetchClient<{ data: EligibleTagihan[]; total: { biayaLayanan: number } }>(
        '/api/tarik-saldo/eligible'
      )

      setData(res.data || [])
      setSelected(new Set())
      setBiayaLayanan(Number(res.total?.biayaLayanan ?? 0))
    } catch (err) {
      console.error('Fetch eligible error:', err)
      showSnack('Gagal memuat data transaksi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const checkRekening = async () => {
    try {
      setCheckingRekening(true)
      const res = await apiFetchClient<{ data: any }>('/api/setting/company')
      const d = res.data

      setRekening({
        bankPenerima: d.bankPenerima || '',
        nomorRekening: d.nomorRekening || '',
        rekeningPenerima: d.rekeningPenerima || ''
      })
      setRekeningLengkap(Boolean(d.bankPenerima && d.nomorRekening && d.rekeningPenerima))
    } catch (err) {
      console.error('Fetch company error:', err)
      // Kalau gagal cek, jangan blokir user — biarkan validasi backend yang final
      setRekeningLengkap(true)
    } finally {
      setCheckingRekening(false)
    }
  }

  useEffect(() => {
    fetchData()
    checkRekening()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allSelected = data.length > 0 && selected.size === data.length
  const someSelected = selected.size > 0 && selected.size < data.length

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.map(d => d.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)

      next.has(id) ? next.delete(id) : next.add(id)

      return next
    })
  }

  const { selectedCount, selectedTotal, nilaiTransfer } = useMemo(() => {
    let total = 0

    data.forEach(d => {
      if (selected.has(d.id)) total += d.hargaMerchant
    })

    return { selectedCount: selected.size, selectedTotal: total, nilaiTransfer: total - biayaLayanan }
  }, [selected, data, biayaLayanan])

  const handleTarik = async () => {
    if (selected.size === 0) return

    setSubmitting(true)

    try {
      await apiFetchClient('/api/tarik-saldo', {
        method: 'POST',
        body: JSON.stringify({ tagihanIds: Array.from(selected) })
      })

      setConfirmOpen(false)
      showSnack('Penarikan saldo berhasil dibuat', 'success')
      router.push('/tarik-saldo/history')
    } catch (err: any) {
      console.error('Tarik saldo error:', err)
      showSnack(err?.message || 'Gagal membuat penarikan saldo', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          avatar={
            <Tooltip title='Kembali ke Company'>
              <IconButton size='small' onClick={() => router.push('/setting/company')}>
                <i className='tabler-arrow-left' />
              </IconButton>
            </Tooltip>
          }
          title='Tarik Saldo'
          titleTypographyProps={{ variant: 'h5' }}
          action={
            <Box display='flex' gap={2}>
              <Button
                variant='contained'
                disabled={selected.size === 0 || !rekeningLengkap || checkingRekening}
                onClick={() => setConfirmOpen(true)}
                startIcon={<i className='tabler-cash-banknote' />}
              >
                Tarik Saldo{selected.size > 0 ? ` (${selected.size})` : ''}
              </Button>
            </Box>
          }
        />
        <Divider />

        {!checkingRekening && !rekeningLengkap && (
          <CardContent>
            <Alert
              severity='warning'
              action={
                <Button
                  color='warning'
                  size='small'
                  variant='outlined'
                  onClick={() => router.push('/setting/company/edit?step=2')}
                >
                  Lengkapi Sekarang
                </Button>
              }
            >
              <AlertTitle>Informasi Rekening Belum Lengkap</AlertTitle>
              Lengkapi Bank Penerima, Nomor Rekening, dan Nama Penerima di halaman Informasi Usaha sebelum melakukan tarik saldo.
            </Alert>
          </CardContent>
        )}

        {/* Ringkasan pilihan */}
        <CardContent>
          <Grid container spacing={4}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant='body2' color='text.secondary'>Transaksi Dipilih</Typography>
              <Typography variant='h5'>{selectedCount}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant='body2' color='text.secondary'>Total Nominal Dipilih</Typography>
              <Typography variant='h5' color='primary.main'>{formatRupiah(selectedTotal)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />

        {loading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight={280}>
            <CircularProgress />
          </Box>
        ) : data.length === 0 ? (
          <Box display='flex' flexDirection='column' alignItems='center' gap={2} py={8}>
            <i className='tabler-inbox text-5xl text-textDisabled' />
            <Typography color='text.secondary'>Tidak ada transaksi yang bisa ditarik</Typography>
          </Box>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding='checkbox'>
                    <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                  </TableCell>
                  <TableCell>No. Tagihan</TableCell>
                  <TableCell>Aset / Item</TableCell>
                  <TableCell>Penyewa</TableCell>
                  <TableCell>Tanggal</TableCell>
                  <TableCell align='right'>Nominal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(row => {
                  const isSel = selected.has(row.id)

                  return (
                    <TableRow key={row.id} hover selected={isSel} sx={{ cursor: 'pointer' }} onClick={() => toggleOne(row.id)}>
                      <TableCell padding='checkbox'>
                        <Checkbox checked={isSel} onChange={() => toggleOne(row.id)} onClick={e => e.stopPropagation()} />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='primary.main' className='font-medium'>
                          {row.nomorTagihan || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{row.asetNama || '-'}</Typography>
                        <Typography variant='caption' color='text.secondary'>{row.itemAsetNama || ''}</Typography>
                      </TableCell>
                      <TableCell>{row.penyewaNama || '-'}</TableCell>
                      <TableCell>{dayjs(row.createdAt).format('DD-MM-YYYY')}</TableCell>
                      <TableCell align='right'>
                        <Typography fontWeight={600}>{formatRupiah(row.hargaMerchant)}</Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Konfirmasi */}
      <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Konfirmasi Tarik Saldo</DialogTitle>
        <DialogContent>
          <Typography className='mbe-4'>
            Tarik saldo untuk <strong>{selectedCount} transaksi</strong>?
          </Typography>

          <Box display='flex' flexDirection='column' gap={2}>
            <Box display='flex' justifyContent='space-between'>
              <Typography color='text.secondary'>Bank Penerima</Typography>
              <Typography fontWeight={500}>{rekening.bankPenerima || '-'}</Typography>
            </Box>
            <Box display='flex' justifyContent='space-between'>
              <Typography color='text.secondary'>Nomor Rekening</Typography>
              <Typography fontWeight={500}>{rekening.nomorRekening || '-'}</Typography>
            </Box>
            <Box display='flex' justifyContent='space-between'>
              <Typography color='text.secondary'>Rekening Penerima</Typography>
              <Typography fontWeight={500}>{rekening.rekeningPenerima || '-'}</Typography>
            </Box>

            <Divider />

            <Box display='flex' justifyContent='space-between'>
              <Typography color='text.secondary'>Total Tarik Saldo</Typography>
              <Typography fontWeight={500}>{formatRupiah(selectedTotal)}</Typography>
            </Box>
            <Box display='flex' justifyContent='space-between'>
              <Typography color='text.secondary'>Biaya Layanan</Typography>
              <Typography fontWeight={500} color='error.main'>- {formatRupiah(biayaLayanan)}</Typography>
            </Box>

            <Divider />

            <Box display='flex' justifyContent='space-between'>
              <Typography variant='h6'>Nilai Transfer</Typography>
              <Typography variant='h6' color='primary.main'>{formatRupiah(nilaiTransfer)}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleTarik} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Tarik Saldo'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default TarikSaldoView
