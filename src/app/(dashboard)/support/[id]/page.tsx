import TiketDetailView from '@/src/views/apps/tiket/TiketDetailView'

interface PageProps {
  params: Promise<{ id: string }>
}

const SupportDetailPage = async ({ params }: PageProps) => {
  const { id } = await params

  return <TiketDetailView tiketId={id} mode='user' />
}

export default SupportDetailPage
