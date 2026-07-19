import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bantusewa.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Blokir area privat & non-konten dari crawling
      disallow: [
        '/api/',
        '/home',
        '/dashboard',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/auth-success',
        '/verifikasi-berhasil',
        '/verifikasi-gagal',
        '/invitation',
        '/my-profile',
        '/aset',
        '/keuangan',
        '/penyewa',
        '/booking',
        '/kalender',
        '/chat',
        '/paket',
        '/tarik-saldo',
        '/setting',
        '/notifikasi',
        '/management-master',
        '/payment'
      ]
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  }
}
