// Next Imports
import { notFound } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'

import classnames from 'classnames'

// Component Imports
import GalleryAset from '@/src/views/front-pages/publish/GalleryAset'
import InformationAset from '@/src/views/front-pages/publish/InformationAset'
import InformationRuangan from '@/src/views/front-pages/publish/InformationRuangan'

// Lib Imports
import prisma from '@/src/libs/prisma'

// Style Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

const PublishPage = async ({ params }: { params: { id: string } }) => {
  const data = await prisma.aset.findUnique({
    where: {
      id: params.id
    },
    include: {
      images: true,
      ruangan: {
        include: {
          images: true
        }
      }
    }
  })

  if (!data) {
    notFound()
  }

  // Transform Decimal to number for serialization
  const sanitizedData = {
    ...data,
    nominal: Number(data.nominal),
    ruangan: data.ruangan.map(r => ({
      ...r,
      nominal: Number(r.nominal),
      hargaHarian: Number(r.hargaHarian),
      hargaBulanan: Number(r.hargaBulanan),
      hargaTahunan: Number(r.hargaTahunan)
    }))
  }

  return (
    <div className={classnames(frontCommonStyles.layoutSpacing, 'plb-[20px]')}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <GalleryAset data={data.images.map(img => img.filepath)} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <InformationAset data={sanitizedData as any} />
        </Grid>
        {sanitizedData.ruangan.map(ruangan => (
          <Grid key={ruangan.id} size={{ xs: 12, md: 6 }}>
            <InformationRuangan data={ruangan as any} />
          </Grid>
        ))}
      </Grid>
    </div>
  )
}

export default PublishPage
