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

const PublishPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  const data = await prisma.aset.findUnique({
    where: {
      id
    },
    include: {
      images: true,
      fasilitasAset: {
        include: {
          icon: true
        }
      },
      ruangan: {
        include: {
          images: true,
          fasilitasRuangan: {
            include: {
              icon: true
            }
          },
          hargaItemAset: {
            orderBy: { harga: 'asc' }
          }
        }
      }
    }
  })

  if (!data || data.status !== 'publish') {
    notFound()
  }

  // Transform Decimal to number for serialization
  const sanitizedData = {
    ...data,
    nominal: Number(data.nominal),
    ruangan: data.ruangan.map(r => ({
      ...r,
      hargaItemAset: r.hargaItemAset.map(h => ({ ...h, harga: Number(h.harga) }))
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
          <Grid key={ruangan.id} size={{ xs: 12 }}>
            <InformationRuangan data={ruangan as any} />
          </Grid>
        ))}
      </Grid>
    </div>
  )
}

export default PublishPage
