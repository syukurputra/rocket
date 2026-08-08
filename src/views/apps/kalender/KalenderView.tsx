'use client'

import { useState, useEffect, useRef } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'

import AppFullCalendar from '@/src/libs/styles/AppFullCalendar'
import { apiFetchClient } from '@/src/utils/apiFetchClient'

type KalenderEvent = {
  id: string
  title: string
  start: string | Date
  end: string | Date
  allDay: boolean
  extendedProps: {
    color: string
    aset: string
    itemAset: string
    status: string
    periodeSewa: string

    /** Tanggal selesai sebenarnya — `event.end` dari FullCalendar bersifat eksklusif */
    selesaiSewa: string
  }
}

type SelectedEvent = KalenderEvent & { startStr: string; endStr: string }

const colorMap: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info'
}

const KalenderView = () => {
  const [events, setEvents] = useState<KalenderEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null)
  const calendarRef = useRef<any>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const result = await apiFetchClient<{ data: KalenderEvent[] }>('/api/kalender', undefined, {
        redirectOn401: '/login'
      })

      setEvents(result.data || [])
    } catch (err) {
      console.error('Failed to fetch kalender events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEventClick = ({ event }: any) => {
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      startStr: event.startStr,
      endStr: event.endStr,
      allDay: event.allDay,
      extendedProps: event.extendedProps
    })
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const calendarEvents = events.map(e => ({
    ...e,
    classNames: [`event-bg-${e.extendedProps.color}`]
  }))

  return (
    <>
      <Card className='is-full'>
        <CardContent sx={{ pb: '0 !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            <Chip size='small' label='Sedang Berjalan' color='success' variant='tonal' />
            <Chip size='small' label='Akan Datang' color='primary' variant='tonal' />
            <Chip size='small' label='Sudah Selesai' color='warning' variant='tonal' />
          </Box>
        </CardContent>

        {loading ? (
          <CardContent>
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='500px'>
              <CircularProgress />
            </Box>
          </CardContent>
        ) : (
          <AppFullCalendar sx={{ width: '100%' }}>
            <CardContent sx={{ p: 6, width: '100%' }}>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView='dayGridMonth'
                initialDate={new Date()}
                locale='id'
                buttonText={{
                  today: 'Hari Ini',
                  month: 'Bulan',
                  week: 'Minggu',
                  day: 'Hari',
                  list: 'Daftar'
                }}
                headerToolbar={{
                  start: 'prev,next today',
                  center: 'title',
                  end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                dayMaxEvents={3}
                navLinks
                height='auto'
                expandRows
                eventClassNames={({ event }: any) => [`event-bg-${event.extendedProps.color}`]}
              />
            </CardContent>
          </AppFullCalendar>
        )}
      </Card>

      {/* Detail Event Dialog */}
      <Dialog open={!!selectedEvent} onClose={() => setSelectedEvent(null)} maxWidth='xs' fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>
              <Typography variant='h6'>Detail Booking</Typography>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Nama Penyewa
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedEvent.title.split(' - ')[0]}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Item Aset
                  </Typography>
                  <Typography variant='body1'>{selectedEvent.extendedProps.itemAset || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Aset
                  </Typography>
                  <Typography variant='body1'>{selectedEvent.extendedProps.aset || '-'}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Mulai Sewa
                    </Typography>
                    <Typography variant='body2'>{formatDate(selectedEvent.start)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Selesai Sewa
                    </Typography>
                    <Typography variant='body2'>
                      {formatDate(selectedEvent.extendedProps.selesaiSewa)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    size='small'
                    label={selectedEvent.extendedProps.status}
                    color={colorMap[selectedEvent.extendedProps.color] ?? 'default'}
                    variant='tonal'
                  />
                  {selectedEvent.extendedProps.periodeSewa && (
                    <Chip
                      size='small'
                      label={selectedEvent.extendedProps.periodeSewa}
                      color='info'
                      variant='outlined'
                    />
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedEvent(null)} variant='tonal' color='secondary'>
                Tutup
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}

export default KalenderView
