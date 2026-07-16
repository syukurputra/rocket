import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'https://s3.nevaobjects.id'
const S3_BUCKET = process.env.S3_BUCKET || 'bantusewa'
const ALLOWED_PREFIX = `${S3_ENDPOINT.replace(/\/$/, '')}/${S3_BUCKET}/`

// GET /api/chat/download?url=<s3Url>&name=<filename>
// Proxy download agar file dari object storage terunduh (Content-Disposition: attachment),
// sekaligus menghindari batasan atribut download lintas-origin.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const name = searchParams.get('name') || 'file'

    if (!url) {
      return NextResponse.json({ message: 'URL wajib diisi' }, { status: 400 })
    }

    // Guard SSRF: hanya izinkan file dari bucket object storage kita
    if (!url.startsWith(ALLOWED_PREFIX)) {
      return NextResponse.json({ message: 'URL tidak diizinkan' }, { status: 400 })
    }

    const upstream = await fetch(url)

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ message: 'File tidak ditemukan' }, { status: 404 })
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const safeName = name.replace(/["\r\n]/g, '')

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control': 'private, max-age=0'
      }
    })
  } catch (error) {
    console.error('Chat download error:', error)

    return NextResponse.json({ message: 'Gagal mengunduh file' }, { status: 500 })
  }
}
