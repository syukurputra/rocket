'use client'

import { useState, useEffect } from 'react'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import type { RuanganClient } from '@/src/types/apps/ruanganTypes'
import { apiFetchClient } from '@/src/utils/apiFetchClient'
import AddEditRuang from '@components/dialogs/ruangan'
import tableStyles from '@core/styles/table.module.css'

type Props = {
  asetId: string
}

export default function AsetRoomStep({ asetId }: Props) {
  const [rooms, setRooms] = useState<RuanganClient[]>([])
  const [loading, setLoading] = useState(false)
  const [openAddRoom, setOpenAddRoom] = useState(false)
  const [editRoomData, setEditRoomData] = useState<RuanganClient | null>(null)

  const fetchRooms = async () => {
    if (!asetId) return
    setLoading(true)
    try {
      const result = await apiFetchClient<{ data: RuanganClient[] }>(`/api/ruangan?asetId=${asetId}`)
      setRooms(result.data || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [asetId])

  const handleEditRoom = (room: RuanganClient) => {
    setEditRoomData(room)
    setOpenAddRoom(true)
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ruangan ini?')) return
    try {
      await apiFetchClient(`/api/ruangan/${roomId}`, { method: 'DELETE' })
      fetchRooms()
    } catch (error) {
      console.error('Failed to delete room:', error)
    }
  }

  const formatNumber = (num: number): string => {
    if (!num || num === 0) return '0'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant='h5'>Daftar Ruangan</Typography>
        <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() => {
            setEditRoomData(null)
            setOpenAddRoom(true)
          }}
        >
          Tambah Ruangan
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
          <CircularProgress />
        </Box>
      ) : rooms.length === 0 ? (
        <Typography color='text.secondary' align='center' sx={{ py: 10 }}>
          Belum ada ruangan. Klik "Tambah Ruangan" untuk menambahkan.
        </Typography>
      ) : (
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Nama Ruangan</th>
                <th>Harga (Bln)</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id}>
                  <td>{room.nama}</td>
                  <td>Rp{formatNumber(room.hargaBulanan)}</td>
                  <td>
                    <Chip
                      label={room.status}
                      color={room.status?.toLowerCase() === 'huni' ? 'success' : 'error'}
                      size='small'
                      variant='tonal'
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </td>
                  <td>
                    <IconButton size='small' onClick={() => handleEditRoom(room)}>
                      <i className='tabler-edit text-textSecondary' />
                    </IconButton>
                    <IconButton size='small' onClick={() => handleDeleteRoom(room.id)}>
                      <i className='tabler-trash text-textSecondary' />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddEditRuang
        open={openAddRoom}
        setOpen={setOpenAddRoom}
        asetId={asetId}
        mode={editRoomData ? 'edit' : 'create'}
        initialData={editRoomData}
        onSaved={() => {
          fetchRooms()
          setOpenAddRoom(false)
        }}
      />
    </Box>
  )
}
