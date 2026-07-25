'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'

import dayjs from 'dayjs'

import { apiFetchClient } from '@/src/utils/apiFetchClient'

type TarikSaldo = {
  id: string
  jumlahTransaksi: number
  jumlahNominal: number
  biayaLayanan: number
  nilaiTransfer: number
  status: string
  tanggalRequest: string
  createdAt: string
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const statusChip = (status: string) => {
  const s = status?.toUpperCase()

  if (s === 'SELESAI') return <Chip label='Selesai' color='success' size='small' variant='tonal' />
  if (s === 'DITOLAK') return <Chip label='Ditolak' color='error' size='small' variant='tonal' />
  if (s === 'DIPROSES') return <Chip label='Diproses' color='info' size='small' variant='tonal' />

  return <Chip label='Menunggu' color='warning' size='small' variant='tonal' />
}

const HistoryTarikSaldoView = () => {
  const router = useRouter()
  const [data, setData] = useState<TarikSaldo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await apiFetchClient<{ data: TarikSaldo[] }>('/api/tarik-saldo')

        setData(res.data || [])
      } catch (err) {
        console.error('Fetch history error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader
        avatar={
          <Tooltip title='Kembali ke Company'>
            <IconButton size='small' onClick={() => router.push('/setting/company')}>
              <i className='tabler-arrow-left' />
            </IconButton>
          </Tooltip>
        }
        title='Riwayat Penarikan Saldo'
        titleTypographyProps={{ variant: 'h5' }}
      />
      <Divider />

      {loading ? (
        <Box display='flex' justifyContent='center' alignItems='center' minHeight={280}>
          <CircularProgress />
        </Box>
      ) : data.length === 0 ? (
        <Box display='flex' flexDirection='column' alignItems='center' gap={2} py={8}>
          <i className='tabler-history-off text-5xl text-textDisabled' />
          <Typography color='text.secondary'>Belum ada riwayat penarikan saldo</Typography>
        </Box>
      ) : (
        <div className='overflow-x-auto'>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal Request</TableCell>
                <TableCell align='center'>Jumlah Transaksi</TableCell>
                <TableCell align='right'>Jumlah Nominal</TableCell>
                <TableCell align='right'>Biaya Layanan</TableCell>
                <TableCell align='right'>Nilai Transfer</TableCell>
                <TableCell align='center'>Status</TableCell>
                <TableCell align='center'>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(row => (
                <TableRow key={row.id} hover>
                  <TableCell>{dayjs(row.tanggalRequest).format('DD-MM-YYYY HH:mm')}</TableCell>
                  <TableCell align='center'>{row.jumlahTransaksi}</TableCell>
                  <TableCell align='right'>
                    <Typography fontWeight={600}>
                      {formatRupiah(row.jumlahNominal)}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography color='error.main'>- {formatRupiah(row.biayaLayanan)}</Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography fontWeight={600} color='primary.main'>
                      {formatRupiah(row.nilaiTransfer)}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>{statusChip(row.status)}</TableCell>
                  <TableCell align='center'>
                    <Tooltip title='Lihat Detail'>
                      <IconButton size='small' onClick={() => router.push(`/tarik-saldo/history/${row.id}`)}>
                        <i className='tabler-eye text-textSecondary' />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  )
}

export default HistoryTarikSaldoView
