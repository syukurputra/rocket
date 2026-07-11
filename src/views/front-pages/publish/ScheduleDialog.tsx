'use client'

import { useState, useEffect, useRef } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'

import AppFullCalendar from '@/src/libs/styles/AppFullCalendar'

interface ScheduleDialogProps {
  open: boolean
  onClose: () => void
  itemAsetId: string
  itemAsetNama: string
}

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

// Semua event di schedule public ditampilkan merah
const toCalendarEvent = (e: KalenderEvent) => ({
  ...e,
  title: 'Booking',
  classNames: ['event-bg-error'],
  extendedProps: { ...e.extendedProps, color: 'error' }
})

const ScheduleDialog = ({ open, onClose, itemAsetId, itemAsetNama }: ScheduleDialogProps) => {
  const [events, setEvents] = useState<KalenderEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null)
  const calendarRef = useRef<any>(null)

  useEffect(() => {
    if (open && itemAsetId) {
      fetchEvents()
    }
  }, [open, itemAsetId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/public/kalender?ruanganId=${itemAsetId}`)
      const result = await res.json()

      setEvents(result.data || [])
    } catch (err) {
      console.error('Failed to fetch schedule:', err)
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

  const calendarEvents = events.map(toCalendarEvent)

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
        <DialogTitle>
          <Box display='flex' alignItems='center' justifyContent='space-between'>
            <Box>
              <Typography variant='h5'>Jadwal Booking</Typography>
              <Typography variant='body2' color='text.secondary'>{itemAsetNama}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <i className='tabler-x' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {loading ? (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
              <CircularProgress />
            </Box>
          ) : (
            <AppFullCalendar sx={{ width: '100%' }}>
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
            </AppFullCalendar>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant='tonal' color='secondary'>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Event Dialog */}
      <Dialog open={!!selectedEvent} onClose={() => setSelectedEvent(null)} maxWidth='xs' fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>
              <Typography variant='h6'>Detail Booking</Typography>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>Mulai Sewa</Typography>
                    <Typography variant='body2'>{formatDate(selectedEvent.start)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>Selesai Sewa</Typography>
                    <Typography variant='body2'>{formatDate(selectedEvent.end)}</Typography>
                  </Box>
                </Box>
                {selectedEvent.extendedProps.periodeSewa && (
                  <Chip
                    size='small'
                    label={selectedEvent.extendedProps.periodeSewa}
                    color='info'
                    variant='outlined'
                    sx={{ alignSelf: 'flex-start' }}
                  />
                )}
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

export default ScheduleDialog
