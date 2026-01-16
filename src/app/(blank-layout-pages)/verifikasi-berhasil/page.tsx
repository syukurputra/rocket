import VerifikasiBerhasil from '@views/apps/verifikasi-berhasil/VerifikasiBerhasil'

import { getServerMode } from '@core/utils/serverHelpers'

const VerifikasiPage = async () => {
  const mode = await getServerMode()
  
  return <VerifikasiBerhasil mode={mode} />
}

export default VerifikasiPage