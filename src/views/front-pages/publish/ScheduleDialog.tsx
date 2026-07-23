'use client'

import { useState, useEffect, useRef } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
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

  const calendarEvents = events.map(toCalendarEvent)

  return (
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
  )
}

export default ScheduleDialog
