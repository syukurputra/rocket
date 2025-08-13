import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // const hashedPassword = await bcrypt.hash('12345678', 10)
    //
    // const user1 = await prisma.user.create({
    //   data: {
    //     username: 'super',
    //     email: 'super@example.com',
    //     password: hashedPassword,
    //   }
    // })

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ]
      }
    })

    console.log('User found:', user ? 'Yes' : 'No')

    if (!user) {
      console.log('No user found with username/email:', username)
      return NextResponse.json(
        { message: 'User not found' },
        { status: 401 }
      )
    } else {
      return NextResponse.json(
        { message: 'Login berhasil' },
        { status: 200 }
      )
    }

    // Rest of your code...
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
