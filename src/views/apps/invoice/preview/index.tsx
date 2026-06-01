'use client'

import { useState, useEffect } from 'react'

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



const InvoicePreview = ({ invoiceId }: InvoicePreviewProps) => {
  const [invoice, setInvoice] = useState<InvoiceClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const { snack, showSnack, closeSnack } = useSnackbar()
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

  const handleCheckTransaction = async () => {
    if (!invoice) return

    setChecking(true)
    try {
      const result = await apiFetchClient<{ data: InvoiceClient; message: string }>(
        `/api/invoice/${invoice.id}/check`,
        { method: 'POST' }
      )

      setInvoice(result.data)

      if (result.data.status === 'PAID') {
        showSnack(result.message, 'success')
      } else {
        showSnack(`${result.message}. Mengalihkan ke halaman pembayaran...`, 'warning')
        setTimeout(() => {
          if (result.data.paymentUrl) {
            window.location.href = result.data.paymentUrl
          }
        }, 1500)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengecek transaksi'
      showSnack(`${msg}. Mengalihkan ke halaman pembayaran...`, 'error')

      setTimeout(() => {
        if (invoice.paymentUrl) {
          window.location.href = invoice.paymentUrl
        }
      }, 1500)
    } finally {
      setChecking(false)
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
                          <img src='/images/bantu-sewa/Logo_Bantu_Sewa.svg' alt='Bantu Sewa' className='w-10 h-10' />
                          <div>
                            <Typography variant='h5' color='primary' className='font-extrabold'>
                              Bantu Sewa
                            </Typography>
                            {/* <Typography variant='caption' color='text.secondary'>
                              Property Management System
                            </Typography> */}
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
                    <Grid size={{ xs: 12 }}>
                      <div className='flex flex-col sm:flex-row items-start gap-2 sm:gap-4'>
                        <Typography className='font-medium min-is-[140px]' color='text.primary'>
                          Ditagihkan Kepada:
                        </Typography>
                        <div className='flex flex-col gap-1'>
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
                color='primary'
                variant='contained'
                className='capitalize'
                disabled={checking || status === 'PAID'}
                startIcon={checking ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-refresh' />}
                onClick={handleCheckTransaction}
              >
                {checking ? 'Mengecek...' : 'Check Transaksi'}
              </Button>
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


        </Grid>
      </Grid>



      <AppSnackbar snack={snack} onClose={closeSnack} />
    </Box>
  )
}

export default InvoicePreview
