import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    })

    if (user) {
      return NextResponse.json(
        { message: 'Username / email sudah terdaftar' },
        { status: 400 }
      )
    }

    const passwordEnc = await bcrypt.hash(password, 10)
    const userInsert = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: passwordEnc,
        tokenVersion: 0,
      },
    })

    const res = NextResponse.json(
      {
        message: 'Login successful',
        user: { id: userInsert.id, username: userInsert.username, email: userInsert.email },
      },
      { status: 200 }
    )

    return res
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
