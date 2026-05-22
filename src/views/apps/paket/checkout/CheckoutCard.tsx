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

  const getTax = (): number => {
    return Math.round(getPrice() * 0.11) // 11% PPN
  }

  const getTotal = (): number => {
    return getPrice() + getTax()
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

    due.setDate(due.getDate() + 14)

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
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    Order Untuk:
                  </Typography>
                  <div>
                    <Typography className='font-semibold' color='text.primary'>
                      {company?.nama || 'Perusahaan Anda'}
                    </Typography>
                    <Typography color='text.secondary'>Pelanggan</Typography>
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
                      <Typography className='min-is-[130px]' color='text.secondary'>
                        Metode:
                      </Typography>
                      <Typography color='text.primary'>Transfer Bank</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[130px]' color='text.secondary'>
                        Bank:
                      </Typography>
                      <Typography color='text.primary'>Bank BCA</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[130px]' color='text.secondary'>
                        No. Rekening:
                      </Typography>
                      <Typography color='text.primary'>123-456-7890</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[130px]' color='text.secondary'>
                        A/N:
                      </Typography>
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
                        {paket.deskripsi || `Paket ${paket.nama} - Sistem Manajemen Properti`}
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
                            <i className='tabler-check text-primary text-sm' />
                            <Typography variant='body2' color='text.secondary'>
                              {pm.deskripsi || pm.menu.keterangan || pm.menu.nama}
                            </Typography>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                <Typography color='text.secondary' className='mt-4'>
                  Terima kasih telah memilih layanan kami!
                </Typography>
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
                <div className='flex items-center justify-between'>
                  <Typography color='text.secondary'>PPN (11%):</Typography>
                  <Typography className='font-medium' color='text.primary'>
                    {formatRupiah(getTax())}
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
                Silakan lakukan pembayaran sebelum tanggal jatuh tempo. Setelah konfirmasi pembayaran,
                paket Anda akan langsung aktif. Hubungi kami jika membutuhkan bantuan.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CheckoutCard
