'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'

import { BarisUlasan, PAGE_SIZE, RingkasanRating, UlasanKosong, type UlasanData } from './ulasanShared'

type Props = {
  asetId: string
  asetNama: string

  /** URL halaman aset — dipakai tombol kembali agar slug-nya ikut terjaga */
  kembaliHref: string
}

const UlasanSemua = ({ asetId, asetNama, kembaliHref }: Props) => {
  const [data, setData] = useState<UlasanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch(`/api/public/ulasan?asetId=${asetId}`)
      .then(r => r.json())
      .then(json => setData(json.data || null))
      .catch(err => console.error('Fetch ulasan error:', err))
      .finally(() => setLoading(false))
  }, [asetId])

  const summary = data?.summary
  const total = summary?.total || 0
  const list = data?.list || []

  const pageCount = Math.ceil(list.length / PAGE_SIZE)
  const pagedList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Pindah halaman selalu kembali ke atas daftar
  const gantiHalaman = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <div className='flex items-center gap-3 flex-wrap'>
          <Button
            component={Link}
            href={kembaliHref}
            variant='tonal'
            color='secondary'
            startIcon={<i className='tabler-arrow-left' />}
          >
            Kembali
          </Button>
          <div>
            <Typography variant='h4'>Ulasan Booking</Typography>
            <Typography color='text.secondary'>{asetNama}</Typography>
          </div>
        </div>
      </Grid>

      {loading ? (
        <Grid size={{ xs: 12 }}>
          <Box display='flex' justifyContent='center' py={10}>
            <CircularProgress />
          </Box>
        </Grid>
      ) : total === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <UlasanKosong />
            </CardContent>
          </Card>
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant='h6' className='mbe-4'>Ringkasan Penilaian</Typography>
                <RingkasanRating summary={summary!} />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant='h6' className='mbe-4'>
                  {total} Ulasan
                </Typography>
                <Divider className='mbe-4' />

                <div className='flex flex-col gap-5'>
                  {pagedList.map(u => (
                    <BarisUlasan key={u.id} ulasan={u} />
                  ))}
                </div>

                {pageCount > 1 && (
                  <div className='flex justify-center mbs-6'>
                    <Pagination
                      count={pageCount}
                      page={page}
                      onChange={(_, p) => gantiHalaman(p)}
                      color='primary'
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default UlasanSemua
