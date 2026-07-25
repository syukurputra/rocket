'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'

import dayjs from 'dayjs'

import CustomTextField from '@core/components/mui/TextField'
import AppSnackbar, { useSnackbar } from '@/src/components/AppSnackbar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type TarikSaldoRequest = {
  id: string
  companyNama: string | null
  jumlahTransaksi: number
  jumlahNominal: number
  status: string
  tanggalRequest: string
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const statusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
  const s = (status || '').toUpperCase()

  if (s === 'PENDING' || s === 'DIPROSES') return 'warning'
  if (s === 'SELESAI' || s === 'SUCCESS' || s === 'COMPLETED' || s === 'DISETUJUI') return 'success'
  if (s === 'DITOLAK' || s === 'REJECTED' || s === 'GAGAL') return 'error'

  return 'default'
}

const TarikSaldoManagementView = () => {
  const { snack, showSnack, closeSnack } = useSnackbar()

  const [data, setData] = useState<TarikSaldoRequest[]>([])
  const [loading, setLoading] = useState(true)

  const [pendingSearch, setPendingSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [status, setStatus] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (activeSearch.trim()) params.append('search', activeSearch.trim())
      if (status) params.append('status', status)

      const res = await apiFetchClient<{ data: TarikSaldoRequest[] }>(
        `/api/admin/tarik-saldo?${params.toString()}`,
        undefined,
        { redirectOn401: '/login' }
      )

      setData(res.data || [])
    } catch (err) {
      console.error('Fetch tarik saldo (admin) error:', err)
      showSnack('Gagal memuat data permintaan tarik saldo', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearch, status])

  return (
    <>
      <Card>
        <CardHeader title='Tarik Saldo' />
        <Divider />

        <CardContent>
          <Grid container spacing={3} alignItems='flex-end'>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Cari Company'
                placeholder='Nama company...'
                value={pendingSearch}
                onChange={e => setPendingSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setActiveSearch(pendingSearch) }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <CustomTextField
                select
                fullWidth
                label='Status'
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <MenuItem value=''>Semua Status</MenuItem>
                <MenuItem value='PENDING'>Pending</MenuItem>
                <MenuItem value='SELESAI'>Selesai</MenuItem>
                <MenuItem value='DITOLAK'>Ditolak</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Button variant='contained' onClick={() => setActiveSearch(pendingSearch)}>
                Terapkan
              </Button>
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
            <Typography color='text.secondary'>Belum ada permintaan tarik saldo</Typography>
          </Box>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company</TableCell>
                  <TableCell align='center'>Jumlah Transaksi</TableCell>
                  <TableCell align='right'>Jumlah Nominal</TableCell>
                  <TableCell align='center'>Status</TableCell>
                  <TableCell>Tanggal Request</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>{row.companyNama || '-'}</Typography>
                    </TableCell>
                    <TableCell align='center'>{row.jumlahTransaksi}</TableCell>
                    <TableCell align='right'>
                      <Typography fontWeight={600} color='primary.main'>{formatRupiah(row.jumlahNominal)}</Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip label={row.status} color={statusColor(row.status)} size='small' variant='tonal' />
                    </TableCell>
                    <TableCell>{row.tanggalRequest ? dayjs(row.tanggalRequest).format('DD-MM-YYYY HH:mm') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <AppSnackbar snack={snack} onClose={closeSnack} />
    </>
  )
}

export default TarikSaldoManagementView
