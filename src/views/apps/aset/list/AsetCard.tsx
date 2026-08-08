'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

// Utils
import { apiFetchClient } from '@/src/utils/apiFetchClient'

interface SummaryData {
  totalAset: number
  totalItem: number
  totalItemAktif: number
  totalItemNonAktif: number
}

const AsetCard = () => {
  // State
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  // Fetch summary data
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        const result = await apiFetchClient<{ data: SummaryData; message?: string }>('/api/aset/summary')

        if (result && result.data) {
          setSummary(result.data)
        }
      } catch (error) {
        console.error('Error fetching asset summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  // Data array with dynamic values
  const data = summary
    ? [
        {
          title: summary.totalAset,
          subtitle: 'Aset',
          icon: 'tabler-building',
          color: 'primary.main'
        },
        {
          title: summary.totalItem,
          subtitle: 'Item Aset',
          icon: 'tabler-door',
          color: 'info.main'
        },
        {
          title: summary.totalItemAktif,
          subtitle: 'Item Aset Aktif',
          icon: 'tabler-circle-check',
          color: 'success.main'
        },
        {
          title: summary.totalItemNonAktif,
          subtitle: 'Item Aset Non Aktif',
          icon: 'tabler-circle-x',
          color: 'error.main'
        }
      ]
    : []

  if (loading) {
    return (
      <Card>
        <CardContent className='flex justify-center items-center' style={{ minHeight: '150px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={6}>
          {data.map((item, index) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
              key={index}
              className={classnames({
                '[&:nth-of-type(odd)>div]:pie-6 [&:nth-of-type(odd)>div]:border-ie':
                  isBelowMdScreen && !isBelowSmScreen,
                '[&:not(:last-child)>div]:pie-6 [&:not(:last-child)>div]:border-ie': !isBelowMdScreen
              })}
            >
              <div className='flex justify-between items-center'>
                <div className='flex flex-col'>
                  <Typography variant='h4'>{item.title}</Typography>
                  <Typography>{item.subtitle}</Typography>
                </div>
                <Avatar variant='rounded' className='is-[42px] bs-[42px]'>
                  <i className={classnames(item.icon, 'text-[26px]')} />
                </Avatar>
              </div>
              {isBelowMdScreen && !isBelowSmScreen && index < data.length - 2 && (
                <Divider
                  className={classnames('mbs-6', {
                    'mie-6': index % 2 === 0
                  })}
                />
              )}
              {isBelowSmScreen && index < data.length - 1 && <Divider className='mbs-6' />}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default AsetCard


