import { NextRequest, NextResponse } from "next/server";
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt'
import { createSessionCookie, createRefreshTokenCookie } from "@/lib/session";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // const passwordEnc = await bcrypt.hash('Admin@123', 10)
    // await prisma.user.upsert({
    //   where: { email: 'admin@example.com' },
    //   update: {},
    //   create: {
    //     username: 'admin',
    //     email: 'admin@example.com',
    //     password: passwordEnc,
    //     tokenVersion: 0,
    //   },
    // })

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ]
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion || 0
    })

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      accessToken
    }, { status: 200 })

    createSessionCookie({
      userId: user.id,
      username: user.username,
      email: user.email,
      isLoggedIn: true,
      tokenVersion: user.tokenVersion || 0
    }, response)

    createRefreshTokenCookie(refreshToken, response)

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
