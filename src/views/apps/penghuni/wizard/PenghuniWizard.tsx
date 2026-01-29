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
import StepPenghuniDetails from './StepPenghuniDetails'
import StepTagihanDetails from './StepTagihanDetails'

// Styled Component Imports
import StepperWrapper from '@core/styles/stepper'

// Vars
const steps = [
  {
    icon: 'tabler-building',
    title: 'Penghuni',
    subtitle: 'Informasi Penghuni'
  },
  {
    icon: 'tabler-door',
    title: 'Tagihan',
    subtitle: 'Informasi Tagihan'
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
  initialData?: PenghuniData
}

type PenghuniData = {
  id?: string
  nama: string
  status: string
  asetId?: string
  ruanganId?: string
  periodeSewa?: string
  mulaiHuni?: Date
  selesaiHuni?: Date
  email?: string
  nomorTelepon?: string
}

type TagihanData = {
  nama: string
  status: string
  nominal: number
  tanggalTagihan: Date
  jatuhTempo: Date
}

const PenghuniWizard = ({ mode = 'create', initialData }: Props) => {
  // States
  const [activeStep, setActiveStep] = useState<number>(0)
  const [penghuniId, setPenghuniId] = useState<string | null>(initialData?.id || null)

  const handleNext = () => {
    setActiveStep(prev => prev + 1)
  }

  const handlePrev = () => {
    if (activeStep !== 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const handleCreateOrUpdatePenghuni = async (data: PenghuniData) => {
    try {
      let targetId = penghuniId

      if (penghuniId && initialData?.id) {
        // Update existing Penghuni
        console.log('Updating existing penghuni:', penghuniId, data)

        const res = await apiFetchClient<{ data: any }>(`/api/penghuni/${penghuniId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        })

        console.log('Update response:', res)

        if (!res.data) throw new Error('Failed to update penghuni')
      } else {
        // Create new Penghuni
        console.log('Creating new penghuni:', data)

        // For Create, asetId derived from state might be empty initially,
        // but data.asetId should be populated from Step 1.
        // Actually, 'asetId' state variable in this Wizard seems to track the PENGHUNI ID (since it was copied from AsetWizard where it tracked Aset ID).
        // Let's assume setAsetId sets the Penghuni ID.

        const res = await apiFetchClient<{ data: any }>('/api/penghuni', {
          method: 'POST',
          body: JSON.stringify(data)
        })

        console.log('Create response:', res)

        if (res.data) {
          targetId = res.data.id
          setPenghuniId(res.data.id)
        } else {
          throw new Error('Failed to create penghuni: No data returned')
        }
      }

      handleNext()
    } catch (error) {
      console.error('Error saving penghuni details:', error)

      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }

      alert(`Gagal menyimpan penghuni: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCreateRuangan = async (data: TagihanData) => {
    if (!penghuniId) {
      alert('Penghuni belum dibuat!')

      return
    }

    try {
      const res = await apiFetchClient('/ruangan', {
        method: 'POST',
        body: JSON.stringify({ ...data, penghuniId })
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
          <StepPenghuniDetails
            activeStep={step}
            handleNext={handleNext} // Passed only for back-button or manual override if needed, but logical next is handled in onSave
            handlePrev={handlePrev}
            steps={steps}
            onSave={handleCreateOrUpdatePenghuni}
            initialData={initialData}
          />
        )
      case 1:
        return (
          <StepTagihanDetails
            activeStep={step}
            handleNext={handleNext}
            handlePrev={handlePrev}
            steps={steps}
            onSave={handleCreateRuangan}
            penghuniId={penghuniId}
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

export default PenghuniWizard
