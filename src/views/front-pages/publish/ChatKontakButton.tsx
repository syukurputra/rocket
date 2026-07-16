'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Tooltip from '@mui/material/Tooltip'

// Component Imports
import CustomIconButton from '@core/components/mui/IconButton'

type Props = {
  companyId: string
  asetId?: string
}

const ChatKontakButton = ({ companyId, asetId }: Props) => {
  const router = useRouter()

  const handleClick = () => {
    const target = `/chat/start?companyId=${companyId}${asetId ? `&asetId=${asetId}` : ''}`
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

    if (!accessToken) {
      // Belum login → simpan tujuan lalu arahkan ke login
      localStorage.setItem('pendingChat', JSON.stringify({ returnTo: target }))
      router.push('/login')

      return
    }

    // Sudah login → langsung ke halaman start chat
    router.push(target)
  }

  return (
    <Tooltip title='Chat'>
      <CustomIconButton
        size='large'
        variant='contained'
        onClick={handleClick}
        sx={{
          bgcolor: 'white',
          color: '#6359e9',
          boxShadow: 4,
          fontSize: '22px !important',
          p: '10px !important',
          '&:hover': { bgcolor: '#f5f5f5', color: '#6359e9' }
        }}
      >
        <i className='tabler-message-circle' />
      </CustomIconButton>
    </Tooltip>
  )
}

export default ChatKontakButton
