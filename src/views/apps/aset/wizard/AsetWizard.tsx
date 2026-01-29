'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import { styled } from '@mui/material/styles'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stepper from '@mui/material/Stepper'
import MuiStep from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Typography from '@mui/material/Typography'
import type { StepProps } from '@mui/material/Step'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import StepAsetDetails from './StepAsetDetails'
import StepRuanganDetails from './StepRuanganDetails'

// Styled Component Imports
import StepperWrapper from '@core/styles/stepper'

// Vars
const steps = [
  {
    icon: 'tabler-building',
    title: 'Aset',
    subtitle: 'Informasi Aset'
  },
  {
    icon: 'tabler-door',
    title: 'Ruangan',
    subtitle: 'Informasi Ruangan'
  }
]

const Step = styled(MuiStep)<StepProps>({
  '&.Mui-completed .step-title , &.Mui-completed .step-subtitle': {
    color: 'var(--mui-palette-text-disabled)'
  }
})

import { apiFetchClient } from '@/src/utils/apiFetchClient'

type Props = {
  mode?: 'create' | 'edit'
  initialData?: AsetData
}

type AsetData = {
  id?: string
  jenis: string
  nama: string
  alamat: string
  kota: string
  provinsi: string
  latitude?: number
  longitude?: number
  status: string
}

type RuanganData = {
  nama: string
  status: string
  nominal: number
  hargaHarian: number
  hargaBulanan: number
  hargaTahunan: number
}

const AsetWizard = ({ mode = 'create', initialData }: Props) => {
  // States
  const [activeStep, setActiveStep] = useState<number>(0)
  const [asetId, setAsetId] = useState<string | null>(initialData?.id || null)

  const handleNext = () => {
    setActiveStep(prev => prev + 1)
  }

  const handlePrev = () => {
    if (activeStep !== 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const handleCreateOrUpdateAset = async (data: AsetData, files: File[]) => {
    try {
      let targetAsetId = asetId

      if (asetId) {
        // Update existing Aset
        console.log('Updating existing aset:', asetId, data)

        const res = await apiFetchClient<{ data: any }>(`/api/aset/${asetId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        })

        console.log('Update response:', res)

        if (!res.data) throw new Error('Failed to update aset')
      } else {
        // Create new Aset
        console.log('Creating new aset:', data)

        const res = await apiFetchClient<{ data: any }>('/api/aset', {
          method: 'POST',
          body: JSON.stringify(data)
        })

        console.log('Create response:', res)

        if (res.data) {
          targetAsetId = res.data.id
          setAsetId(res.data.id)
        } else {
          throw new Error('Failed to create aset: No data returned')
        }
      }

      // Handle Image Upload if files exist
      if (files.length > 0 && targetAsetId) {
        console.log('Uploading images for aset:', targetAsetId)
        const formData = new FormData()

        files.forEach(file => {
          formData.append('files', file)
        })

        const token = localStorage.getItem('accessToken')

        const uploadRes = await fetch(`/api/aset/${targetAsetId}/images`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: formData
        })

        console.log('Upload response status:', uploadRes.status)

        if (!uploadRes.ok) {
          const errText = await uploadRes.text()

          console.error('Upload failed:', errText)
          throw new Error(`Image upload failed: ${uploadRes.status} ${uploadRes.statusText}`)
        }
      }

      handleNext()
    } catch (error) {
      console.error('Error saving aset details:', error)

      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }

      alert(`Gagal menyimpan aset: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCreateRuangan = async (data: RuanganData) => {
    if (!asetId) {
      alert('Aset belum dibuat!')

      return
    }

    try {
      const res = await apiFetchClient('/ruangan', {
        method: 'POST',
        body: JSON.stringify({ ...data, asetId })
      })

      if (res) {
        alert('Ruangan berhasil ditambahkan!')

        // Optional: Redirect or reset
      }
    } catch (error) {
      console.error('Error saving ruangan:', error)
      alert('Gagal menyimpan ruangan.')
    }
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <StepAsetDetails
            activeStep={step}
            handleNext={handleNext} // Passed only for back-button or manual override if needed, but logical next is handled in onSave
            handlePrev={handlePrev}
            steps={steps}
            onSave={handleCreateOrUpdateAset}
            initialData={initialData}
          />
        )
      case 1:
        return (
          <StepRuanganDetails
            activeStep={step}
            handleNext={handleNext}
            handlePrev={handlePrev}
            steps={steps}
            onSave={handleCreateRuangan}
            asetId={asetId}
          />
        )
      default:
        return null
    }
  }

  return (
    <Card className='flex flex-col lg:flex-row'>
      <CardContent className='max-lg:border-be lg:border-ie lg:min-is-[300px]'>
        <StepperWrapper>
          <Stepper
            activeStep={activeStep}
            orientation='vertical'
            connector={<></>}
            className='flex flex-col gap-4 min-is-[220px]'
          >
            {steps.map((label, index) => {
              return (
                <Step key={index} onClick={() => setActiveStep(index)}>
                  <StepLabel icon={<></>} className='p-1 cursor-pointer'>
                    <div className='step-label'>
                      <CustomAvatar
                        variant='rounded'
                        skin={activeStep === index ? 'filled' : 'light'}
                        {...(activeStep >= index && { color: 'primary' })}
                        {...(activeStep === index && { className: 'shadow-primarySm' })}
                        size={38}
                      >
                        <i className={classnames(label.icon as string, '!text-[22px]')} />
                      </CustomAvatar>
                      <div className='flex flex-col'>
                        <Typography color='text.primary' className='step-title'>
                          {label.title}
                        </Typography>
                        <Typography className='step-subtitle'>{label.subtitle}</Typography>
                      </div>
                    </div>
                  </StepLabel>
                </Step>
              )
            })}
          </Stepper>
        </StepperWrapper>
      </CardContent>

      <CardContent className='flex-1 pbs-6'>{getStepContent(activeStep)}</CardContent>
    </Card>
  )
}

export default AsetWizard
