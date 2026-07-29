'use client'

// React Imports
import { useCallback, useEffect, useState } from 'react'

// Next Imports
import { useRouter, usePathname } from 'next/navigation'

// MUI Imports
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

/**
 * Ikon keranjang belanja di header.
 *
 * Jumlah item disegarkan saat pindah halaman dan saat ada event
 * `keranjang:updated` — dipicu halaman yang menambah/menghapus isi keranjang.
 */
const KeranjangButton = () => {
  const router = useRouter()
  const pathname = usePathname()

  const [jumlahItem, setJumlahItem] = useState(0)
  const [isAuth, setIsAuth] = useState(false)

  const fetchJumlah = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken')

    setIsAuth(!!accessToken)

    if (!accessToken) {
      setJumlahItem(0)

      return
    }

    try {
      const res = await fetch('/api/keranjang/count', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store'
      })

      if (!res.ok) return

      const body = await res.json()

      setJumlahItem(body.data?.jumlahItem ?? 0)
    } catch {
      /* diamkan — badge bukan info kritis */
    }
  }, [])

  useEffect(() => {
    fetchJumlah()
  }, [fetchJumlah, pathname])

  useEffect(() => {
    window.addEventListener('keranjang:updated', fetchJumlah)

    return () => window.removeEventListener('keranjang:updated', fetchJumlah)
  }, [fetchJumlah])

  if (!isAuth) return null

  return (
    <Tooltip title='Keranjang'>
      <IconButton className='text-textPrimary' onClick={() => router.push('/keranjang')}>
        <Badge color='primary' badgeContent={jumlahItem} invisible={jumlahItem === 0}>
          <i className='tabler-shopping-cart text-2xl' />
        </Badge>
      </IconButton>
    </Tooltip>
  )
}

export default KeranjangButton
