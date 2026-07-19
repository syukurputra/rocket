'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'

type UlasanItem = {
  id: string
  nama: string
  rating: number
  komentar: string | null
  itemAsetNama: string | null
  createdAt: string
}

type UlasanData = {
  summary: { average: number; total: number; breakdown: Record<string, number> }
  list: UlasanItem[]
}

const Stars = ({ value, size = 16 }: { value: number; size?: number }) => (
  <span className='inline-flex items-center gap-0.5'>
    {[1, 2, 3, 4, 5].map(i => (
      <i
        key={i}
        className={i <= Math.round(value) ? 'tabler-star-filled' : 'tabler-star'}
        style={{ fontSize: size, color: i <= Math.round(value) ? '#ffb400' : '#d1d5db' }}
      />
    ))}
  </span>
)

const getInitial = (name: string) => (name?.trim()?.[0] || '?').toUpperCase()

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

const PAGE_SIZE = 10

const UlasanPanel = ({ asetId }: { asetId: string }) => {
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
          <Box display='flex' flexDirection='column' alignItems='center' gap={1} py={5}>
            <i className='tabler-star-off text-4xl text-textDisabled' />
            <Typography variant='body2' color='text.secondary'>Belum ada ulasan</Typography>
          </Box>
        ) : (
          <>
            {/* Ringkasan rating */}
            <div className='flex items-center gap-4 mbe-4'>
              <div className='flex flex-col items-center'>
                <Typography variant='h3' color='primary.main' fontWeight={700}>
                  {summary!.average.toFixed(1)}
                </Typography>
                <Stars value={summary!.average} />
                <Typography variant='caption' color='text.secondary' className='mbs-1'>
                  {total} ulasan
                </Typography>
              </div>
              <div className='flex-1 flex flex-col gap-1'>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = summary!.breakdown[String(star)] || 0
                  const pct = total > 0 ? (count / total) * 100 : 0

                  return (
                    <div key={star} className='flex items-center gap-2'>
                      <Typography variant='caption' color='text.secondary' sx={{ minWidth: 34 }}>
                        {star} <i className='tabler-star-filled' style={{ fontSize: 10, color: '#ffb400' }} />
                      </Typography>
                      <LinearProgress
                        variant='determinate'
                        value={pct}
                        sx={{ flex: 1, height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: '#ffb400' } }}
                      />
                      <Typography variant='caption' color='text.secondary' sx={{ minWidth: 20, textAlign: 'right' }}>
                        {count}
                      </Typography>
                    </div>
                  )
                })}
              </div>
            </div>

            <Divider className='mbe-4' />

            {/* Daftar ulasan */}
            <div className='flex flex-col gap-4'>
              {pagedList.map(u => (
                <div key={u.id} className='flex gap-3'>
                  <Avatar sx={{ width: 36, height: 36, fontSize: 15 }}>{getInitial(u.nama)}</Avatar>
                  <div className='min-is-0 flex-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <Typography variant='body2' fontWeight={600} className='truncate'>{u.nama}</Typography>
                      <Typography variant='caption' color='text.secondary' className='whitespace-nowrap'>
                        {formatDate(u.createdAt)}
                      </Typography>
                    </div>
                    <Stars value={u.rating} size={13} />
                    {u.itemAsetNama && (
                      <Typography variant='caption' color='text.secondary' className='block'>
                        {u.itemAsetNama}
                      </Typography>
                    )}
                    {u.komentar && (
                      <Typography variant='body2' color='text.secondary' className='mbs-1'>
                        {u.komentar}
                      </Typography>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pageCount > 1 && (
              <div className='flex justify-center mbs-4'>
                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  size='small'
                  color='primary'
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default UlasanPanel
