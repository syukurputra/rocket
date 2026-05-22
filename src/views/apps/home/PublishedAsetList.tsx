'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

// Type Imports
import type { ThemeColor } from '@core/types'

type AsetImage = {
  id: string
  filename: string
  filepath: string
}

type Ruangan = {
  id: string
  nama: string
  status: string
  nominal: number
  hargaBulanan: number
}

type FasilitasAset = {
  id: string
  nama: string
  icon: {
    id: string
    nama: string
    code: string
  }
}

type PublishedAset = {
  id: string
  jenis: string
  nama: string
  deskripsi?: string
  alamat: string
  kota: string
  provinsi: string
  nominal: number
  images: AsetImage[]
  ruangan: Ruangan[]
  fasilitasAset: FasilitasAset[]
}

type ChipColorType = {
  color: ThemeColor
}

type Props = {
  searchValue: string
}

const jenisChipColor: { [key: string]: ChipColorType } = {
  kos: { color: 'primary' },
  kontrakan: { color: 'success' },
  apartemen: { color: 'info' },
  rumah: { color: 'warning' },
  ruko: { color: 'error' },
  default: { color: 'secondary' }
}

const getChipColor = (jenis: string): ThemeColor => {
  const key = jenis.toLowerCase()

  return jenisChipColor[key]?.color ?? jenisChipColor['default'].color
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const ITEMS_PER_PAGE = 6

const PublishedAsetList = (props: Props) => {
  const { searchValue } = props

  // States
  const [jenisFilter, setJenisFilter] = useState<string>('All')
  const [jenisOptions, setJenisOptions] = useState<string[]>([])
  const [data, setData] = useState<PublishedAset[]>([])
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: activePage.toString(),
        limit: ITEMS_PER_PAGE.toString()
      })

      if (searchValue) params.set('search', searchValue)
      if (jenisFilter !== 'All') params.set('jenis', jenisFilter)

      const res = await fetch(`/api/public/aset?${params.toString()}`)
      const result = await res.json()

      if (result.data) {
        setData(result.data)
        setTotalPages(result.pagination.totalPages)
        setTotalCount(result.pagination.totalCount)
      }

      if (result.jenisOptions) {
        setJenisOptions(result.jenisOptions)
      }
    } catch (error) {
      console.error('Error fetching published assets:', error)
    } finally {
      setLoading(false)
    }
  }, [activePage, searchValue, jenisFilter])

  useEffect(() => {
    setActivePage(1)
  }, [searchValue, jenisFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getLowestPrice = (ruangan: Ruangan[]): number => {
    if (ruangan.length === 0) return 0

    const prices = ruangan.map(r => r.hargaBulanan).filter(p => p > 0)

    return prices.length > 0 ? Math.min(...prices) : 0
  }

  const getAvailableRoomCount = (ruangan: Ruangan[]): number => {
    return ruangan.filter(r => r.status === 'tidak huni').length
  }

  // Skeleton card for loading state
  const SkeletonCard = () => (
    <div className='border rounded bs-full'>
      <div className='pli-2 pbs-2'>
        <Skeleton variant='rectangular' height={200} className='rounded' />
      </div>
      <div className='flex flex-col gap-4 p-5'>
        <div className='flex items-center justify-between'>
          <Skeleton variant='rounded' width={70} height={24} />
          <Skeleton variant='text' width={80} />
        </div>
        <div className='flex flex-col gap-1'>
          <Skeleton variant='text' width='80%' height={28} />
          <Skeleton variant='text' width='100%' />
        </div>
        <Skeleton variant='text' width='60%' />
        <Skeleton variant='rounded' height={36} />
      </div>
    </div>
  )

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <Typography variant='h5'>Aset Publish</Typography>
            <Typography>
              {loading ? 'Memuat data...' : `Total ${totalCount} aset tersedia`}
            </Typography>
          </div>
          <div className='flex flex-wrap items-center gap-y-4 gap-x-6'>
            <FormControl fullWidth size='small' className='is-[250px] flex-auto'>
              <Select
                fullWidth
                id='select-jenis'
                value={jenisFilter}
                onChange={e => {
                  setJenisFilter(e.target.value)
                  setActivePage(1)
                }}
                labelId='jenis-select'
              >
                <MenuItem value='All'>Semua Jenis</MenuItem>
                {jenisOptions.map(jenis => (
                  <MenuItem key={jenis} value={jenis}>
                    {jenis.charAt(0).toUpperCase() + jenis.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        {loading ? (
          <Grid container spacing={6}>
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        ) : data.length > 0 ? (
          <Grid container spacing={6}>
            {data.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                <div className='border rounded bs-full flex flex-col'>
                  <div className='pli-2 pbs-2'>
                    <Link href={`/publish/${item.id}`} className='flex'>
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0].filepath}
                          alt={item.nama}
                          className='is-full rounded object-cover'
                          style={{ height: '200px' }}
                        />
                      ) : (
                        <Box
                          className='is-full rounded flex items-center justify-center'
                          sx={{
                            height: '200px',
                            bgcolor: 'action.hover'
                          }}
                        >
                          <i className='tabler-photo-off text-4xl text-textDisabled' />
                        </Box>
                      )}
                    </Link>
                  </div>
                  <div className='flex flex-col gap-4 p-5 flex-1'>
                    <div className='flex items-center justify-between'>
                      <Chip
                        label={item.jenis.charAt(0).toUpperCase() + item.jenis.slice(1)}
                        variant='tonal'
                        size='small'
                        color={getChipColor(item.jenis)}
                      />
                      <div className='flex items-center gap-1'>
                        <i className='tabler-door text-lg text-textSecondary' />
                        <Typography variant='body2' color='text.secondary'>
                          {getAvailableRoomCount(item.ruangan)}/{item.ruangan.length} Kamar
                        </Typography>
                      </div>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <Typography
                        variant='h5'
                        component={Link}
                        href={`/publish/${item.id}`}
                        className='hover:text-primary'
                      >
                        {item.nama}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' className='line-clamp-2'>
                        {item.deskripsi || item.alamat}
                      </Typography>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-1'>
                        <i className='tabler-map-pin text-xl text-textSecondary' />
                        <Typography variant='body2' color='text.secondary' className='line-clamp-1'>
                          {item.kota}, {item.provinsi}
                        </Typography>
                      </div>
                    </div>

                    {/* Fasilitas */}
                    {item.fasilitasAset && item.fasilitasAset.length > 0 && (
                      <div className='flex flex-wrap gap-2'>
                        {item.fasilitasAset.slice(0, 4).map(fasilitas => (
                          <Chip
                            key={fasilitas.id}
                            label={fasilitas.nama}
                            size='small'
                            variant='outlined'
                            icon={<i className={fasilitas.icon.code} />}
                          />
                        ))}
                        {item.fasilitasAset.length > 4 && (
                          <Chip
                            label={`+${item.fasilitasAset.length - 4}`}
                            size='small'
                            variant='outlined'
                          />
                        )}
                      </div>
                    )}

                    {/* Price & Action */}
                    <div className='flex flex-col gap-3 mt-auto'>
                      {getLowestPrice(item.ruangan) > 0 && (
                        <div className='flex items-baseline gap-1'>
                          <Typography variant='h6' color='primary.main' className='font-bold'>
                            {formatCurrency(getLowestPrice(item.ruangan))}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            /bulan
                          </Typography>
                        </div>
                      )}
                      <Button
                        fullWidth
                        variant='tonal'
                        endIcon={<i className='tabler-chevron-right' />}
                        component={Link}
                        href={`/publish/${item.id}`}
                      >
                        Lihat Detail
                      </Button>
                    </div>
                  </div>
                </div>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box className='flex flex-col items-center justify-center py-12 gap-4'>
            <i className='tabler-building-skyscraper text-6xl text-textDisabled' />
            <Typography className='text-center' color='text.secondary'>
              Belum ada aset yang dipublikasikan
            </Typography>
          </Box>
        )}

        {totalPages > 1 && (
          <div className='flex justify-center'>
            <Pagination
              count={totalPages}
              page={activePage}
              showFirstButton
              showLastButton
              shape='rounded'
              variant='tonal'
              color='primary'
              onChange={(e, page) => setActivePage(page)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PublishedAsetList
