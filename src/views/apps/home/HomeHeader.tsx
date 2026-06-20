'use client'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomIconButton from '@core/components/mui/IconButton'
import CustomTextField from '@core/components/mui/TextField'

type Props = {
  searchValue: string
  setSearchValue: (value: string) => void
}

const HomeHeader = (props: Props) => {
  const { searchValue, setSearchValue } = props

  return (
    <Card>
      <div className='flex flex-col items-center gap-4 pli-8 plb-10'>
        <Typography variant='h4' className='text-center'>
          Temukan Aset Sewa Terbaik.{' '}
          <span className='text-primary'>Semua dalam satu tempat.</span>
        </Typography>
        <Typography className='text-center max-is-[600px]'>
          Jelajahi berbagai pilihan aset sewa yang tersedia. Temukan properti, kendaraan, peralatan, atau barang
          sewaan lainnya yang sesuai dengan kebutuhan Anda.
        </Typography>
        <div className='flex items-center gap-3 is-full max-is-[640px]'>
          <CustomTextField
            placeholder='Cari aset sewa...'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className='flex-1'
          />
          <CustomIconButton variant='contained' color='primary'>
            <i className='tabler-search' />
          </CustomIconButton>
        </div>
      </div>
    </Card>
  )
}

export default HomeHeader
