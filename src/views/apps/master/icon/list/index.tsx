import Grid from '@mui/material/Grid2'

import type { IconClient } from '@/src/types/apps/iconTypes'

import IconListTable from '@views/apps/master/icon/list/IconListTable'

interface IconListProps {
  initialData?: IconClient[]
}

const MasterIconList = ({ initialData }: IconListProps) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <IconListTable initialData={initialData} />
      </Grid>
    </Grid>
  )
}

export default MasterIconList


