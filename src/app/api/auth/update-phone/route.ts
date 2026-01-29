import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import jwt from 'jsonwebtoken'

import prisma from '@/src/libs/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { nomorTelepon } = await request.json()

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify token
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    // Validate phone number
    if (!nomorTelepon) {
      return NextResponse.json({ message: 'Nomor telepon wajib diisi' }, { status: 400 })
    }

    // Check Indonesian phone format
    const phoneRegex = /^(\+62|62|08)[0-9]{8,12}$/

    if (!phoneRegex.test(nomorTelepon)) {
      return NextResponse.json(
        { message: 'Format nomor telepon tidak valid. Gunakan format +62 atau 08' },
        { status: 400 }
      )
    }

    // Update user's phone number
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { nomorTelepon }
    })

    return NextResponse.json(
      {
        message: 'Nomor telepon berhasil disimpan',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          nomorTelepon: updatedUser.nomorTelepon
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update phone error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
