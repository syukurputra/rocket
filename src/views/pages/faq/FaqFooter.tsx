// MUI Imports
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

const FaqFooter = () => {
  return (
    <>
      <div className='flex justify-center items-center flex-col text-center gap-2 plb-6'>
        <Chip label='Butuh Bantuan?' color='primary' variant='tonal' size='small' />
        <Typography variant='h4'>Masih punya pertanyaan?</Typography>
        <Typography>
          Jika pertanyaan Anda tidak ada di FAQ, tim kami siap membantu. Kami akan segera merespons!
        </Typography>
      </div>
      <Grid container spacing={6} className='mbs-6'>
        <Grid size={{ xs: 12, md: 6 }}>
          <div className='flex justify-center items-center flex-col gap-4 p-6 rounded bg-actionHover'>
            <CustomAvatar variant='rounded' color='primary' skin='light' size={46}>
              <i className='tabler-phone text-[26px]' />
            </CustomAvatar>
            <div className='flex items-center flex-col gap-1'>
              <Typography variant='h5'>+62 856-4334-4041</Typography>
              <Typography>WhatsApp — hari kerja 08.00–17.00 WIB</Typography>
            </div>
          </div>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <div className='flex justify-center items-center flex-col gap-4 p-6 rounded bg-actionHover'>
            <CustomAvatar variant='rounded' color='primary' skin='light' size={46}>
              <i className='tabler-mail text-[26px]' />
            </CustomAvatar>
            <div className='flex items-center flex-col gap-1'>
              <Typography variant='h5'>notif@bantusewa.com</Typography>
              <Typography>Cara tercepat mendapatkan jawaban!</Typography>
            </div>
          </div>
        </Grid>
      </Grid>
    </>
  )
}

export default FaqFooter
