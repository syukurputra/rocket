// Next Imports
import { notFound } from 'next/navigation'

import classnames from 'classnames'

// Component Imports
import UlasanSemua from '@/src/views/front-pages/publish/UlasanSemua'

// Lib Imports
import prisma from '@/src/libs/prisma'

// Style Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

const UlasanPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  // Coba publishId (slug) dulu, fallback ke id DB — sama seperti halaman aset
  const bySlug = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM aset WHERE "publishId" = ${id}`
  const resolvedId = bySlug.length > 0 ? bySlug[0].id : id

  const aset = await prisma.aset.findUnique({
    where: { id: resolvedId },
    select: { id: true, nama: true, status: true }
  })

  if (!aset || aset.status !== 'publish') {
    notFound()
  }

  return (
    <div className={classnames(frontCommonStyles.layoutSpacing, 'plb-[20px]')}>
      <UlasanSemua asetId={aset.id} asetNama={aset.nama} kembaliHref={`/publish/${id}`} />
    </div>
  )
}

export default UlasanPage
