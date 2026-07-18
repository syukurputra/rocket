'use client'

import { useState, useEffect } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import dayjs from 'dayjs'

import type { InvoiceClient, InvoiceStatus } from '@/src/types/apps/invoiceTypes'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import { downloadPdfFromApi } from '@/src/utils/downloadPdf'

const statusColors: Record<InvoiceStatus, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  PENDING: 'warning',
  KONFIRMASI: 'info',
  PAID: 'success',
  CANCELLED: 'error',
  EXPIRED: 'default'
}

const statusLabels: Record<InvoiceStatus, string> = {
  PENDING: 'Menunggu Pembayaran',
  KONFIRMASI: 'Konfirmasi Pembayaran',
  PAID: 'Lunas',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kadaluarsa'
}

const formatRupiah = (num: number | string) => {
  const n = typeof num === 'string' ? parseFloat(num) : num

  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

interface Props {
  open: boolean
  invoiceId: string | null
  onClose: () => void
  onUpdated: () => void
}

const InvoiceDetailDialog = ({ open, invoiceId, onClose, onUpdated }: Props) => {
  const [invoice, setInvoice] = useState<InvoiceClient | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()

  useEffect(() => {
    if (!open || !invoiceId) return

    const fetch = async () => {
      try {
        setLoading(true)
        const result = await apiFetchClient<{ data: InvoiceClient }>(
          `/api/invoice/${invoiceId}`,
          undefined,
          { redirectOn401: '/login' }
        )

        setInvoice(result.data)
      } catch {
        showSnack('Gagal memuat data invoice', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceId])

  const handleCheckTransaction = async () => {
    if (!invoice) return
    try {
      setChecking(true)
      const result = await apiFetchClient<{ data: InvoiceClient; message: string }>(
        `/api/invoice/${invoice.id}/check`,
        { method: 'POST' },
        { redirectOn401: '/login' }
      )

      setInvoice(result.data)

      if (result.data.status === 'PAID') {
        showSnack(result.message || 'Pembayaran berhasil!', 'success')
        onUpdated()
      } else {
        showSnack(`${result.message}. Mengalihkan ke halaman pembayaran...`, 'warning')
        setTimeout(() => {
          if (result.data.paymentUrl) window.location.href = result.data.paymentUrl
        }, 1500)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengecek transaksi'

      showSnack(`${msg}. Mengalihkan ke halaman pembayaran...`, 'error')
      setTimeout(() => {
        if (invoice?.paymentUrl) window.location.href = invoice.paymentUrl
      }, 1500)
    } finally {
      setChecking(false)
    }
  }

  const status = invoice?.status as InvoiceStatus
  const isPaid = status === 'PAID'

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='body'>
        <DialogTitle sx={{ pb: 0 }}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex flex-col items-center justify-center bg-primary rounded p-2'>
                <i className='tabler-file-invoice text-white text-xl' />
              </div>
              <div>
                <Typography variant='h5'>Detail Invoice</Typography>
              </div>
            </div>
            <IconButton onClick={onClose}>
              <i className='tabler-x' />
            </IconButton>
          </div>
        </DialogTitle>

        <Divider sx={{ mt: 3 }} />

        <DialogContent sx={{ pt: 4 }}>
          {loading || !invoice ? (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={5}>
              {/* Left: Invoice content */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Card variant='outlined'>
                  <CardContent sx={{ p: 4 }}>
                    {/* Header */}
                    <Box className='p-4 rounded mb-4' sx={{ bgcolor: 'action.hover' }}>
                      <div className='flex justify-between items-start gap-4 flex-wrap'>
                        <div>
                          <Typography variant='h6' fontWeight={700} color='primary'>Bantu Sewa</Typography>
                          <Typography variant='body2' color='text.secondary'>Platform Manajemen Sewa</Typography>
                        </div>
                        <div className='flex flex-col items-end gap-1'>
                          <Chip label={statusLabels[status] ?? status} color={statusColors[status] ?? 'default'} size='small' variant='tonal' />
                          <Typography variant='caption' color={invoice.tanggalBayar ? 'success.main' : 'text.secondary'}>
                            {invoice.tanggalBayar ? dayjs(invoice.tanggalBayar).format('DD MMMM YYYY') : '-'}
                          </Typography>
                        </div>
                      </div>
                    </Box>

                    {/* Informasi Invoice */}
                    <div className='flex flex-col gap-2 mb-4 px-4'>
                      <div className='flex justify-between gap-4'>
                        <Typography variant='body2' color='text.secondary'>ID Transaksi</Typography>
                        <Typography variant='body2' fontWeight={500}>{invoice.id}</Typography>
                      </div>
                      <div className='flex justify-between gap-4'>
                        <Typography variant='body2' color='text.secondary'>No. Invoice</Typography>
                        <Typography variant='body2' fontWeight={500}>{invoice.nomorInvoice}</Typography>
                      </div>
                      <div className='flex justify-between gap-4'>
                        <Typography variant='body2' color='text.secondary'>Periode Paket</Typography>
                        <Typography variant='body2' fontWeight={500}>
                          {dayjs(invoice.tanggalInvoice).format('DD MMM YYYY')} - {dayjs(invoice.tanggalJatuhTempo).format('DD MMM YYYY')}
                        </Typography>
                      </div>
                    </div>

                    <Divider sx={{ my: 3 }} />

                    {/* Tabel item */}
                    <div className='border rounded overflow-hidden mb-4'>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                            <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                              <Typography variant='caption' fontWeight={600}>PAKET</Typography>
                            </th>
                            <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                              <Typography variant='caption' fontWeight={600}>SIKLUS</Typography>
                            </th>
                            <th style={{ padding: '10px 16px', textAlign: 'right' }}>
                              <Typography variant='caption' fontWeight={600}>HARGA</Typography>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '12px 16px' }}>
                              <Typography fontWeight={500}>{(invoice as any).paket?.nama || '-'}</Typography>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <Chip label={invoice.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'} color='primary' size='small' variant='tonal' />
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <Typography fontWeight={600} color='primary.main'>{formatRupiah(invoice.total)}</Typography>
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                            <td style={{ padding: '12px 16px' }} colSpan={2}>
                              <Typography fontWeight={600}>Total</Typography>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <Typography fontWeight={600} color='primary.main'>{formatRupiah(invoice.total)}</Typography>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right: Actions */}
              <Grid size={{ xs: 12, md: 4 }}>
                <div className='flex flex-col gap-3'>
                  {/* PAID */}
                  {isPaid && (
                    <>
                      <Box
                        className='p-2 rounded flex items-center gap-3'
                        sx={{ bgcolor: 'primary.light', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1 }}
                        onClick={async () => {
                          if (downloading) return
                          try {
                            setDownloading(true)
                            await downloadPdfFromApi(`/api/invoice/${invoice.id}/pdf`, `invoice-${invoice.nomorInvoice}.pdf`)
                          } catch {
                            showSnack('Gagal mengunduh bukti pembayaran', 'error')
                          } finally {
                            setDownloading(false)
                          }
                        }}
                      >
                        {downloading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : <i className='tabler-download text-white text-2xl' />}
                        <Typography color='white' fontWeight={600}>
                          {downloading ? 'Menyiapkan...' : 'Download Bukti'}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {/* Belum PAID */}
                  {!isPaid && (
                    <Button
                      fullWidth
                      variant='contained'
                      color='primary'
                      size='medium'
                      disabled={checking}
                      startIcon={checking ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-refresh' />}
                      onClick={handleCheckTransaction}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {checking ? 'Mengecek...' : 'Check Transaksi'}
                    </Button>
                  )}

                  <Divider />

                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-2'>
                      <i className='tabler-shield-check text-success' />
                      <Typography variant='caption' color='text.secondary'>Transaksi aman & terenkripsi</Typography>
                    </div>
                    <div className='flex items-center gap-2'>
                      <i className='tabler-headset text-primary' />
                      <Typography variant='caption' color='text.secondary'>Butuh bantuan? Hubungi kami</Typography>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    variant='tonal'
                    color='secondary'
                    onClick={onClose}
                    startIcon={<i className='tabler-arrow-left' />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Kembali
                  </Button>
                </div>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default InvoiceDetailDialog
