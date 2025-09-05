import VerifikasiGagal from '@views/apps/verifikasi-gagal/VerifikasiGagal'

import { getServerMode } from '@core/utils/serverHelpers'

const VerifikasiPage = async () => {
  const mode = await getServerMode()

  return <VerifikasiGagal mode={mode} />
}

export default VerifikasiPage
