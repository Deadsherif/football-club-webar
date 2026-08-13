import { publicUrl } from '@/utils/publicUrl'

function isMobileGlbUrl(url: string): boolean {
  if (!/\.glb(\?|$)/i.test(url)) return false
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

const CACHE_NAME = 'alahly-assets-v1'

const memoryBuffers = new Map<string, ArrayBuffer>()
const memoryBlobs = new Map<string, Blob>()
const inflight = new Map<string, Promise<ArrayBuffer>>()
const inflightBlobs = new Map<string, Promise<Blob>>()

async function openCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null
  try {
    return await caches.open(CACHE_NAME)
  } catch {
    return null
  }
}

/**
 * Fetch once — memory, then Cache Storage, then network.
 * Used for GLBs and portrait images so chapter switches skip the network.
 */
export async function fetchCachedBuffer(
  url: string,
  onChunk?: (loaded: number, total: number) => void,
): Promise<ArrayBuffer> {
  url = publicUrl(url)
  const hit = memoryBuffers.get(url)
  if (hit) return hit.slice(0)

  const pending = inflight.get(url)
  if (pending) return pending.then((buf) => buf.slice(0))

  const job = (async () => {
    const cache = await openCache()
    const cached = cache ? await cache.match(url) : undefined
    if (cached) {
      const buf = await cached.arrayBuffer()
      if (!isMobileGlbUrl(url)) memoryBuffers.set(url, buf)
      return buf
    }

    const response = await fetch(url, { credentials: 'omit' })
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
    }

    const totalHeader = Number(response.headers.get('content-length') || 0)
    const reader = response.body?.getReader()
    let buffer: ArrayBuffer

    if (reader) {
      const chunks: Uint8Array[] = []
      let loaded = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value)
          loaded += value.byteLength
          if (totalHeader > 0) onChunk?.(loaded, totalHeader)
        }
      }
      const merged = new Uint8Array(loaded)
      let offset = 0
      for (const chunk of chunks) {
        merged.set(chunk, offset)
        offset += chunk.byteLength
      }
      buffer = merged.buffer
    } else {
      buffer = await response.arrayBuffer()
    }

    if (!isMobileGlbUrl(url)) memoryBuffers.set(url, buffer)
    if (cache) {
      try {
        await cache.put(url, new Response(buffer.slice(0), { headers: response.headers }))
      } catch {
        // Quota — keep memory cache only.
      }
    }
    return buffer
  })()

  inflight.set(url, job)
  return job.finally(() => inflight.delete(url)).then((buf) => buf.slice(0))
}

export async function fetchCachedBlob(url: string): Promise<Blob> {
  url = publicUrl(url)
  const hit = memoryBlobs.get(url)
  if (hit) return Promise.resolve(hit)

  const pending = inflightBlobs.get(url)
  if (pending) return pending

  const job = (async () => {
    const cache = await openCache()
    const cached = cache ? await cache.match(url) : undefined
    if (cached) {
      const blob = await cached.blob()
      memoryBlobs.set(url, blob)
      return blob
    }
    const response = await fetch(url, { credentials: 'omit' })
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
    const blob = await response.blob()
    memoryBlobs.set(url, blob)
    if (cache) {
      try {
        await cache.put(url, new Response(blob, { headers: response.headers }))
      } catch {
        // Quota — keep memory cache only.
      }
    }
    return blob
  })()

  inflightBlobs.set(url, job)
  return job.finally(() => inflightBlobs.delete(url))
}

/** Warm Cache Storage + memory without parsing. */
export async function prefetchUrl(url: string): Promise<void> {
  await fetchCachedBuffer(url)
}
