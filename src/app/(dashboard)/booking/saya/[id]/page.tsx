import BookingDetailView from '@/src/views/apps/booking/detail'

interface PageProps {
  params: Promise<{ id: string }>
}

const BookingDetailPage = async ({ params }: PageProps) => {
  const { id } = await params

  return <BookingDetailView bookingId={id} />
}

export default BookingDetailPage
