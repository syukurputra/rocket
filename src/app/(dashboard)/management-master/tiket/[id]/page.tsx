import TiketDetailView from '@/src/views/apps/tiket/TiketDetailView'

interface PageProps {
  params: Promise<{ id: string }>
}

const TiketManagementDetailPage = async ({ params }: PageProps) => {
  const { id } = await params

  return <TiketDetailView tiketId={id} mode='cs' />
}

export default TiketManagementDetailPage
