import API_BASE from './config.js'

export async function fetchListings(cursor) {
  const url = new URL(`${API_BASE}/listings`)
  if (cursor) url.searchParams.set('cursor', cursor)

  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch listings')
  return res.json() // { items: [...], nextCursor?: string }
}

export async function fetchListing(id) {
  const res = await fetch(`${API_BASE}/listings/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error('Failed to fetch listing')
  return res.json()
}

export async function createListing(data) {
  const res = await fetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create listing')
  }
  return res.json()
}

export async function getUploadUrl(filename, contentType) {
  const res = await fetch(`${API_BASE}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to get upload URL')
  }
  return res.json()
}

export async function uploadImage(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!res.ok) throw new Error('Failed to upload image')
}
