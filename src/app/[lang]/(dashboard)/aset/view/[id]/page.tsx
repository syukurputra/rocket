import Grid from '@mui/material/Grid2'
import ViewAsetList from '@views/apps/aset/view'

interface PageProps {
  params: Promise<{
    id: string
    lang: string
  }>
}

const AsetApp = async ({ params }: PageProps) => {
  const { id, lang } = await params

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <ViewAsetList assetId={id} />
      </Grid>
    </Grid>
  )
}

export default AsetApp
