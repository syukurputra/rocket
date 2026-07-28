'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter, usePathname } from 'next/navigation'

// MUI Imports
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import { CommandDialog, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk'
import { Title, Description } from '@radix-ui/react-dialog'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

// Style Imports
import './styles.css'

const JENIS_ICON: Record<string, string> = {
  apartemen: 'tabler-building-skyscraper',
  kantor: 'tabler-building-bank',
  mobil: 'tabler-car',
  motor: 'tabler-motorbike',
  rumah: 'tabler-home'
}

const getJenisIcon = (jenis: string) => JENIS_ICON[jenis.toLowerCase()] || 'tabler-building'

// Search "Cari Sewa" — HANYA tampil di halaman Home. Mengetik atau memilih
// kategori langsung memfilter grid "Aset Publish" di halaman itu (via
// ?search=), lalu popup ditutup otomatis.
const NavSearch = () => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [jenisOptions, setJenisOptions] = useState<string[]>([])

  const router = useRouter()
  const pathname = usePathname()
  const { settings } = useSettings()
  const { isBreakpointReached } = useVerticalNav()

  const isHome = pathname === '/home'

  // Ambil daftar kategori (Jenis Aset) sekali saat dialog dibuka
  useEffect(() => {
    if (!isHome || !open) return

    fetch('/api/public/aset?limit=1')
      .then(r => r.json())
      .then(result => setJenisOptions(result.jenisOptions || []))
      .catch(() => setJenisOptions([]))
  }, [isHome, open])

  // Ketikan/pilihan kategori langsung memfilter grid halaman Home, lalu popup
  // ditutup otomatis — hasilnya cukup dilihat di grid, bukan di dalam popup.
  useEffect(() => {
    if (!isHome || !open) return

    const query = searchValue.trim()

    if (!query) return

    const timeout = setTimeout(() => {
      router.replace(`/home?search=${encodeURIComponent(query)}`, { scroll: false })
      setOpen(false)
    }, 300)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, isHome, open])

  const onSelectJenis = (jenis: string) => {
    setSearchValue(jenis)
  }

  // Toggle dialog dengan ⌘K / Ctrl+K (hanya aktif di Home)
  useEffect(() => {
    if (!isHome) return

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }

    document.addEventListener('keydown', down)

    return () => document.removeEventListener('keydown', down)
  }, [isHome])

  useEffect(() => {
    if (!open) setSearchValue('')
  }, [open])

  // Di halaman selain Home: search tidak ditampilkan sama sekali.
  if (!isHome) return null

  return (
    <>
      {isBreakpointReached || settings.layout === 'horizontal' ? (
        <IconButton className='text-textPrimary' onClick={() => setOpen(true)}>
          <i className='tabler-search text-2xl' />
        </IconButton>
      ) : (
        <div className='flex items-center gap-2 cursor-pointer' onClick={() => setOpen(true)}>
          <IconButton className='text-textPrimary' onClick={() => setOpen(true)}>
            <i className='tabler-search text-2xl' />
          </IconButton>
          <div className='whitespace-nowrap select-none text-textDisabled'>Cari Sewa</div>
        </div>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className='flex items-center justify-between border-be pli-4 plb-3 gap-2'>
          <Title hidden>Cari Sewa</Title>
          <Description hidden>Cari aset sewa berdasarkan jenis, nama, atau lokasi</Description>
          <i className='tabler-search' />
          <CommandInput value={searchValue} onValueChange={setSearchValue} placeholder='Cari jenis aset, nama, atau lokasi...' />
          <i className='tabler-x cursor-pointer' onClick={() => setOpen(false)} />
        </div>
        <CommandList>
          {!searchValue && jenisOptions.length > 0 && (
            <CommandGroup heading='JENIS ASET' className='text-xs'>
              {jenisOptions.map(jenis => (
                <CommandItem
                  key={jenis}
                  value={jenis}
                  onSelect={() => onSelectJenis(jenis)}
                  className='mli-2 mbe-px last:mbe-0 rounded'
                >
                  <i className={`text-xl ${getJenisIcon(jenis)}`} />
                  {jenis}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

export default NavSearch
