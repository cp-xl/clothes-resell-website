import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)
const TABLE = process.env.TABLE_NAME
const ALLOWED_IMAGE_DOMAIN = process.env.CLOUDFRONT_DOMAIN || ''

const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
}

const MAX_PAGE_SIZE = 50
const MAX_PRICE = 100000

function response(statusCode, body) {
  return {
    statusCode,
    headers: { ...SECURITY_HEADERS },
    body: JSON.stringify(body),
  }
}

function isValidImageUrl(url) {
  if (!url) return true // empty is allowed (no image)
  if (!ALLOWED_IMAGE_DOMAIN) return false
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === ALLOWED_IMAGE_DOMAIN &&
      parsed.pathname.startsWith('/uploads/')
    )
  } catch {
    return false
  }
}

// Validate UUID format to prevent injection via path params
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function handler(event) {
  const method = event.requestContext.http.method
  const path = event.rawPath

  if (method === 'GET' && path === '/listings') {
    const exclusiveStartKey = event.queryStringParameters?.cursor || undefined
    let startKey
    if (exclusiveStartKey) {
      // cursor is a base64-encoded JSON key
      try {
        startKey = JSON.parse(Buffer.from(exclusiveStartKey, 'base64url').toString())
        if (typeof startKey.id !== 'string') throw new Error()
      } catch {
        return response(400, { error: 'Invalid cursor' })
      }
    }

    const params = {
      TableName: TABLE,
      Limit: MAX_PAGE_SIZE,
    }
    if (startKey) params.ExclusiveStartKey = startKey

    const result = await ddb.send(new ScanCommand(params))

    const body = { items: result.Items || [] }
    if (result.LastEvaluatedKey) {
      body.nextCursor = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64url')
    }
    return response(200, body)
  }

  if (method === 'GET' && path.startsWith('/listings/')) {
    const id = event.pathParameters?.id
    if (!id || !UUID_RE.test(id)) return response(400, { error: 'Invalid id' })

    const result = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { id },
    }))

    if (!result.Item) return response(404, { error: 'Not found' })
    return response(200, result.Item)
  }

  if (method === 'POST' && path === '/listings') {
    let body
    try {
      body = JSON.parse(event.body)
    } catch {
      return response(400, { error: 'Invalid JSON' })
    }

    const title = String(body.title || '').trim().slice(0, 100)
    const price = Number(body.price)
    const description = String(body.description || '').trim().slice(0, 200)
    const backstory = String(body.backstory || '').trim().slice(0, 500)
    const imageUrl = String(body.imageUrl || '').trim().slice(0, 500)

    if (!title) return response(400, { error: 'Title is required' })
    if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
      return response(400, { error: `Price must be between 0 and ${MAX_PRICE}` })
    }
    if (!isValidImageUrl(imageUrl)) {
      return response(400, { error: 'Image URL must be from the approved CDN' })
    }

    const item = {
      id: randomUUID(),
      title,
      price: Math.round(price * 100) / 100, // round to cents
      description,
      backstory,
      imageUrl,
      createdAt: new Date().toISOString(),
    }

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }))
    return response(201, item)
  }

  return response(404, { error: 'Not found' })
}
