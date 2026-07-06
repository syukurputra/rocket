export async function downloadPdfFromApi(url: string, filename: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store'
  })

  if (!response.ok) {
    let msg = `Gagal generate PDF (${response.status})`

    try {
      const json = await response.json()

      if (json.message) msg = json.message
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  const blob = await response.blob()
  const objUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = objUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objUrl)
}
