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
    <Card className='relative flex justify-center'>
      <img
        src='/images/illustrations/characters/1.png'
        className='max-md:hidden absolute max-is-[120px] top-8 start-12'
      />
      <div className='flex flex-col items-center gap-4 max-md:pli-5 plb-12 md:is-1/2'>
        <Typography variant='h4' className='text-center md:is-3/4'>
          Temukan Aset Sewa Terbaik.{' '}
          <span className='text-primary'>Semua dalam satu tempat.</span>
        </Typography>
        <Typography className='text-center'>
          Jelajahi berbagai pilihan aset sewa yang tersedia. Temukan properti, kendaraan, peralatan, atau barang
          sewaan lainnya yang sesuai dengan kebutuhan Anda.
        </Typography>
        <div className='flex items-center gap-4 max-sm:is-full'>
          <CustomTextField
            placeholder='Cari aset sewa...'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className='sm:is-[350px] max-sm:flex-1'
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
