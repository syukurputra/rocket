'use client'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid2'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'

interface InformationRuanganProps {
  data: any
}

const InformationRuangan = ({ data }: InformationRuanganProps) => {
  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(amount))
  }

  const imageSrc = data.images && data.images.length > 0 ? data.images[0].filepath : '/images/publish-gallery-1.png'

  return (
    <Card>
      <Grid container>
        <Grid size={{ xs: 12, md: 6, lg: 7 }}>
          <CardContent>
            <Typography variant='h5' className='mbe-2'>
              {data.nama}
            </Typography>
            <Typography color='text.secondary'>Harga: {formatCurrency(data.hargaBulanan)}/bulan</Typography>
          </CardContent>
          <CardActions className='card-actions-dense'>
            <Button>Location</Button>
            <Button>Reviews</Button>
          </CardActions>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 5 }} className='flex items-center justify-center md:order-[unset] -order-1'>
          <CardContent className='flex items-center justify-center'>
            <img src={imageSrc} height='175' className='rounded object-contain bs-[175px] is-full' alt={data.nama} />
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  )
}

export default InformationRuangan
