import { NextRequest, NextResponse } from "next/server";
import { signAccessToken, signRefreshToken } from '@/src/libs/jwt';
import { setSessionCookies } from '@/src/libs/session';
import bcrypt from "bcryptjs";
import prisma from "@/src/libs/prisma";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

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
        { message: 'Username / password salah' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Username / password salah' },
        { status: 401 }
      )
    }

    if (!user.verifikasi) {
      return NextResponse.json(
        { message: 'Mohon lakukan verifikasi email terlebih dahulu' },
        { status: 401 }
      )
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

    const res = NextResponse.json(
      {
        message: 'Login berhasil',
        user: { id: user.id, username: user.username, email: user.email },
        accessToken,
        refreshToken,
      },
      { status: 200 }
    )

    setSessionCookies(res, { accessToken, refreshToken })
    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
