import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json({ message: 'Konfigurasi Google OAuth tidak ditemukan' }, { status: 500 })
  }

  const scope = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ].join(' ')

  // Encode semua param (scope & prompt mengandung spasi) — kalau tidak, query
  // rusak dan Google menolak dengan error.
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    access_type: 'offline',
    prompt: 'select_account consent'
  })

  const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return NextResponse.redirect(googleLoginUrl)
}
