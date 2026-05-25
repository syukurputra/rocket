// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid2'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
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
            <Typography color='text.secondary'>{data.deskripsi || 'Tidak ada deskripsi'}</Typography>
            <Divider className='mbs-7 mbe-7' />
            <Typography variant='h5' className='mbe-2'>
              Alamat Lengkap
            </Typography>
            <Typography color='text.secondary'>
              {data.alamat}, {data.kota}, {data.provinsi}
            </Typography>
            <Divider className='mbs-7 mbe-7' />
            <Typography variant='h5' className='mbe-2'>
              Fasilitas
            </Typography>
            <Grid container spacing={4}>
              {data.fasilitasAset && data.fasilitasAset.length > 0 ? (
                data.fasilitasAset.map((fasilitas: any) => (
                  <Grid key={fasilitas.id}>
                    <Chip
                      color='success'
                      size='small'
                      variant='tonal'
                      icon={<i className={fasilitas.icon?.code || 'tabler-circle'} />}
                      label={fasilitas.nama}
                    />
                  </Grid>
                ))
              ) : (
                <Grid size={{ xs: 12 }}>
                  <Typography color='text.secondary'>Tidak ada fasilitas</Typography>
                </Grid>
              )}
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
                Hubungi Sekarang
              </Button>
            </div>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  )
}

export default InformationAset
