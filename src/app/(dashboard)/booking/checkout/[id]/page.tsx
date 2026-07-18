import BookingCheckoutView from '@/src/views/apps/booking/checkout'

interface PageProps {
  params: Promise<{ id: string }>
}

const BookingCheckoutPage = async ({ params }: PageProps) => {
  const { id } = await params

  return <BookingCheckoutView itemId={id} />
}

export default BookingCheckoutPage
