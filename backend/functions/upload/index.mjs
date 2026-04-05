import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'

const s3 = new S3Client({})
const BUCKET = process.env.BUCKET_NAME
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || ''

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILENAME = 200
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB — matches frontend limit

const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { ...SECURITY_HEADERS },
    body: JSON.stringify(body),
  }
}

export async function handler(event) {
  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return response(400, { error: 'Invalid JSON' })
  }

  const contentType = String(body.contentType || '')
  if (!ALLOWED_TYPES.has(contentType)) {
    return response(400, { error: 'Unsupported image type. Allowed: JPEG, PNG, WebP' })
  }

  const rawFilename = String(body.filename || 'image').slice(0, MAX_FILENAME)
  const ext = rawFilename.split('.').pop() || 'jpg'
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  const key = `uploads/${randomUUID()}.${safeExt}`

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: MAX_FILE_SIZE,
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })

  // Return the CloudFront URL for public access, not direct S3
  const fileUrl = CLOUDFRONT_DOMAIN
    ? `https://${CLOUDFRONT_DOMAIN}/${key}`
    : `https://${BUCKET}.s3.amazonaws.com/${key}`

  return response(200, { uploadUrl, fileUrl })
}
