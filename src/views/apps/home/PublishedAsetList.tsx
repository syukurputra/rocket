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
import Pagination from '@mui/material/Pagination'
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

type ItemAset = {
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
  publishId?: string | null
  jenis: string
  nama: string
  deskripsi?: string
  alamat: string
  kota: string
  provinsi: string
  latitude: number | null
  longitude: number | null
  nominal: number
  images: AsetImage[]
  itemAsets: ItemAset[]
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
  const [data, setData] = useState<PublishedAset[]>([])
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: activePage.toString(),
        limit: ITEMS_PER_PAGE.toString()
      })

      if (searchValue) params.set('search', searchValue)

      const res = await fetch(`/api/public/aset?${params.toString()}`)
      const result = await res.json()

      if (result.data) {
        setData(result.data)
        setTotalPages(result.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching published assets:', error)
    } finally {
      setLoading(false)
    }
  }, [activePage, searchValue])

  useEffect(() => {
    setActivePage(1)
  }, [searchValue])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getLowestPrice = (itemAsets: ItemAset[]): number => {
    if (!itemAsets || itemAsets.length === 0) return 0

    const prices = itemAsets.map(r => r.hargaBulanan).filter(p => p > 0)

    return prices.length > 0 ? Math.min(...prices) : 0
  }

  const getActiveItemCount = (itemAsets: ItemAset[]): number => {
    if (!itemAsets) return 0

    return itemAsets.filter(r => r.status === 'aktif').length
  }

  // Skeleton card for loading state
  const SkeletonCard = () => (
    <div className='border rounded bs-full'>
      <div className='pli-2 pbs-2'>
        <Skeleton variant='rectangular' height={130} className='rounded' />
      </div>
      <div className='flex flex-col gap-2 p-3'>
        <div className='flex items-center justify-between'>
          <Skeleton variant='rounded' width={60} height={20} />
          <Skeleton variant='text' width={60} />
        </div>
        <div className='flex flex-col gap-1'>
          <Skeleton variant='text' width='80%' height={24} />
          <Skeleton variant='text' width='100%' />
        </div>
        <Skeleton variant='text' width='60%' />
        <Skeleton variant='rounded' height={32} />
      </div>
    </div>
  )

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        {loading ? (
          <Grid container spacing={4}>
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        ) : data.length > 0 ? (
          <Grid container spacing={4}>
            {data.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
                <div className='border rounded bs-full flex flex-col'>
                  <div className='pli-2 pbs-2'>
                    <Link href={`/publish/${item.publishId || item.id}`} className='flex'>
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0].filepath}
                          alt={item.nama}
                          className='is-full rounded object-cover'
                          style={{ height: '130px' }}
                        />
                      ) : (
                        <Box
                          className='is-full rounded flex items-center justify-center'
                          sx={{
                            height: '130px',
                            bgcolor: 'action.hover'
                          }}
                        >
                          <i className='tabler-photo-off text-3xl text-textDisabled' />
                        </Box>
                      )}
                    </Link>
                  </div>
                  <div className='flex flex-col gap-2 p-3 flex-1'>
                    <div className='flex items-center justify-between gap-1'>
                      <Chip
                        label={item.jenis.charAt(0).toUpperCase() + item.jenis.slice(1)}
                        variant='tonal'
                        size='small'
                        color={getChipColor(item.jenis)}
                      />
                      <div className='flex items-center gap-1'>
                        <i className='tabler-box text-sm text-textSecondary' />
                        <Typography variant='caption' color='text.secondary'>
                          {getActiveItemCount(item.itemAsets)} Item
                        </Typography>
                      </div>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='body1' fontWeight={600} className='line-clamp-1'>
                        {item.nama}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' className='line-clamp-2'>
                        {item.deskripsi || item.alamat}
                      </Typography>
                    </div>
                    <div className='flex items-center gap-1'>
                      <i className='tabler-map-pin text-lg text-textSecondary' />
                      {item.latitude && item.longitude ? (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          className='line-clamp-1 cursor-pointer hover:text-primary hover:underline'
                          component='a'
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          onClick={e => e.stopPropagation()}
                        >
                          {item.kota}, {item.provinsi}
                        </Typography>
                      ) : (
                        <Typography variant='caption' color='text.secondary' className='line-clamp-1'>
                          {item.kota}, {item.provinsi}
                        </Typography>
                      )}
                    </div>

                    {/* Fasilitas */}
                    {item.fasilitasAset && item.fasilitasAset.length > 0 && (
                      <div className='flex flex-wrap gap-1'>
                        {item.fasilitasAset.slice(0, 2).map(fasilitas => (
                          <Chip
                            key={fasilitas.id}
                            label={fasilitas.nama}
                            size='small'
                            variant='outlined'
                            icon={<i className={fasilitas.icon.code} />}
                          />
                        ))}
                        {item.fasilitasAset.length > 2 && (
                          <Chip
                            label={`+${item.fasilitasAset.length - 2}`}
                            size='small'
                            variant='outlined'
                          />
                        )}
                      </div>
                    )}

                    {/* Price & Action */}
                    <div className='flex flex-col gap-2 mt-auto'>
                      {getLowestPrice(item.itemAsets) > 0 && (
                        <div className='flex items-baseline gap-1'>
                          <Typography variant='body1' color='primary.main' className='font-bold'>
                            {formatCurrency(getLowestPrice(item.itemAsets))}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            /bulan
                          </Typography>
                        </div>
                      )}
                      <Button
                        fullWidth
                        size='small'
                        variant='tonal'
                        endIcon={<i className='tabler-chevron-right' />}
                        component={Link}
                        href={`/publish/${item.publishId || item.id}`}
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
