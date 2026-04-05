/**
 * Validates that an image URL is from a trusted source (CloudFront or S3).
 * Returns the URL if valid, or empty string if not.
 */
export function sanitizeImageUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return ''
    const host = parsed.hostname
    if (host.endsWith('.cloudfront.net') || host.endsWith('.s3.amazonaws.com')) {
      return url
    }
    return ''
  } catch {
    return ''
  }
}
