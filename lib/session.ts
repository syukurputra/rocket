import { NextRequest, NextResponse } from 'next/server'

export interface SessionData {
  userId: string
  username: string
  email: string
  isLoggedIn: boolean
  tokenVersion?: number
}

// Simple session management using cookies
export function createSessionCookie(sessionData: SessionData, response: any) {
  const sessionString = JSON.stringify(sessionData)
  const maxAge = 60 * 60 * 24 * 7 // 7 days

  response.cookies?.set('session', sessionString, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/'
  })
}

export function createRefreshTokenCookie(refreshToken: string, response: any) {
  response.cookies?.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}
