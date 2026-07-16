// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid2'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'

// Component Imports
import MapPicker from '@/src/components/MapPicker'
import CustomIconButton from '@core/components/mui/IconButton'
import SyaratKetentuanDialog from './SyaratKetentuanDialog'
import ChatKontakButton from './ChatKontakButton'

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
            {data.syaratKetentuan && (
              <>
                <Divider className='mbs-7 mbe-7' />
                <SyaratKetentuanDialog syaratKetentuan={data.syaratKetentuan} />
              </>
            )}
          </CardContent>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CardContent className='flex items-center justify-center bs-full bg-actionHover'>
            <div className='flex flex-col items-center justify-center gap-2 is-full'>
              <div className='is-full bs-[300px] relative rounded overflow-hidden'>
                <MapPicker latitude={data.latitude ?? -6.2088} longitude={data.longitude ?? 106.8456} />
              </div>
              <div className='flex flex-col items-center gap-3 mbs-5'>
                <Typography variant='h6' className='font-medium'>Kontak Kami</Typography>
                <div className='flex gap-4'>
                  {data.companyId && <ChatKontakButton companyId={data.companyId} asetId={data.id} />}
                  {data.nomorWaAktif && data.nomorWa && (
                    <Tooltip title='WhatsApp'>
                      <CustomIconButton
                        size='large'
                        variant='contained'
                        href={`https://wa.me/${data.nomorWa.replace(/\D/g, '')}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        sx={{ bgcolor: 'white', color: '#25D366', boxShadow: 4, fontSize: '22px !important', p: '10px !important', '&:hover': { bgcolor: '#f5f5f5', color: '#25D366' } }}
                      >
                        <i className='tabler-brand-whatsapp' />
                      </CustomIconButton>
                    </Tooltip>
                  )}
                  {data.instagramAktif && data.instagram && (
                    <Tooltip title='Instagram'>
                      <CustomIconButton
                        size='large'
                        variant='contained'
                        href={`https://instagram.com/${data.instagram.replace(/^@/, '')}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        sx={{ bgcolor: 'white', color: '#E1306C', boxShadow: 4, fontSize: '22px !important', p: '10px !important', '&:hover': { bgcolor: '#f5f5f5', color: '#E1306C' } }}
                      >
                        <i className='tabler-brand-instagram' />
                      </CustomIconButton>
                    </Tooltip>
                  )}
                  {data.facebookAktif && data.facebook && (
                    <Tooltip title='Facebook'>
                      <CustomIconButton
                        size='large'
                        variant='contained'
                        href={`https://facebook.com/${data.facebook}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        sx={{ bgcolor: 'white', color: '#1877F2', boxShadow: 4, fontSize: '22px !important', p: '10px !important', '&:hover': { bgcolor: '#f5f5f5', color: '#1877F2' } }}
                      >
                        <i className='tabler-brand-facebook' />
                      </CustomIconButton>
                    </Tooltip>
                  )}
                  {!data.companyId && !data.nomorWaAktif && !data.instagramAktif && !data.facebookAktif && (
                    <Typography variant='caption' color='text.secondary'>Tidak ada kontak tersedia</Typography>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  )
}

export default InformationAset
