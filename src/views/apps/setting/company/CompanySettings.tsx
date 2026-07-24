'use client'

import { useState, useEffect } from 'react'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import LinearProgress from '@mui/material/LinearProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'

import type { ApexOptions } from 'apexcharts'
import classnames from 'classnames'

import CustomAvatar from '@core/components/mui/Avatar'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

const AppReactApexCharts = dynamic(() => import('@/src/libs/styles/AppReactApexCharts'), { ssr: false })

type EarningItem = {
  title: string
  stats: string
  progress: number
  avatarIcon: string
  avatarColor: 'primary' | 'info' | 'error'
  progressColor: 'primary' | 'info' | 'error'
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const earningChartSeries = [{ data: [0, 0, 0, 0, 0, 0, 0] }]

type LastInvoice = {
  id: string
  nomorInvoice: string
  billingCycle: string
  subtotal: number
  total: number
  tanggalBayar: string | null
  tanggalInvoice: string
  paket: {
    id: string
    nama: string
    deskripsi: string | null
    hargaBulanan: number
    hargaTahunan: number
  } | null
}

type Company = {
  id: string
  nama: string
  alamat: string | null
  telepon: string | null
  email: string | null
  status: boolean
  paketId: string | null
  paketStartDate: string | null
  paketEndDate: string | null
  paket?: { id: string; nama: string; deskripsi: string | null } | null
  lastInvoice?: LastInvoice | null
}

const CompanySettings = () => {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [jumlahTransaksi, setJumlahTransaksi] = useState(0)
  const [saldoBelumDitarik, setSaldoBelumDitarik] = useState(0)
  const [saldoSudahDitarik, setSaldoSudahDitarik] = useState(0)
  const { snack, showSnack, closeSnack } = useSnackbar()

  const earningData: EarningItem[] = [
    { title: 'Total Transaksi', stats: `${jumlahTransaksi} Transaksi`, progress: jumlahTransaksi > 0 ? 100 : 0, avatarColor: 'primary', progressColor: 'primary', avatarIcon: 'tabler-receipt' },
    { title: 'Saldo Belum Ditarik', stats: formatRupiah(saldoBelumDitarik), progress: saldoBelumDitarik > 0 ? 100 : 0, avatarColor: 'info', progressColor: 'info', avatarIcon: 'tabler-wallet' },
    { title: 'Saldo Sudah Ditarik', stats: formatRupiah(saldoSudahDitarik), progress: saldoSudahDitarik > 0 ? 100 : 0, avatarColor: 'error', progressColor: 'error', avatarIcon: 'tabler-cash-banknote' }
  ]

  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    telepon: '',
    email: ''
  })

  const fetchCompany = async () => {
    try {
      setLoading(true)
      const response = await apiFetchClient<{ data: Company }>('/api/setting/company')

      setCompany(response.data)
      setFormData({
        nama: response.data.nama,
        alamat: response.data.alamat || '',
        telepon: response.data.telepon || '',
        email: response.data.email || ''
      })
    } catch (error) {
      console.error('Failed to fetch company:', error)
      showSnack('Gagal memuat data perusahaan', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchTotalTransaksi = async () => {
    try {
      const res = await apiFetchClient<{ data: { jumlahTransaksi: number } }>('/api/booking/transaksi-summary')

      setJumlahTransaksi(res.data?.jumlahTransaksi ?? 0)
    } catch (error) {
      console.error('Failed to fetch transaksi summary:', error)
    }
  }

  // Saldo Belum Ditarik  = SUM(hargaMerchant) tagihan SESUAI & tarikSaldoId NULL (/eligible)
  // Saldo Sudah Ditarik  = SUM(jumlahNominal) dari riwayat penarikan (/tarik-saldo)
  const fetchSaldo = async () => {
    try {
      const [eligibleRes, historyRes] = await Promise.all([
        apiFetchClient<{ total: { jumlahNominal: number } }>('/api/tarik-saldo/eligible'),
        apiFetchClient<{ data: { jumlahNominal: number }[] }>('/api/tarik-saldo')
      ])

      setSaldoBelumDitarik(eligibleRes.total?.jumlahNominal ?? 0)
      setSaldoSudahDitarik((historyRes.data ?? []).reduce((s, r) => s + Number(r.jumlahNominal ?? 0), 0))
    } catch (error) {
      console.error('Failed to fetch saldo:', error)
    }
  }

  useEffect(() => {
    fetchCompany()
    fetchTotalTransaksi()
    fetchSaldo()
  }, [])

  const handleEditClick = () => {
    if (company) {
      setFormData({
        nama: company.nama,
        alamat: company.alamat || '',
        telepon: company.telepon || '',
        email: company.email || ''
      })
      setEditDialogOpen(true)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await apiFetchClient<{ data: Company }>('/api/setting/company', {
        method: 'PUT',
        body: JSON.stringify(formData)
      })

      setCompany(response.data)
      setEditDialogOpen(false)
      showSnack('Data perusahaan berhasil diperbarui')
    } catch (error) {
      console.error('Failed to update company:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui data perusahaan'

      showSnack(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'

    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className='flex justify-center items-center p-10'>
            <CircularProgress />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!company) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>Data perusahaan tidak ditemukan</Alert>
        </CardContent>
      </Card>
    )
  }

  const paketNama = company.paket?.nama || company.lastInvoice?.paket?.nama || '-'
  const paketDeskripsi = company.paket?.deskripsi || company.lastInvoice?.paket?.deskripsi || ''
  const billingCycleLabel = company.lastInvoice?.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'
  const totalPembayaran = company.lastInvoice ? Number(company.lastInvoice.total) : 0
  const nomorInvoice = company.lastInvoice?.nomorInvoice || '-'

  const now = new Date()
  const startDate = company.paketStartDate ? new Date(company.paketStartDate) : null
  const endDate = company.paketEndDate ? new Date(company.paketEndDate) : null
  const totalDays = startDate && endDate ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)) : 30
  const isExpired = endDate !== null && now > endDate
  const daysUsedRaw = startDate ? Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / 86400000)) : 0
  const daysUsed = Math.min(daysUsedRaw, totalDays)
  const daysRemaining = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000)) : 0
  const progress = Math.min(100, Math.round((daysUsed / totalDays) * 100))
  const isExpiringSoon = !isExpired && daysRemaining <= 7 && endDate !== null

  const primaryColorWithOpacity = 'var(--mui-palette-primary-lightOpacity)'

  const earningChartOptions: ApexOptions = {
    chart: { parentHeightOffset: 0, toolbar: { show: false } },
    tooltip: { enabled: false },
    grid: { show: false, padding: { top: -31, left: 0, right: 0, bottom: -9 } },
    plotOptions: {
      bar: { borderRadius: 4, distributed: true, columnWidth: '42%' }
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: [
      primaryColorWithOpacity, primaryColorWithOpacity, primaryColorWithOpacity,
      primaryColorWithOpacity, 'var(--mui-palette-primary-main)',
      primaryColorWithOpacity, primaryColorWithOpacity
    ],
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
    xaxis: {
      categories: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: { style: { fontSize: '13px', colors: 'var(--mui-palette-text-disabled)' } }
    },
    yaxis: { show: false }
  }

  return (
    <>
      <Grid container spacing={6}>
        {/* Company Information Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <div className='flex justify-between items-center mb-6'>
                <Typography variant='h5'>Informasi Usaha</Typography>
                <Button variant='contained' onClick={handleEditClick} startIcon={<i className='tabler-edit' />}>
                  Ubah
                </Button>
              </div>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='caption' color='text.secondary'>Nama Usaha</Typography>
                  <Typography variant='body1' fontWeight={600} className='mt-1'>{company.nama}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='caption' color='text.secondary'>Email</Typography>
                  <Typography variant='body1' className='mt-1'>{company.email || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='caption' color='text.secondary'>Telepon</Typography>
                  <Typography variant='body1' className='mt-1'>{company.telepon || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='caption' color='text.secondary'>Status</Typography>
                  <div className='mt-1'>
                    {company.status ? (
                      <Chip label='Aktif' color='success' size='small' variant='tonal' />
                    ) : (
                      <Chip label='Nonaktif' color='error' size='small' variant='tonal' />
                    )}
                  </div>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant='caption' color='text.secondary'>Alamat</Typography>
                  <Typography variant='body1' className='mt-1'>{company.alamat || '-'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Package Information Card - CurrentPlan style */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title='Informasi Paket'
              action={
                <div className='flex flex-wrap gap-2'>
                  <Button
                    variant='contained'
                    size='small'
                    startIcon={<i className='tabler-arrow-up-circle' />}
                    onClick={() => router.push('/paket')}
                  >
                    Upgrade Paket
                  </Button>
                  <Button
                    variant='tonal'
                    color='secondary'
                    size='small'
                    startIcon={<i className='tabler-history' />}
                    onClick={() => router.push('/setting/invoice')}
                  >
                    History Pembayaran
                  </Button>
                </div>
              }
            />
            <CardContent>
              {company.paket || company.lastInvoice ? (
                <Grid container spacing={6}>
                  {/* Left: Plan details */}
                  <Grid size={{ xs: 12, md: 6 }} className='flex flex-col gap-6'>
                    <div className='flex flex-col gap-1'>
                      <Typography color='text.primary' className='font-medium'>
                        Paket saat ini: {paketNama}
                      </Typography>
                      {paketDeskripsi && <Typography>{paketDeskripsi}</Typography>}
                    </div>
                    <div className='flex flex-col gap-1'>
                      <Typography color='text.primary' className='font-medium'>
                        Aktif hingga {formatDate(company.paketEndDate)}
                      </Typography>
                      <Typography>Notifikasi akan dikirim saat langganan mendekati akhir</Typography>
                    </div>
                  </Grid>

                  {/* Right: Invoice + Alert + Progress */}
                  <Grid size={{ xs: 12, md: 6 }} className='flex flex-col gap-6'>
                    {company.lastInvoice && (
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center gap-1.5'>
                          <Typography color='text.primary' className='font-medium'>
                            {formatCurrency(totalPembayaran)}
                          </Typography>
                          <Chip color='primary' variant='tonal' label={billingCycleLabel} size='small' />
                        </div>
                        <Typography>No. Invoice: {nomorInvoice}</Typography>
                      </div>
                    )}
                    {isExpired && (
                      <Alert severity='error'>
                        <AlertTitle>Paket Habis!</AlertTitle>
                        Paket anda sudah habis harap perpanjang paket
                      </Alert>
                    )}
                    {isExpiringSoon && (
                      <Alert severity='warning'>
                        <AlertTitle>Perhatian!</AlertTitle>
                        Paket anda akan habis
                      </Alert>
                    )}
                    {endDate && (
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center justify-between'>
                          <Typography color='text.primary' className='font-medium'>Hari</Typography>
                          <Typography color='text.primary' className='font-medium'>
                            {daysUsed} dari {totalDays} Hari
                          </Typography>
                        </div>
                        <LinearProgress variant='determinate' value={progress} />
                        <Typography variant='body2'>
                          {isExpired ? 'Periode berlangganan telah berakhir' : `${daysRemaining} hari tersisa hingga periode berakhir`}
                        </Typography>
                      </div>
                    )}
                  </Grid>

                </Grid>
              ) : (
                <Alert severity='info'>Tidak ada paket aktif</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        {/* Laporan Pendapatan Card */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title='Laporan Pendapatan Booking'
              subheader='Ringkasan Transaksi Booking'
              className='pbe-0'
              action={
                <div className='flex flex-wrap gap-2'>
                  <Button
                    variant='contained'
                    size='small'
                    startIcon={<i className='tabler-cash-banknote' />}
                    onClick={() => router.push('/tarik-saldo')}
                  >
                    Tarik Saldo
                  </Button>
                  <Button
                    variant='tonal'
                    color='secondary'
                    size='small'
                    startIcon={<i className='tabler-history' />}
                    onClick={() => router.push('/tarik-saldo/history')}
                  >
                    History Tarik Saldo
                  </Button>
                </div>
              }
            />
            <CardContent className='flex flex-col gap-5'>
              <div className='flex flex-col sm:flex-row items-center justify-between gap-8'>
                <div className='flex flex-col gap-3 is-full sm:is-[unset]'>
                  <div className='flex items-center gap-2.5'>
                    <Typography variant='h2'>{jumlahTransaksi}</Typography>
                    <Chip size='small' variant='tonal' color='secondary' label='Total Transaksi' />
                  </div>
                  <Typography variant='body2'>
                    {jumlahTransaksi > 0
                      ? 'Jumlah transaksi lunas pada item aset Anda'
                      : 'Data transaksi akan tampil setelah ada transaksi'}
                  </Typography>
                </div>
                <AppReactApexCharts type='bar' height={163} width='100%' series={earningChartSeries} options={earningChartOptions} />
              </div>
              <div className='flex flex-col sm:flex-row gap-6 p-5 border rounded'>
                {earningData.map((item, index) => (
                  <div key={index} className='flex flex-col gap-2 is-full'>
                    <div className='flex items-center gap-2'>
                      <CustomAvatar skin='light' variant='rounded' color={item.avatarColor} size={26}>
                        <i className={classnames(item.avatarIcon, 'text-lg')} />
                      </CustomAvatar>
                      <Typography variant='h6' className='leading-6 font-normal'>{item.title}</Typography>
                    </div>
                    <Typography variant='h4'>{item.stats}</Typography>
                    <LinearProgress value={item.progress} variant='determinate' color={item.progressColor} className='max-bs-1' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => !saving && setEditDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Ubah Informasi Usaha</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mt-1'>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Nama Perusahaan'
                value={formData.nama}
                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Telepon'
                value={formData.telepon}
                onChange={e => setFormData({ ...formData, telepon: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Alamat'
                multiline
                rows={3}
                value={formData.alamat}
                onChange={e => setFormData({ ...formData, alamat: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSave} variant='contained' disabled={saving || !formData.nama}>
            {saving ? <CircularProgress size={20} /> : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default CompanySettings
