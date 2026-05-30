import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3'

// S3-compatible client for NevaCloud Object Storage
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'https://s3.nevaobjects.id',
  region: process.env.S3_REGION || 'us-east-1', // NevaCloud uses default region
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || ''
  },
  forcePathStyle: true // Required for S3-compatible services like NevaCloud
})

const S3_BUCKET = process.env.S3_BUCKET || 'bantusewa'
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'https://s3.nevaobjects.id'

/**
 * Ensure the bucket exists, create it if it doesn't
 */
export async function ensureBucketExists(): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }))
  } catch (error: any) {
    // Bucket doesn't exist, create it
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404 || error.$metadata?.httpStatusCode === 403) {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }))
        console.log(`Bucket "${S3_BUCKET}" created successfully`)
      } catch (createError: any) {
        // BucketAlreadyOwnedByYou is fine
        if (createError.name !== 'BucketAlreadyOwnedByYou') {
          console.error('Error creating bucket:', createError)
          throw createError
        }
      }
    } else {
      console.error('Error checking bucket:', error)
      throw error
    }
  }
}

/**
 * Upload a file to S3-compatible storage
 * @param buffer - File buffer
 * @param key - S3 object key (path within the bucket)
 * @param contentType - MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await ensureBucketExists()

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read' // Make files publicly accessible
    })
  )

  // Return the public URL
  return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`
}

/**
 * Delete a file from S3-compatible storage
 * @param key - S3 object key (path within the bucket)
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key
    })
  )
}

/**
 * Extract the S3 object key from a full URL
 * e.g., "https://s3.nevaobjects.id/bantusewa/aset/filename.jpg" → "aset/filename.jpg"
 */
export function getS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // Path format: /bucket-name/key
    const pathParts = urlObj.pathname.split('/')

    // Remove the first empty string and bucket name
    if (pathParts.length >= 3) {
      return pathParts.slice(2).join('/')
    }

    return null
  } catch {
    // If URL parsing fails, try to extract from old local path format
    // e.g., "/uploads/aset/filename.jpg" → null (not an S3 URL)
    return null
  }
}

export { s3Client, S3_BUCKET }
