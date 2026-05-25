import Grid from '@mui/material/Grid2'
import ViewPenghuniList from '@views/apps/penghuni/view'

interface PageProps {
  params: Promise<{
    id: string
    lang: string
  }>
}

const ViewPenghuniApp = async ({ params }: PageProps) => {
  const { id, lang } = await params

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <ViewPenghuniList penghuniId={id} />
      </Grid>
    </Grid>
  )
}

export default ViewPenghuniApp
