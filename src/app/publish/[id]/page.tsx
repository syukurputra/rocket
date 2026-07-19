// Next Imports
import { notFound } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'

import classnames from 'classnames'

// Component Imports
import GalleryAset from '@/src/views/front-pages/publish/GalleryAset'
import InformationAset from '@/src/views/front-pages/publish/InformationAset'
import InformationItemAset from '@/src/views/front-pages/publish/InformationItemAset'
import UlasanPanel from '@/src/views/front-pages/publish/UlasanPanel'

// Lib Imports
import prisma from '@/src/libs/prisma'
import { getParameter } from '@/src/libs/getParameter'

// Style Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

const includeOptions = {
  images: true,
  fasilitasAset: { include: { icon: true } },
  ruangan: {
    where: { status: 'aktif' },
    include: {
      images: true,
      fasilitasRuangan: { include: { icon: true } },
      hargaItemAset: { orderBy: { harga: 'asc' as const } }
    }
  }
}

const PublishPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  // Coba publishId (slug) dulu via raw SQL, fallback ke id DB
  const bySlug = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM aset WHERE "publishId" = ${id}`
  const resolvedId = bySlug.length > 0 ? bySlug[0].id : id

  const data = await prisma.aset.findUnique({ where: { id: resolvedId }, include: includeOptions })

  if (!data || data.status !== 'publish') {
    notFound()
  }

  // Ambil syaratKetentuan via raw SQL (column baru, Prisma Client belum di-regenerate)
  const syaratRows = await prisma.$queryRaw<{ syaratKetentuan: string | null }[]>`
    SELECT "syaratKetentuan" FROM aset WHERE id = ${resolvedId}
  `
  const syaratKetentuan = syaratRows[0]?.syaratKetentuan ?? null

  const adminBookingValue = await getParameter('ADMIN_BOOKING')
  const adminBooking = Number(adminBookingValue) || 0

  // Transform Decimal to number for serialization
  const sanitizedData = {
    ...data,
    syaratKetentuan,
    nominal: Number(data.nominal),
    ruangan: data.ruangan.map(r => ({
      ...r,
      hargaItemAset: r.hargaItemAset.map(h => ({ ...h, harga: Number(h.harga) }))
    }))
  }

  return (
    <div className={classnames(frontCommonStyles.layoutSpacing, 'plb-[20px]')}>
      <Grid container spacing={6}>
        {data.images.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <GalleryAset data={data.images.map(img => img.filepath)} />
          </Grid>
        )}
        <Grid size={{ xs: 12 }}>
          <InformationAset data={sanitizedData as any} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={6}>
            {/* Kiri: daftar item aset */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={6}>
                {sanitizedData.ruangan.map(ruangan => (
                  <Grid key={ruangan.id} size={{ xs: 12 }}>
                    <InformationItemAset data={ruangan as any} asetNama={sanitizedData.nama} adminBooking={adminBooking} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            {/* Kanan: panel ulasan (posisi normal, tidak sticky) */}
            <Grid size={{ xs: 12, md: 4 }}>
              <UlasanPanel asetId={resolvedId} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  )
}

export default PublishPage
