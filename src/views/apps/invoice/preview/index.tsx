'use client'

import { useState, useEffect, useRef } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'

import { useRouter } from 'next/navigation'

import dayjs from 'dayjs'

import type { InvoiceClient, InvoiceStatus } from '@/src/types/apps/invoiceTypes'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

import tableStyles from '@core/styles/table.module.css'

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

interface InvoicePreviewProps {
  invoiceId: string
}

const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif)$/i.test(url)
const isPdfUrl = (url: string) => /\.pdf$/i.test(url)

const InvoicePreview = ({ invoiceId }: InvoicePreviewProps) => {
  const [invoice, setInvoice] = useState<InvoiceClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [buktiOpen, setBuktiOpen] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const formatRupiah = (num: number | string): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(n)
  }

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        const result = await apiFetchClient<{ data: InvoiceClient }>(
          `/api/invoice/${invoiceId}`,
          undefined,
          { redirectOn401: '/login' }
        )

        setInvoice(result.data)
      } catch (err) {
        console.error('Failed to fetch invoice:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [invoiceId])

  const handleUploadBukti = async (file: File) => {
    if (!invoice) return

    setUploading(true)

    try {
      const formData = new FormData()

      formData.append('file', file)
      formData.append('invoiceId', invoice.id)

      if (invoice.buktiPembayaran) {
        formData.append('oldFilePath', invoice.buktiPembayaran)
      }

      const token = localStorage.getItem('accessToken')

      const response = await fetch('/api/upload/invoice-bukti-pembayaran', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const err = await response.json()

        throw new Error(err.message || 'Upload gagal')
      }

      const data = await response.json()

      // Save URL + update status to KONFIRMASI in one call
      await apiFetchClient(`/api/invoice/${invoice.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ buktiPembayaran: data.url, status: 'KONFIRMASI' })
      })

      setInvoice(prev => prev ? { ...prev, buktiPembayaran: data.url, status: 'KONFIRMASI' } : prev)
      showSnack('Bukti pembayaran berhasil diupload')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gagal mengupload file'

      showSnack(msg, 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center items-center' sx={{ minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!invoice) {
    return (
      <Card>
        <CardContent className='text-center py-20'>
          <Typography color='text.secondary'>Invoice tidak ditemukan</Typography>
        </CardContent>
      </Card>
    )
  }

  const status = invoice.status as InvoiceStatus
  const buktiUrl = invoice.buktiPembayaran || ''

  return (
    <Box>
      <Breadcrumbs className='mb-6'>
        <Link href='/setting/invoice' color='inherit' underline='hover'>
          <Typography color='text.secondary'>Invoice</Typography>
        </Link>
        <Typography color='text.primary'>{invoice.nomorInvoice}</Typography>
      </Breadcrumbs>

      <Grid container spacing={6}>
        {/* Preview Card */}
        <Grid size={{ xs: 12, md: 9 }} className='invoice-print-area'>
          <Card>
            <CardContent className='sm:!p-12'>
              <Grid container spacing={6}>
                {/* Header */}
                <Grid size={{ xs: 12 }}>
                  <div className='p-6 bg-actionHover rounded'>
                    <div className='flex justify-between gap-y-4 flex-col sm:flex-row'>
                      <div className='flex flex-col gap-4'>
                        <div className='flex items-center gap-3'>
                          <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-primary'>
                            <i className='tabler-building text-white text-xl' />
                          </div>
                          <div>
                            <Typography variant='h5' color='primary' className='font-extrabold'>
                              Rocket
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              Property Management System
                            </Typography>
                          </div>
                        </div>
                        <div>
                          <Typography color='text.primary'>Jl. Sudirman No. 1, Jakarta Pusat</Typography>
                          <Typography color='text.primary'>DKI Jakarta 10220, Indonesia</Typography>
                          <Typography color='text.primary'>+62 (21) 555 1234</Typography>
                        </div>
                      </div>
                      <div className='flex flex-col gap-4'>
                        <div className='flex items-center gap-2'>
                          <Typography variant='h5' className='font-bold'>
                            {invoice.nomorInvoice}
                          </Typography>
                          <Chip
                            label={statusLabels[status] ?? status}
                            color={statusColors[status] ?? 'default'}
                            size='small'
                            variant='tonal'
                          />
                        </div>
                        <div className='flex flex-col gap-1'>
                          <Typography color='text.primary'>
                            <span className='font-medium'>Tanggal:</span>{' '}
                            {dayjs(invoice.tanggalInvoice).format('DD MMMM YYYY')}
                          </Typography>
                          <Typography color='text.primary'>
                            <span className='font-medium'>Jatuh Tempo:</span>{' '}
                            {dayjs(invoice.tanggalJatuhTempo).format('DD MMMM YYYY')}
                          </Typography>
                          {invoice.tanggalBayar && (
                            <Typography color='success.main'>
                              <span className='font-medium'>Dibayar:</span>{' '}
                              {dayjs(invoice.tanggalBayar).format('DD MMMM YYYY')}
                            </Typography>
                          )}
                          <Typography color='text.primary'>
                            <span className='font-medium'>Siklus:</span>{' '}
                            {invoice.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                </Grid>

                {/* Company & Payment Info */}
                <Grid size={{ xs: 12 }}>
                  <Grid container spacing={6}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex flex-col gap-4'>
                        <Typography className='font-medium' color='text.primary'>
                          Ditagihkan Kepada:
                        </Typography>
                        <div>
                          <Typography className='font-semibold' color='text.primary'>
                            {(invoice as any).company?.nama || '-'}
                          </Typography>
                          {(invoice as any).company?.alamat && (
                            <Typography color='text.secondary'>
                              {(invoice as any).company.alamat}
                            </Typography>
                          )}
                          {(invoice as any).company?.email && (
                            <Typography color='text.secondary'>
                              {(invoice as any).company.email}
                            </Typography>
                          )}
                        </div>
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex flex-col gap-4'>
                        <Typography className='font-medium' color='text.primary'>
                          Detail Pembayaran:
                        </Typography>
                        <div className='flex flex-col gap-1'>
                          <div className='flex items-center gap-4'>
                            <Typography className='min-is-[130px]' color='text.secondary'>Bank:</Typography>
                            <Typography color='text.primary'>Bank BCA</Typography>
                          </div>
                          <div className='flex items-center gap-4'>
                            <Typography className='min-is-[130px]' color='text.secondary'>No. Rekening:</Typography>
                            <Typography color='text.primary'>123-456-7890</Typography>
                          </div>
                          <div className='flex items-center gap-4'>
                            <Typography className='min-is-[130px]' color='text.secondary'>A/N:</Typography>
                            <Typography color='text.primary'>PT Rocket Indonesia</Typography>
                          </div>
                        </div>
                      </div>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Items Table */}
                <Grid size={{ xs: 12 }}>
                  <div className='overflow-x-auto border rounded'>
                    <table className={tableStyles.table}>
                      <thead className='border-bs-0'>
                        <tr>
                          <th className='!bg-transparent'>Paket</th>
                          <th className='!bg-transparent'>Siklus</th>
                          <th className='!bg-transparent'>Qty</th>
                          <th className='!bg-transparent'>Harga</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <Typography color='text.primary' className='font-medium'>
                              {invoice.paket?.nama || '-'}
                            </Typography>
                          </td>
                          <td>
                            <Chip
                              label={invoice.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'}
                              color='primary'
                              size='small'
                              variant='tonal'
                            />
                          </td>
                          <td>
                            <Typography color='text.primary'>1</Typography>
                          </td>
                          <td>
                            <Typography color='text.primary' className='font-medium'>
                              {formatRupiah(invoice.subtotal)}
                            </Typography>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Grid>

                {/* Summary */}
                <Grid size={{ xs: 12 }}>
                  <div className='flex justify-end'>
                    <div className='min-is-[220px]'>
                      <div className='flex items-center justify-between'>
                        <Typography color='text.secondary'>Subtotal:</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {formatRupiah(invoice.subtotal)}
                        </Typography>
                      </div>
                      <div className='flex items-center justify-between'>
                        <Typography color='text.secondary'>PPN (11%):</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {formatRupiah(invoice.pajak)}
                        </Typography>
                      </div>
                      <Divider className='mlb-2' />
                      <div className='flex items-center justify-between'>
                        <Typography className='font-semibold' color='text.primary'>Total:</Typography>
                        <Typography className='font-extrabold' color='primary.main' variant='h6'>
                          {formatRupiah(invoice.total)}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </Grid>

                {/* Note */}
                {invoice.catatan && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Divider className='border-dashed' />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography>
                        <Typography component='span' className='font-medium' color='text.primary'>
                          Catatan:{' '}
                        </Typography>
                        {invoice.catatan}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12, md: 3 }} className='no-print'>
          <Card>
            <CardContent className='flex flex-col gap-4'>
              <Button
                fullWidth
                color='secondary'
                variant='tonal'
                className='capitalize'
                startIcon={<i className='tabler-printer' />}
                onClick={() => window.print()}
              >
                Print
              </Button>
              <Button
                fullWidth
                color='secondary'
                variant='tonal'
                className='capitalize'
                startIcon={<i className='tabler-arrow-left' />}
                onClick={() => router.push('/setting/invoice')}
              >
                Kembali ke Daftar
              </Button>
            </CardContent>
          </Card>

          {/* Upload bukti pembayaran — only when PENDING */}
          {status === 'PENDING' && (
            <Card className='mt-6'>
              <CardContent className='flex flex-col gap-4'>
                <div>
                  <Typography variant='subtitle2' className='font-semibold' color='text.primary'>
                    Bukti Pembayaran
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Upload bukti transfer (JPG, PNG, PDF, maks. 5MB)
                  </Typography>
                </div>

                {buktiUrl ? (
                  <div className='flex flex-col gap-2'>
                    <Button
                      fullWidth
                      variant='outlined'
                      size='small'
                      startIcon={<i className='tabler-eye' />}
                      onClick={() => setBuktiOpen(true)}
                    >
                      Lihat Bukti
                    </Button>
                    <Button
                      fullWidth
                      variant='tonal'
                      color='primary'
                      size='small'
                      component='label'
                      disabled={uploading}
                      startIcon={uploading ? <CircularProgress size={16} /> : <i className='tabler-refresh' />}
                    >
                      Ganti File
                      <input
                        type='file'
                        hidden
                        accept='image/jpeg,image/png,image/jpg,application/pdf'
                        onChange={e => {
                          const file = e.target.files?.[0]

                          if (file) handleUploadBukti(file)
                          e.target.value = ''
                        }}
                      />
                    </Button>
                  </div>
                ) : (
                  <Button
                    fullWidth
                    variant='contained'
                    color='primary'
                    component='label'
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-upload' />}
                  >
                    {uploading ? 'Mengupload...' : 'Upload Bukti'}
                    <input
                      ref={fileInputRef}
                      type='file'
                      hidden
                      accept='image/jpeg,image/png,image/jpg,application/pdf'
                      onChange={e => {
                        const file = e.target.files?.[0]

                        if (file) handleUploadBukti(file)
                        e.target.value = ''
                      }}
                    />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Show uploaded proof for non-PENDING invoices if exists */}
          {status !== 'PENDING' && buktiUrl && (
            <Card className='mt-6'>
              <CardContent className='flex flex-col gap-4'>
                <Typography variant='subtitle2' className='font-semibold' color='text.primary'>
                  Bukti Pembayaran
                </Typography>
                <Button
                  fullWidth
                  variant='outlined'
                  size='small'
                  startIcon={<i className='tabler-eye' />}
                  onClick={() => setBuktiOpen(true)}
                >
                  Lihat Bukti
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Popup Bukti Pembayaran */}
      <Dialog open={buktiOpen} onClose={() => setBuktiOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box className='flex items-center justify-between'>
            <Typography variant='h6'>Bukti Pembayaran</Typography>
            <IconButton onClick={() => setBuktiOpen(false)} size='small'>
              <i className='tabler-x' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {buktiUrl && isImageUrl(buktiUrl) && (
            <Box className='flex justify-center'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buktiUrl}
                alt='Bukti Pembayaran'
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
              />
            </Box>
          )}
          {buktiUrl && isPdfUrl(buktiUrl) && (
            <Box sx={{ height: '70vh' }}>
              <iframe
                src={buktiUrl}
                title='Bukti Pembayaran'
                width='100%'
                height='100%'
                style={{ border: 'none', borderRadius: 8 }}
              />
            </Box>
          )}
          {buktiUrl && !isImageUrl(buktiUrl) && !isPdfUrl(buktiUrl) && (
            <Box className='text-center py-8'>
              <i className='tabler-file text-5xl text-textSecondary mb-4 block' />
              <Typography color='text.secondary'>
                File tidak dapat ditampilkan. Silakan download untuk melihat.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            component='a'
            href={buktiUrl}
            download
            startIcon={<i className='tabler-download' />}
            variant='outlined'
          >
            Download
          </Button>
          <Button onClick={() => setBuktiOpen(false)} variant='contained' color='secondary'>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </Box>
  )
}

export default InvoicePreview
