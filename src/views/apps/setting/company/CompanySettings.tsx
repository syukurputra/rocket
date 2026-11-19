'use client'

import { useState, useEffect } from 'react'

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
import LinearProgress from '@mui/material/LinearProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'

import classnames from 'classnames'

import CustomAvatar from '@core/components/mui/Avatar'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'


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


type Company = {
  id: string
  nama: string
  alamat: string | null
  telepon: string | null
  email: string | null
  bankPenerima?: string | null
  nomorRekening?: string | null
  rekeningPenerima?: string | null
  status: boolean
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
    email: '',
    bankPenerima: '',
    nomorRekening: '',
    rekeningPenerima: ''
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
        email: response.data.email || '',
        bankPenerima: response.data.bankPenerima || '',
        nomorRekening: response.data.nomorRekening || '',
        rekeningPenerima: response.data.rekeningPenerima || ''
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
    router.push('/setting/company/edit')
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

  return (
    <>
      <Grid container spacing={6}>
        {/* Company Information Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <div className='flex justify-between items-center mb-6'>
                <Typography variant='h5'>Informasi Usaha</Typography>
                <Button variant='contained' size='small' onClick={handleEditClick} startIcon={<i className='tabler-edit' />}>
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
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant='caption' color='text.secondary'>Bank Penerima</Typography>
                  <Typography variant='body1' className='mt-1'>{company.bankPenerima || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant='caption' color='text.secondary'>Nomor Rekening</Typography>
                  <Typography variant='body1' className='mt-1'>{company.nomorRekening || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant='caption' color='text.secondary'>Rekening Penerima</Typography>
                  <Typography variant='body1' className='mt-1'>{company.rekeningPenerima || '-'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Bantu Sewa 100% gratis — pengganti kartu informasi paket */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className='bs-full'>
            <CardHeader
              title='Layanan Bantu Sewa'
              action={<Chip label='100% Gratis' color='success' variant='tonal' />}
            />
            <CardContent className='flex flex-col gap-4'>
              <div className='flex items-center gap-4'>
                <CustomAvatar skin='light' variant='rounded' color='success' size={48}>
                  <i className='tabler-gift text-[28px]' />
                </CustomAvatar>
                <div className='flex flex-col'>
                  <Typography variant='h5' color='success.main'>
                    100% Gratis
                  </Typography>
                  <Typography>Tanpa biaya langganan, tanpa batas masa aktif.</Typography>
                </div>
              </div>
              <Alert severity='success' icon={<i className='tabler-circle-check' />}>
                Semua fitur Bantu Sewa terbuka untuk usaha Anda — kelola aset, booking, penyewa, dan keuangan
                tanpa perlu upgrade.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
        {/* Laporan Pendapatan Card */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title='Laporan Pendapatan Booking'
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
              <div className='flex flex-col gap-3'>
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

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Bank Penerima'
                placeholder='mis. BCA, Mandiri, BNI'
                value={formData.bankPenerima}
                onChange={e => setFormData({ ...formData, bankPenerima: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Nomor Rekening'
                value={formData.nomorRekening}
                onChange={e => setFormData({ ...formData, nomorRekening: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Rekening Penerima'
                placeholder='Nama pemilik rekening'
                value={formData.rekeningPenerima}
                onChange={e => setFormData({ ...formData, rekeningPenerima: e.target.value })}
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
