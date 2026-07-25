import type { MetadataRoute } from 'next'

import prisma from '@/src/libs/prisma'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bantusewa.com'

// Halaman statis publik yang layak diindeks.
// CATATAN: /home dan halaman lain di grup (dashboard) SENGAJA tidak dimasukkan —
// halaman itu butuh login dan sudah diberi `robots: { index: false }` di
// src/app/(dashboard)/layout.tsx. Memasukkannya ke sitemap hanya akan membuat
// Google mencoba crawl lalu di-redirect ke /login.
const staticRoutes = [
  { path: '', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/term-condition', priority: 0.3, changeFrequency: 'yearly' as const }
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(r => ({
    url: `${siteUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority
  }))

  // Listing aset yang sudah publish (halaman publik /publish/[slug]).
  let asetEntries: MetadataRoute.Sitemap = []

  try {
    const asetList = await prisma.aset.findMany({
      where: { status: 'publish' },
      select: { id: true, publishId: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    })

    asetEntries = asetList.map(a => ({
      url: `${siteUrl}/publish/${a.publishId || a.id}`,
      lastModified: a.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))
  } catch (error) {
    console.error('Gagal memuat aset untuk sitemap:', error)
  }

  return [...staticEntries, ...asetEntries]
}
