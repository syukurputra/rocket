'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

// Utils Imports
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type CategoryData = {
  id: string
  nama: string
  icon: { code: string } | null
  color: string | null
  jenis: string
  total: number
  percentage: number
}

type ReportData = {
  year: number
  month: number
  categories: CategoryData[]
  totalPemasukan: number
  totalPengeluaran: number
  grandTotal: number
}

const Icon = styled('i')({})

const CategoryKeuangan = () => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedJenis, setSelectedJenis] = useState<string>('Pengeluaran')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // Month options
  const monthOptions = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ]

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true)

      try {
        // Build query string with optional jenis filter
        let queryString = `year=${selectedYear}&month=${selectedMonth}`

        if (selectedJenis !== 'Semua') {
          queryString += `&jenis=${selectedJenis}`
        }

        const result = await apiFetchClient<{ data: ReportData; message?: string }>(
          `/api/keuangan/report/category?${queryString}`
        )

        if (result.data) {
          setReportData(result.data)
        } else {
          setReportData(null)
        }
      } catch (error) {
        console.error('Error fetching category report:', error)
        setReportData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [selectedYear, selectedMonth, selectedJenis])

  const handleYearChange = (event: any) => {
    setSelectedYear(event.target.value)
  }

  const handleMonthChange = (event: any) => {
    setSelectedMonth(event.target.value)
  }

  const handleJenisChange = (event: any) => {
    setSelectedJenis(event.target.value)
  }

  // Get color for progress bar based on jenis
  const getProgressColor = (jenis: string) => {
    return jenis.toLowerCase() === 'pemasukan' ? 'success' : 'error'
  }

  return (
    <Card>
      <CardHeader title='Kategori Keuangan' />
      <CardContent className='flex flex-col gap-4'>
        {/* Filter Dropdowns */}
        <Box display='flex' gap={2} flexWrap='wrap'>
          {/* Year Dropdown */}
          <FormControl size='small' sx={{ minWidth: 100 }}>
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

          {/* Month Dropdown */}
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <Select
              value={selectedMonth}
              onChange={handleMonthChange}
              displayEmpty
              sx={{
                '& .MuiSelect-select': {
                  py: 1
                }
              }}
            >
              {monthOptions.map(month => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Jenis Dropdown */}
          <FormControl size='small' sx={{ minWidth: 140 }}>
            <Select
              value={selectedJenis}
              onChange={handleJenisChange}
              displayEmpty
              sx={{
                '& .MuiSelect-select': {
                  py: 1
                }
              }}
            >
              <MenuItem value='Pengeluaran'>Pengeluaran</MenuItem>
              <MenuItem value='Pemasukan'>Pemasukan</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight={200}>
            <CircularProgress />
          </Box>
        ) : reportData && reportData.categories.length > 0 ? (
          reportData.categories.map((category, index) => (
            <div key={index} className='flex items-center gap-4'>
              {category.icon ? (
                <Icon className={category.icon.code} sx={{ fontSize: 32, color: category.color || 'inherit' }} />
              ) : (
                <Box width={32} height={32} />
              )}
              <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
                <div className='flex flex-col'>
                  <Typography className='font-medium' color='text.primary'>
                    {category.nama}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Rp {category.total.toLocaleString('id-ID')}
                  </Typography>
                </div>
                <div className='flex justify-between items-center gap-2 is-32'>
                  <LinearProgress
                    value={category.percentage}
                    variant='determinate'
                    color={getProgressColor(category.jenis)}
                    className='min-bs-2 is-20'
                  />
                  <Typography color='text.disabled' sx={{ minWidth: 40, textAlign: 'right' }}>
                    {`${category.percentage}%`}
                  </Typography>
                </div>
              </div>
            </div>
          ))
        ) : (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight={200}>
            <Typography color='text.secondary'>Tidak ada data untuk periode ini</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default CategoryKeuangan
