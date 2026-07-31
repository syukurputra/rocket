'use client'

import { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import type { ApexOptions } from 'apexcharts'

import { apiFetchClient } from '@/src/utils/apiFetchClient'

const AppReactApexCharts = dynamic(() => import('@/src/libs/styles/AppReactApexCharts'), { ssr: false })

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

type TransaksiSummary = {
  jumlahTransaksi: number
  tahun: number
  bulanan: number[]
}

const BookingTransactionChart = () => {
  const [loading, setLoading] = useState(true)
  const [jumlahTransaksi, setJumlahTransaksi] = useState(0)
  const [bulanan, setBulanan] = useState<number[]>(Array(12).fill(0))
  const [tahun, setTahun] = useState(new Date().getFullYear())

  useEffect(() => {
    apiFetchClient<{ data: TransaksiSummary }>('/api/booking/transaksi-summary')
      .then(res => {
        setJumlahTransaksi(res.data?.jumlahTransaksi ?? 0)
        setBulanan(res.data?.bulanan ?? Array(12).fill(0))
        setTahun(res.data?.tahun ?? new Date().getFullYear())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const bulanBerjalan = new Date().getMonth()
  const warnaPudar = 'var(--mui-palette-primary-lightOpacity)'

  const series = [{ name: 'Transaksi', data: bulanan }]

  const options: ApexOptions = {
    chart: { parentHeightOffset: 0, toolbar: { show: false } },

    // distributed:true membuat tiap batang jadi "seri" sendiri, sehingga judul
    // bawaan tooltip salah. Isinya dibuat manual: bulan + jumlah transaksi.
    tooltip: {
      enabled: true,
      custom: ({ dataPointIndex, series }) => {
        const jumlah = series[0][dataPointIndex]

        return `<div class="px-3 py-2">
          <div class="font-medium">${BULAN_SINGKAT[dataPointIndex]} ${tahun}</div>
          <div>${jumlah} transaksi</div>
        </div>`
      }
    },
    grid: { show: false, padding: { top: 0, left: 0, right: 0, bottom: -10 } },
    plotOptions: {
      bar: { borderRadius: 6, distributed: true, columnWidth: '45%', dataLabels: { position: 'top' } }
    },
    legend: { show: false },

    // Jumlahnya ikut ditulis di atas batang, bulan tanpa transaksi dikosongkan
    dataLabels: {
      enabled: true,
      offsetY: -20,
      formatter: val => (Number(val) > 0 ? String(val) : ''),
      style: { fontWeight: 500, colors: ['var(--mui-palette-text-primary)'] }
    },

    // Bulan berjalan disorot, sisanya dibuat pudar
    colors: BULAN_SINGKAT.map((_, i) =>
      i === bulanBerjalan ? 'var(--mui-palette-primary-main)' : warnaPudar
    ),
    xaxis: {
      categories: BULAN_SINGKAT,
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: { style: { fontSize: '12px', colors: 'var(--mui-palette-text-disabled)' } }
    },
    yaxis: { show: false }
  }

  return (
    <Card>
      <CardHeader
        title='Transaksi Booking'
        subheader={`Jumlah transaksi lunas per bulan tahun ${tahun}`}
      />
      <CardContent>
        {loading ? (
          <Box display='flex' justifyContent='center' py={8}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <div className='flex items-center gap-2.5 mbe-2'>
              <Typography variant='h3'>{jumlahTransaksi}</Typography>
              <Chip size='small' variant='tonal' color='secondary' label='Total Transaksi' />
            </div>
            <AppReactApexCharts type='bar' height={220} width='100%' series={series} options={options} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default BookingTransactionChart
