import Grid from '@mui/material/Grid2'

import AsetList from '@views/apps/aset/list'

import { getAsetData } from '@/src/app/server/actions'

import type { AsetClient } from '@/src/types/apps/asetTypes'
import { apiFetchServer } from '@/src/utils/apiFetchServer'

const AsetApp = async () => {

  const qs = new URLSearchParams({
    page: String(1),
    limit: String(10)
  })

  const { data } = await apiFetchServer<{data: AsetClient[] }>(`/api/aset?${qs.toString()}`, undefined, {
    redirectOn401: '/id/login'
  })

  // const data = await getAsetData({ page: 1, limit: 10 })

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <AsetList asetData={data ?? []} />
      </Grid>
    </Grid>
  )
}

export default AsetApp
