import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { signAccessToken, signRefreshToken } from '@/src/libs/jwt'
import { setSessionCookies } from '@/src/libs/session'

// import { generateRandomString } from '@/src/libs/auth-helpers' // Unused

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL('/login?error=GoogleAuthFailed', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=NoCode', request.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Google OAuth Config')

      return NextResponse.redirect(new URL('/login?error=ServerConfig', request.url))
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

      return NextResponse.redirect(new URL('/login?error=GoogleTokenFailed', request.url))
    }

    // Get User Info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      console.error('Google User Info Error:', userData)

      return NextResponse.redirect(new URL('/login?error=GoogleUserInfoFailed', request.url))
    }

    const { email } = userData

    // Check user in DB
    let user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, company: true } // Include relations for consistency with login
    })

    if (!user) {
      // Create new user (Passwordless)
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
      const companyName = `Company-${randomSuffix}`

      // Create company for new user
      const defaultPaketId = 'cmkf1ia1e00005kf4wckr0x8x'

      const company = await prisma.company.create({
        data: {
          nama: companyName,
          status: true,
          paketId: defaultPaketId
        }
      })

      // Create default admin role for the company
      const adminRole = await prisma.role.create({
        data: {
          nama: 'Super Admin',
          deskripsi: 'Administrator with full access',
          status: true,
          companyId: company.id
        }
      })

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
          tokenVersion: 0,
          companyId: company.id,
          roleId: adminRole.id
        },
        include: { role: true, company: true }
      })

      // Assign menus based on paket
      try {
        const paketMenus = await prisma.paketMenu.findMany({
          where: { paketId: defaultPaketId }
        })

        if (paketMenus.length > 0) {
          await prisma.menuRole.createMany({
            data: paketMenus.map(pm => ({
              roleId: adminRole.id,
              menuId: pm.menuId
            }))
          })
        }
      } catch (menuError) {
        console.error('Error assigning menus:', menuError)

        // Continue execution, non-fatal
      }
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

    // Fetch user menus
    const userWithMenus = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: {
            menuRoles: {
              where: {
                menu: {
                  status: true
                }
              },
              include: {
                menu: true
              },
              orderBy: {
                menu: {
                  urutan: 'asc'
                }
              }
            }
          }
        }
      }
    })

    const menus =
      userWithMenus?.role?.menuRoles.map(mr => ({
        id: mr.menu.id,
        nama: mr.menu.nama,
        path: mr.menu.path,
        icon: mr.menu.icon,
        urutan: mr.menu.urutan,
        parentId: mr.menu.parentId
      })) || []

    // Create URL with tokens and menus as query params for client-side storage
    const authSuccessUrl = new URL('/auth-success', request.url)
    authSuccessUrl.searchParams.set('accessToken', accessToken)
    authSuccessUrl.searchParams.set('refreshToken', refreshToken)
    authSuccessUrl.searchParams.set('menus', JSON.stringify(menus))

    const res = NextResponse.redirect(authSuccessUrl)

    setSessionCookies(res, { accessToken, refreshToken })

    return res
  } catch (error) {
    console.error('Google Auth Error:', error)

    return NextResponse.redirect(new URL('/login?error=InternalError', request.url))
  }
}
