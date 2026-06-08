import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { verifyAccessToken } from '@/src/libs/jwt'
import { extractTokenFromRequest, getAccessTokenFromCookies } from '@/src/libs/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const token =
      extractTokenFromRequest(req) ||
      getAccessTokenFromCookies(req)

    if (!token) {
      return NextResponse.json({ message: 'Access token required' }, { status: 401 })
    }

    let payload: { userId: string }
    try {
      payload = verifyAccessToken(token) as { userId: string }
    } catch {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        nomorTelepon: true,
        nomorKtp: true,
        alamat: true,
        provinsi: true,
        kota: true,
        kecamatan: true,
        kelurahan: true,
        latitude: true,
        longitude: true
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('Get user profile error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token =
      extractTokenFromRequest(req) ||
      getAccessTokenFromCookies(req)

    if (!token) {
      return NextResponse.json({ message: 'Access token required' }, { status: 401 })
    }

    let payload: { userId: string }
    try {
      payload = verifyAccessToken(token) as { userId: string }
    } catch {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 })
    }

    const data = await req.json()
    const {
      username,
      email,
      nomorTelepon,
      nomorKtp,
      alamat,
      provinsi,
      kota,
      kecamatan,
      kelurahan,
      latitude,
      longitude
    } = data

    // Optional: add validation here

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        username,
        email,
        nomorTelepon,
        nomorKtp,
        alamat,
        provinsi,
        kota,
        kecamatan,
        kelurahan,
        latitude,
        longitude
      },
      select: {
        id: true,
        username: true,
        email: true,
        nomorTelepon: true,
        nomorKtp: true,
        alamat: true,
        provinsi: true,
        kota: true,
        kecamatan: true,
        kelurahan: true,
        latitude: true,
        longitude: true
      }
    })

    return NextResponse.json({ user, message: 'Profile updated successfully' })
  } catch (err) {
    console.error('Update user profile error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
