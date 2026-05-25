'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Third-party Imports
import { useKeenSlider } from 'keen-slider/react'

// Component Imports
import AppKeenSlider from '@/src/libs/styles/AppKeenSlider'

interface GalleryAsetProps {
  data: string[]
}

const GalleryAset = ({ data }: GalleryAsetProps) => {
  // Hooks
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0
  })


  return (
    <Card>
      <CardContent sx={{ pb: '16px !important' }}>
        <AppKeenSlider>
          <Box className='navigation-wrapper'>
            <div ref={sliderRef} className='keen-slider'>
              {data.map((src, idx) => (
                <div key={idx} className='keen-slider__slide'>
                  <img src={src} alt={`gallery-${idx}`} className='rounded' style={{ maxHeight: '60vh', width: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          </Box>

          <div className='flex justify-start flex-wrap gap-2 mbs-2'>
            {data.map((src, idx) => (
              <div
                key={idx}
                className='cursor-pointer'
                onClick={() => instanceRef.current?.moveToIdx(idx)}
              >
                <img src={src} alt={`thumb-${idx}`} className='object-cover rounded' style={{ height: 80, width: 120 }} />
              </div>
            ))}
          </div>
        </AppKeenSlider>
      </CardContent>
    </Card>
  )
}

export default GalleryAset
