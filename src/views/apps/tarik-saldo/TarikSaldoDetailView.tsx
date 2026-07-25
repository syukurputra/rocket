'use client'

import { useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'

import dayjs from 'dayjs'

import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Header = {
  id: string
  jumlahTransaksi: number
  jumlahNominal: number
  biayaLayanan: number
  nilaiTransfer: number
  status: string
  tanggalRequest: string
}

type Item = {
  id: string
  nomorTagihan: string | null
  keterangan: string
  hargaMerchant: number
  tanggalBayar: string | null
  penyewaNama: string | null
  asetNama: string | null
  itemAsetNama: string | null
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const statusChip = (status: string) => {
  const s = (status || '').toUpperCase()

  if (s === 'SELESAI') return <Chip label='Selesai' color='success' size='small' variant='tonal' />
  if (s === 'DITOLAK') return <Chip label='Ditolak' color='error' size='small' variant='tonal' />
  if (s === 'DIPROSES') return <Chip label='Diproses' color='info' size='small' variant='tonal' />

  return <Chip label='Menunggu' color='warning' size='small' variant='tonal' />
}

const TarikSaldoDetailView = () => {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''

  const [header, setHeader] = useState<Header | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchDetail = async () => {
      try {
        setLoading(true)
        const res = await apiFetchClient<{ data: { header: Header; items: Item[] } }>(
          `/api/tarik-saldo/${id}`,
          undefined,
          { redirectOn401: '/login' }
        )

        setHeader(res.data?.header ?? null)
        setItems(res.data?.items ?? [])
      } catch (err) {
        console.error('Fetch tarik saldo detail error:', err)
        setHeader(null)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id])

  return (
    <Card>
      <CardHeader
        avatar={
          <Tooltip title='Kembali'>
            <IconButton size='small' onClick={() => router.push('/tarik-saldo/history')}>
              <i className='tabler-arrow-left' />
            </IconButton>
          </Tooltip>
        }
        title='Detail Penarikan Saldo'
        titleTypographyProps={{ variant: 'h5' }}
      />
      <Divider />

      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant='caption' color='text.secondary'>Tanggal Request</Typography>
            <Typography variant='body2'>{header ? dayjs(header.tanggalRequest).format('DD-MM-YYYY HH:mm') : '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant='caption' color='text.secondary'>Jumlah Transaksi</Typography>
            <Typography variant='body2'>{header?.jumlahTransaksi ?? 0}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant='caption' color='text.secondary'>Jumlah Nominal</Typography>
            <Typography variant='body2' fontWeight={600}>{formatRupiah(header?.jumlahNominal ?? 0)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant='caption' color='text.secondary'>Biaya Layanan</Typography>
            <Typography variant='body2' color='error.main'>- {formatRupiah(header?.biayaLayanan ?? 0)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant='caption' color='text.secondary'>Nilai Transfer</Typography>
            <Typography variant='body2' fontWeight={600} color='primary.main'>{formatRupiah(header?.nilaiTransfer ?? 0)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant='caption' color='text.secondary'>Status</Typography>
            <div>{header ? statusChip(header.status) : '-'}</div>
          </Grid>
        </Grid>
      </CardContent>
      <Divider />

      {loading ? (
        <Box display='flex' justifyContent='center' alignItems='center' minHeight={280}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Box display='flex' flexDirection='column' alignItems='center' gap={2} py={8}>
          <i className='tabler-inbox text-5xl text-textDisabled' />
          <Typography color='text.secondary'>Tidak ada transaksi</Typography>
        </Box>
      ) : (
        <div className='overflow-x-auto'>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No. Tagihan</TableCell>
                <TableCell>Aset / Item</TableCell>
                <TableCell>Penyewa</TableCell>
                <TableCell>Tanggal Bayar</TableCell>
                <TableCell align='right'>Harga Merchant</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(row => (
                <TableRow key={row.id} hover>
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
                  <TableCell>{row.tanggalBayar ? dayjs(row.tanggalBayar).format('DD-MM-YYYY') : '-'}</TableCell>
                  <TableCell align='right'>
                    <Typography fontWeight={600}>{formatRupiah(row.hargaMerchant)}</Typography>
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

export default TarikSaldoDetailView
