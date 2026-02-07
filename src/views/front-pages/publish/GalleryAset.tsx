'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Third-party Imports
import { useKeenSlider } from 'keen-slider/react'
import type { KeenSliderPlugin } from 'keen-slider/react'

// Component Imports
import AppKeenSlider from '@/src/libs/styles/AppKeenSlider'

function ThumbnailPlugin(mainRef: any): KeenSliderPlugin {
  return slider => {
    function removeActive() {
      slider.slides.forEach(slide => {
        slide.classList.remove('active')
      })
    }

    function addActive(idx: number) {
      slider.slides[idx].classList.add('active')
    }

    function addClickEvents() {
      slider.slides.forEach((slide, idx) => {
        slide.addEventListener('click', () => {
          if (mainRef.current) mainRef.current.moveToIdx(idx)
        })
      })
    }

    slider.on('created', () => {
      if (!mainRef.current) return
      addActive(slider.track.details.rel)
      addClickEvents()
      mainRef.current.on('animationStarted', (main: any) => {
        removeActive()
        const next = main.animator.targetIdx || 0

        addActive(main.track.absToRel(next))
        slider.moveToIdx(Math.min(slider.track.details.maxIdx, next))
      })
    })
  }
}

interface GalleryAsetProps {
  data: string[]
}

const GalleryAset = ({ data }: GalleryAsetProps) => {
  // Hooks
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0
  })

  const [thumbnailRef] = useKeenSlider<HTMLDivElement>(
    {
      initial: 0,
      slides: {
        perView: 4,
        spacing: 10
      }
    },
    [ThumbnailPlugin(instanceRef)]
  )

  return (
    <Card>
      <CardContent>
        <div className='flex flex-col gap-6'>
          <AppKeenSlider>
            <Box className='navigation-wrapper'>
              <div ref={sliderRef} className='keen-slider'>
                {data.map((src, idx) => (
                  <div key={idx} className='keen-slider__slide'>
                    <img src={src} alt={`gallery-${idx}`} className='is-full object-contain rounded' />
                  </div>
                ))}
              </div>
            </Box>

            <div ref={thumbnailRef} className='keen-slider thumbnail mbs-4'>
              {data.map((src, idx) => (
                <div key={idx} className='keen-slider__slide cursor-pointer'>
                  <img src={src} alt={`thumb-${idx}`} className='object-contain bs-[100px] rounded bg-actionHover' />
                </div>
              ))}
            </div>
          </AppKeenSlider>
        </div>
      </CardContent>
    </Card>
  )
}

export default GalleryAset
