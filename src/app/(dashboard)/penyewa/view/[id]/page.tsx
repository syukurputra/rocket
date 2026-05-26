import Grid from '@mui/material/Grid2'
import ViewPenyewaList from '@views/apps/penyewa/view'

interface PageProps {
  params: Promise<{
    id: string
    lang: string
  }>
}

const ViewPenyewaApp = async ({ params }: PageProps) => {
  const { id, lang } = await params

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <ViewPenyewaList penyewaId={id} />
      </Grid>
    </Grid>
  )
}

export default ViewPenyewaApp
