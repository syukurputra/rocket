'use client'

// Bagian tampilan ulasan yang dipakai bersama oleh panel ringkas di halaman
// publish dan halaman "Lihat Semua Ulasan".

import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'

export type UlasanItem = {
  id: string
  nama: string
  rating: number
  komentar: string | null
  itemAsetNama: string | null
  createdAt: string
}

export type UlasanSummary = {
  average: number
  total: number
  breakdown: Record<string, number>
}

export type UlasanData = {
  summary: UlasanSummary
  list: UlasanItem[]
}

/** Jumlah ulasan per halaman, dipakai panel maupun halaman penuh. */
export const PAGE_SIZE = 10

export const Stars = ({ value, size = 16 }: { value: number; size?: number }) => (
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

export const getInitial = (name: string) => (name?.trim()?.[0] || '?').toUpperCase()

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

/** Nilai rata-rata + sebaran bintang. */
export const RingkasanRating = ({ summary }: { summary: UlasanSummary }) => {
  const total = summary.total

  return (
    <div className='flex items-center gap-4'>
      <div className='flex flex-col items-center'>
        <Typography variant='h3' color='primary.main' fontWeight={700}>
          {summary.average.toFixed(1)}
        </Typography>
        <Stars value={summary.average} />
        <Typography variant='caption' color='text.secondary' className='mbs-1'>
          {total} ulasan
        </Typography>
      </div>
      <div className='flex-1 flex flex-col gap-1'>
        {[5, 4, 3, 2, 1].map(star => {
          const count = summary.breakdown[String(star)] || 0
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
  )
}

/** Satu baris ulasan: avatar, nama, tanggal, bintang, item aset, komentar. */
export const BarisUlasan = ({ ulasan }: { ulasan: UlasanItem }) => (
  <div className='flex gap-3'>
    <Avatar sx={{ width: 36, height: 36, fontSize: 15 }}>{getInitial(ulasan.nama)}</Avatar>
    <div className='min-is-0 flex-1'>
      <div className='flex items-center justify-between gap-2'>
        <Typography variant='body2' fontWeight={600} className='truncate'>
          {ulasan.nama}
        </Typography>
        <Typography variant='caption' color='text.secondary' className='whitespace-nowrap'>
          {formatDate(ulasan.createdAt)}
        </Typography>
      </div>
      <Stars value={ulasan.rating} size={13} />
      {ulasan.itemAsetNama && (
        <Typography variant='caption' color='text.secondary' className='block'>
          {ulasan.itemAsetNama}
        </Typography>
      )}
      {ulasan.komentar && (
        <Typography variant='body2' color='text.secondary' className='mbs-1'>
          {ulasan.komentar}
        </Typography>
      )}
    </div>
  </div>
)

/** Tampilan saat aset belum punya ulasan sama sekali. */
export const UlasanKosong = () => (
  <div className='flex flex-col items-center gap-1 plb-10'>
    <i className='tabler-star-off text-4xl text-textDisabled' />
    <Typography variant='body2' color='text.secondary'>
      Belum ada ulasan
    </Typography>
  </div>
)
