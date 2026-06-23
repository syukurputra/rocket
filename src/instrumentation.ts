export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) })
      const { ip } = await res.json()
      console.log('='.repeat(60))
      console.log(`[Server] Outgoing IP: ${ip}`)
      console.log(`[Server] Daftarkan IP ini di iPaymu whitelist`)
      console.log('='.repeat(60))
    } catch {
      console.warn('[Server] Gagal mendapatkan outgoing IP — pastikan server bisa akses internet')
    }
  }
}
