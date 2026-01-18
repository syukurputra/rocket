import crypto from 'crypto'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { sendInvitationEmail } from '@/src/libs/email'

// POST /api/user/invite - Invite new user via email
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { email, roleId } = body

    // Validation
    if (!email || !roleId) {
      return NextResponse.json({ message: 'Email and role are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
    }

    // Check if user's company has a paket
    if (!user.companyId) {
      return NextResponse.json({ message: 'User not assigned to any company' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 })
    }

    // Get role and company info
    const [role, company] = await Promise.all([
      prisma.role.findUnique({
        where: { id: roleId },
        select: { id: true, nama: true, companyId: true }
      }),
      prisma.company.findUnique({
        where: { id: user.companyId },
        select: { id: true, nama: true }
      })
    ])

    if (!role) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 })
    }

    if (!company) {
      return NextResponse.json({ message: 'Company not found' }, { status: 404 })
    }

    // Verify role belongs to user's company
    if (role.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Role does not belong to your company' }, { status: 403 })
    }

    // Generate secure invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')

    // Set expiry to 7 days from now
    const invitationExpiry = new Date()

    invitationExpiry.setDate(invitationExpiry.getDate() + 7)

    // Create user with pending status
    const newUser = await prisma.user.create({
      data: {
        email,
        username: `pending_${Date.now()}`, // Temporary username
        password: crypto.randomBytes(32).toString('hex'), // Temporary password
        role: {
          connect: { id: roleId }
        },
        company: {
          connect: { id: user.companyId }
        },
        verifikasi: false,
        status: false, // Inactive until invitation is accepted
        invitationToken,
        invitationExpiry,
        invitedAt: new Date(),
        invitedBy: {
          connect: { id: user.id }
        }
      }
    })

    // Send invitation email
    try {
      await sendInvitationEmail(email, company.nama, role.nama, invitationToken)
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)

      // Delete the created user if email fails
      await prisma.user.delete({ where: { id: newUser.id } })

      return NextResponse.json(
        { message: 'Failed to send invitation email. Please check email configuration.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Invitation sent successfully',
        data: {
          id: newUser.id,
          email: newUser.email
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Invite user error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
