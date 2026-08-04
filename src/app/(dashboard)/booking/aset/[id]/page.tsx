import BookingAsetDetailView from '@/src/views/apps/booking/aset/detail'

interface PageProps {
  params: Promise<{ id: string }>
}

const BookingAsetDetailPage = async ({ params }: PageProps) => {
  const { id } = await params

  return <BookingAsetDetailView bookingId={id} />
}

export default BookingAsetDetailPage
