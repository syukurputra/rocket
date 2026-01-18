import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tagihanId = formData.get('tagihanId') as string
    const oldFilePath = formData.get('oldFilePath') as string

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
    }

    if (!tagihanId) {
      return NextResponse.json({ message: 'Tagihan ID is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Only JPG, PNG, and PDF are allowed' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    // Get file extension
    const extension = file.name.split('.').pop() || 'jpg'

    // Use tagihan ID as filename
    const filename = `${tagihanId}.${extension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to public/uploads/bukti-pembayaran
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'bukti-pembayaran')
    const filepath = join(uploadDir, filename)

    // Create directory if it doesn't exist
    const { mkdir, unlink } = await import('fs/promises')
    await mkdir(uploadDir, { recursive: true })

    // Delete old file if exists (different extension)
    if (oldFilePath) {
      try {
        const oldFullPath = join(process.cwd(), 'public', oldFilePath)
        await unlink(oldFullPath)
      } catch (error) {
        // Ignore if file doesn't exist
        console.log('Old file not found or already deleted')
      }
    }

    // Write file
    await writeFile(filepath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/bukti-pembayaran/${filename}`

    return NextResponse.json({
      message: 'File uploaded successfully',
      url: publicUrl,
      filename: filename
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ message: 'Failed to upload file' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
