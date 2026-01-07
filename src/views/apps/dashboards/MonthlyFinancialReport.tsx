'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { SyntheticEvent } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import type { Theme } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'

// Third Party Imports
import classnames from 'classnames'
import type { ApexOptions } from 'apexcharts'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/src/libs/styles/AppReactApexCharts'))

type TabCategory = 'pemasukan' | 'pengeluaran' | 'gabungan'

type MonthlyData = {
  month: number
  monthName: string
  pemasukan: number
  pengeluaran: number
  total: number
}

type ReportData = {
  year: number
  monthlyData: MonthlyData[]
  summary: {
    totalPemasukan: number
    totalPengeluaran: number
    total: number
  }
}

const MonthlyFinancialReport = () => {
  // States
  const [value, setValue] = useState<TabCategory>('gabungan')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Hooks
  const theme = useTheme()

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/keuangan/report?year=${selectedYear}`)
        const result = await response.json()

        if (response.ok) {
          setReportData(result.data)
        } else {
          console.error('Failed to fetch report data:', result.message)
        }
      } catch (error) {
        console.error('Error fetching report data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [selectedYear])

  const handleTabChange = (event: SyntheticEvent, newValue: TabCategory) => {
    setValue(newValue)
  }

  const handleYearChange = (event: any) => {
    setSelectedYear(event.target.value)
  }

  // Prepare chart data based on selected tab
  const getChartData = () => {
    if (!reportData) return { categories: [], series: [] }

    const categories = reportData.monthlyData.map(d => d.monthName)

    switch (value) {
      case 'pemasukan':
        return {
          categories,
          series: [
            {
              name: 'Pemasukan',
              data: reportData.monthlyData.map(d => Math.round(d.pemasukan))
            }
          ]
        }
      case 'pengeluaran':
        return {
          categories,
          series: [
            {
              name: 'Pengeluaran',
              data: reportData.monthlyData.map(d => Math.round(d.pengeluaran))
            }
          ]
        }
      case 'gabungan':
        return {
          categories,
          series: [
            {
              name: 'Pemasukan',
              data: reportData.monthlyData.map(d => Math.round(d.pemasukan))
            },
            {
              name: 'Pengeluaran',
              data: reportData.monthlyData.map(d => Math.round(d.pengeluaran))
            }
          ]
        }
      default:
        return { categories: [], series: [] }
    }
  }

  const chartData = getChartData()

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}jt`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}rb`
    }
    return value.toString()
  }

  // Chart options
  const disabledText = 'var(--mui-palette-text-disabled)'

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      type: value === 'gabungan' ? 'bar' : 'bar'
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: value === 'gabungan' ? '50%' : '40%',
        borderRadiusApplication: 'end',
        dataLabels: { position: 'top' }
      }
    },
    legend: {
      show: value === 'gabungan',
      position: 'top',
      horizontalAlign: 'right'
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      formatter: val => formatCurrency(Number(val)),
      style: {
        fontWeight: 500,
        colors: ['var(--mui-palette-text-primary)'],
        fontSize: theme.typography.body2.fontSize as string
      }
    },
    colors:
      value === 'pemasukan'
        ? ['var(--mui-palette-success-main)']
        : value === 'pengeluaran'
          ? ['var(--mui-palette-error-main)']
          : ['var(--mui-palette-success-main)', 'var(--mui-palette-error-main)'],
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    grid: {
      show: true,
      borderColor: 'var(--mui-palette-divider)',
      padding: {
        top: -10,
        left: 10,
        right: 10,
        bottom: 0
      }
    },
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { color: 'var(--mui-palette-divider)' },
      categories: chartData.categories,
      labels: {
        style: {
          colors: disabledText,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      }
    },
    yaxis: {
      labels: {
        formatter: val => formatCurrency(val),
        style: {
          colors: disabledText,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      }
    },
    tooltip: {
      y: {
        formatter: val => `Rp ${val.toLocaleString('id-ID')}`
      }
    },
    responsive: [
      {
        breakpoint: 1450,
        options: {
          plotOptions: {
            bar: { columnWidth: '60%' }
          }
        }
      },
      {
        breakpoint: 600,
        options: {
          plotOptions: {
            bar: { columnWidth: '70%' }
          }
        }
      }
    ]
  }

  const tabData = [
    {
      type: 'gabungan' as TabCategory,
      label: 'Gabungan',
      avatarIcon: 'tabler-chart-bar',
      color: 'primary' as const
    },
    {
      type: 'pemasukan' as TabCategory,
      label: 'Pemasukan',
      avatarIcon: 'tabler-trending-up',
      color: 'success' as const
    },
    {
      type: 'pengeluaran' as TabCategory,
      label: 'Pengeluaran',
      avatarIcon: 'tabler-trending-down',
      color: 'error' as const
    }
  ]

  return (
    <Card>
      <CardHeader
        title='Laporan Keuangan'
        subheader={`Laporan Bulanan Tahun ${selectedYear}`}
        action={
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              displayEmpty
              sx={{
                '& .MuiSelect-select': {
                  py: 1
                }
              }}
            >
              {yearOptions.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />
      <CardContent>
        {loading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight={300}>
            <CircularProgress />
          </Box>
        ) : (
          <TabContext value={value}>
            <TabList
              variant='scrollable'
              scrollButtons='auto'
              onChange={handleTabChange}
              aria-label='financial report tabs'
              className='!border-0 mbe-6'
              sx={{
                '& .MuiTabs-indicator': { display: 'none !important' },
                '& .MuiTab-root': { padding: '0 !important', border: '0 !important' }
              }}
            >
              {tabData.map((item, index) => (
                <Tab
                  key={index}
                  value={item.type}
                  className='mie-4'
                  label={
                    <div
                      className={classnames(
                        'flex flex-col items-center justify-center gap-2 is-[110px] bs-[100px] border rounded-xl',
                        item.type === value ? 'border-solid border-[var(--mui-palette-primary-main)]' : 'border-dashed'
                      )}
                    >
                      <CustomAvatar
                        variant='rounded'
                        skin='light'
                        size={38}
                        {...(item.type === value && { color: item.color })}
                      >
                        <i
                          className={classnames(
                            'text-[22px]',
                            { 'text-textSecondary': item.type !== value },
                            item.avatarIcon
                          )}
                        />
                      </CustomAvatar>
                      <Typography className='font-medium capitalize' color='text.primary'>
                        {item.label}
                      </Typography>
                    </div>
                  }
                />
              ))}
            </TabList>

            {tabData.map((item, index) => (
              <TabPanel key={index} value={item.type} className='!p-0'>
                <AppReactApexCharts type='bar' height={350} width='100%' options={options} series={chartData.series} />

                {/* Summary */}
                {reportData && (
                  <Box mt={4} display='flex' justifyContent='space-around' flexWrap='wrap' gap={2}>
                    <Box textAlign='center'>
                      <Typography variant='body2' color='text.secondary'>
                        Total Pemasukan
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        Rp {reportData.summary.totalPemasukan.toLocaleString('id-ID')}
                      </Typography>
                    </Box>
                    <Box textAlign='center'>
                      <Typography variant='body2' color='text.secondary'>
                        Total Pengeluaran
                      </Typography>
                      <Typography variant='h6' color='error.main'>
                        Rp {reportData.summary.totalPengeluaran.toLocaleString('id-ID')}
                      </Typography>
                    </Box>
                    <Box textAlign='center'>
                      <Typography variant='body2' color='text.secondary'>
                        Saldo
                      </Typography>
                      <Typography variant='h6' color={reportData.summary.total >= 0 ? 'success.main' : 'error.main'}>
                        Rp {reportData.summary.total.toLocaleString('id-ID')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </TabPanel>
            ))}
          </TabContext>
        )}
      </CardContent>
    </Card>
  )
}

export default MonthlyFinancialReport
