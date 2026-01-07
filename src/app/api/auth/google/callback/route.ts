import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { signAccessToken, signRefreshToken } from '@/src/libs/jwt'
import { setSessionCookies } from '@/src/libs/session'
import { generateRandomString } from '@/src/libs/auth-helpers' // Assuming this exists or I'll generic

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL('/id/login?error=GoogleAuthFailed', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/id/login?error=NoCode', request.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Google OAuth Config')
      return NextResponse.redirect(new URL('/id/login?error=ServerConfig', request.url))
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Google Token Error:', tokenData)
      return NextResponse.redirect(new URL('/id/login?error=GoogleTokenFailed', request.url))
    }

    // Get User Info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      console.error('Google User Info Error:', userData)
      return NextResponse.redirect(new URL('/id/login?error=GoogleUserInfoFailed', request.url))
    }

    const { email, name, id: googleId } = userData

    // Check user in DB
    let user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, company: true } // Include relations for consistency with login
    })

    if (!user) {
      // Create new user (Passwordless)
      // We need a unique username. Using email part or random string.
      let username = email.split('@')[0]
      // Check if username taken
      const existingUsername = await prisma.user.findUnique({ where: { username } })
      if (existingUsername) {
        username = `${username}_${Math.floor(Math.random() * 1000)}`
      }

      user = await prisma.user.create({
        data: {
          email,
          username,
          password: null, // Passwordless
          verifikasi: true, // Email from Google is verified
          status: true,
          tokenVersion: 0
        },
        include: { role: true, company: true }
      })
    } else {
      // If user exists but verify is false, we can verify them because they logged in with Google (verified email)
      if (!user.verifikasi) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { verifikasi: true },
          include: { role: true, company: true }
        })
      }
    }

    const accessToken = signAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    const refreshToken = signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion || 0
    })

    const res = NextResponse.redirect(new URL('/id/home', request.url))
    setSessionCookies(res, { accessToken, refreshToken })

    return res
  } catch (error) {
    console.error('Google Auth Error:', error)
    return NextResponse.redirect(new URL('/id/login?error=InternalError', request.url))
  }
}
