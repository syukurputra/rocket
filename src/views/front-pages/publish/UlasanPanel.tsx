'use client'

import { useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'

import {
  BarisUlasan,
  PAGE_SIZE,
  RingkasanRating,
  UlasanKosong,
  type UlasanData
} from './ulasanShared'

const UlasanPanel = ({ asetId }: { asetId: string }) => {
  const pathname = usePathname()

  const [data, setData] = useState<UlasanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/ulasan?asetId=${asetId}`)
        const json = await res.json()

        setData(json.data || null)
      } catch (err) {
        console.error('Fetch ulasan error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [asetId])

  const summary = data?.summary
  const total = summary?.total || 0

  const list = data?.list || []
  const pageCount = Math.ceil(list.length / PAGE_SIZE)
  const pagedList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Slug pada URL dipertahankan: /publish/nama-usaha → /publish/nama-usaha/ulasan
  const linkSemua = `${pathname.replace(/\/$/, '')}/ulasan`

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' className='mbe-1'>Ulasan Booking</Typography>
        <Typography variant='body2' color='text.secondary' className='mbe-4'>
          Penilaian dari penyewa yang telah menyelesaikan booking.
        </Typography>

        {loading ? (
          <Box display='flex' justifyContent='center' py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : total === 0 ? (
          <UlasanKosong />
        ) : (
          <>
            <div className='mbe-4'>
              <RingkasanRating summary={summary!} />
            </div>

            <Divider className='mbe-4' />

            <div className='flex flex-col gap-4'>
              {pagedList.map(u => (
                <BarisUlasan key={u.id} ulasan={u} />
              ))}
            </div>

            {pageCount > 1 && (
              <>
                <div className='flex justify-center mbs-4'>
                  <Pagination
                    count={pageCount}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    size='small'
                    color='primary'
                  />
                </div>

                <div className='flex justify-center mbs-3'>
                  <Button
                    component={Link}
                    href={linkSemua}
                    size='small'
                    variant='tonal'
                    endIcon={<i className='tabler-arrow-right' />}
                  >
                    Lihat Semua Ulasan ({total})
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default UlasanPanel
