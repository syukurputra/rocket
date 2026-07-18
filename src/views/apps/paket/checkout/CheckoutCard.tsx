'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Type Imports
import type { MasterPaketClient } from '@/src/types/apps/paketTypes'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

interface CheckoutCardProps {
  paket: MasterPaketClient | null
  loading?: boolean
  billingCycle: 'monthly' | 'annually'
  company?: {
    id: string
    nama: string
    paketId: string | null
  } | null
}

const CheckoutCard = ({ paket, loading, billingCycle, company }: CheckoutCardProps) => {
  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPrice = (): number => {
    if (!paket) return 0
    const price = billingCycle === 'annually' ? paket.hargaTahunan : paket.hargaBulanan

    return typeof price === 'string' ? parseFloat(price) : price
  }

  const getMonthlyEquivalent = (): number => {
    if (!paket) return 0
    const total = getPrice()

    return billingCycle === 'annually' ? total / 12 : total
  }

  const getTotal = (): number => {
    return getPrice()
  }

  const today = new Date()

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getDueDate = (): Date => {
    const due = new Date(today)

    if (billingCycle === 'annually') {
      due.setFullYear(due.getFullYear() + 1)
    } else {
      due.setMonth(due.getMonth() + 1)
    }

    return due
  }

  if (loading) {
    return (
      <Card>
        <CardContent className='flex justify-center items-center' style={{ minHeight: '400px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (!paket) {
    return (
      <Card>
        <CardContent className='flex justify-center items-center' style={{ minHeight: '200px' }}>
          <Typography color='text.secondary'>Paket tidak ditemukan</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='previewCard'>
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
                    <Typography color='text.primary'>Aryana Karawaci Cluster Flora Blok E6-08</Typography>
                    <Typography color='text.primary'>Kab. Tangerang</Typography>
                  </div>
                </div>

                <div className='flex flex-col gap-4'>
                  <div className='flex items-center gap-2'>
                    <Typography variant='h5' className='font-bold'>
                      Order Berlangganan
                    </Typography>
                    <Chip
                      label='Pending'
                      color='warning'
                      size='small'
                      variant='tonal'
                    />
                  </div>
                  <div className='flex flex-col gap-1'>
                    <Typography color='text.primary'>
                      <span className='font-medium'>Tanggal Order:</span> {formatDate(today)}
                    </Typography>
                    <Typography color='text.primary'>
                      <span className='font-medium'>Jatuh Tempo:</span> {formatDate(getDueDate())}
                    </Typography>
                    <Typography color='text.primary'>
                      <span className='font-medium'>Siklus:</span>{' '}
                      {billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </Grid>

          {/* Invoice To & Bill To */}
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4'>
                  <Typography className='font-medium min-is-[130px]' color='text.primary'>
                    Order Untuk:
                  </Typography>
                  <div className='flex items-center gap-2'>
                    <Typography className='font-semibold' color='text.primary'>
                      {company?.nama || 'Perusahaan Anda'}
                    </Typography>
                    <Typography color='text.secondary'>
                      (Pelanggan)
                    </Typography>
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
                    <th className='!bg-transparent'>Deskripsi</th>
                    <th className='!bg-transparent'>Siklus</th>
                    <th className='!bg-transparent'>Qty</th>
                    <th className='!bg-transparent'>Harga</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <Typography color='text.primary' className='font-medium'>
                        {paket.nama}
                      </Typography>
                    </td>
                    <td>
                      <Typography color='text.secondary'>
                        {paket.deskripsi || `Paket ${paket.nama}`}
                      </Typography>
                    </td>
                    <td>
                      <Chip
                        label={billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'}
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
                        {formatRupiah(getPrice())}
                      </Typography>
                      {billingCycle === 'annually' && (
                        <Typography variant='caption' color='text.secondary'>
                          (~{formatRupiah(getMonthlyEquivalent())}/bln)
                        </Typography>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Grid>

          {/* Summary */}
          <Grid size={{ xs: 12 }}>
            <div className='flex justify-between flex-col gap-y-4 sm:flex-row'>
              <div className='flex flex-col gap-1 order-2 sm:order-[unset]'>
                {/* Features list */}
                {paket.paketMenus && paket.paketMenus.filter(pm => pm.tampilkan).length > 0 && (
                  <div>
                    <Typography className='font-medium mb-2' color='text.primary'>
                      Fitur yang disertakan:
                    </Typography>
                    <div className='flex flex-col gap-1'>
                      {paket.paketMenus
                        .filter(pm => pm.tampilkan)
                        .slice(0, 5)
                        .map(pm => (
                          <div key={pm.menu.id} className='flex items-center gap-2'>
                            <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-primary min-w-[16px]'>
                              <path d='M5 12l5 5l10 -10'></path>
                            </svg>
                            <Typography variant='body2' color='text.secondary'>
                              {pm.deskripsi || pm.menu.keterangan || pm.menu.nama}
                            </Typography>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className='min-is-[220px]'>
                <div className='flex items-center justify-between'>
                  <Typography color='text.secondary'>Subtotal:</Typography>
                  <Typography className='font-medium' color='text.primary'>
                    {formatRupiah(getPrice())}
                  </Typography>
                </div>
                <div className='flex items-center justify-between'>
                  <Typography color='text.secondary'>Diskon:</Typography>
                  <Typography className='font-medium' color='text.primary'>
                    {formatRupiah(0)}
                  </Typography>
                </div>
                <Divider className='mlb-2' />
                <div className='flex items-center justify-between'>
                  <Typography className='font-semibold' color='text.primary'>
                    Total:
                  </Typography>
                  <Typography className='font-extrabold' color='primary.main' variant='h6'>
                    {formatRupiah(getTotal())}
                  </Typography>
                </div>
              </div>
            </div>
          </Grid>

          {/* Divider + Note */}
          <Grid size={{ xs: 12 }}>
            <Divider className='border-dashed' />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box className='p-4 rounded' sx={{ bgcolor: 'action.hover' }}>
              <Typography>
                <Typography component='span' className='font-medium' color='text.primary'>
                  Catatan:{' '}
                </Typography>
                Segera lakukan pembayaran untuk berlangganan.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CheckoutCard
