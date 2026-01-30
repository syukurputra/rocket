// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid2'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

// Component Imports
import MapPicker from '@/src/components/MapPicker'

interface InformationAsetProps {
  data: any
}

const InformationAset = ({ data }: InformationAsetProps) => {
  if (!data) {
    return null
  }

  return (
    <Card>
      <Grid container>
        <Grid size={{ xs: 12, sm: 8 }}>
          <CardContent className='relative'>
            <Chip label={data.jenis} color='primary' className='absolute top-4 right-4' />
            <Typography variant='h5' className='mbe-2'>
              {data.nama}
            </Typography>
            <Typography color='text.secondary'>Deskripsi</Typography>
            <Divider className='mbs-7 mbe-7' />
            <Typography variant='h5' className='mbe-2'>
              Fasilitas
            </Typography>
            <Typography color='text.secondary'>
              {data.alamat}, {data.kota}, {data.provinsi}
            </Typography>
            <Divider className='mbs-7 mbe-7' />
            <Typography variant='h5' className='mbe-2'>
              Fasilitas
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-lock-open text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Full Access</Typography>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-user text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>15 Members</Typography>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-user text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>15 Members</Typography>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-user text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>15 Members</Typography>
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CardContent className='flex items-center justify-center bs-full bg-actionHover'>
            <div className='flex flex-col items-center justify-center gap-2 is-full'>
              <div className='is-full bs-[300px] relative rounded overflow-hidden'>
                <MapPicker latitude={data.latitude ?? -6.2088} longitude={data.longitude ?? 106.8456} />
              </div>
              <Button variant='contained' className='mbs-5'>
                Contact Now
              </Button>
            </div>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  )
}

export default InformationAset
