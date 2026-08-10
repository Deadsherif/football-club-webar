/**
 * Recompress embedded JPEG/PNG textures inside GLB files so mobile
 * browsers can decode them (avoids GLTFLoader blob texture failures).
 *
 * Usage: node scripts/optimize-glb-textures.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve('public/models')
const MAX_EDGE = {
  stadium: 2048,
  trophy: 1024,
}

function readChunks(buffer) {
  let o = 12
  const chunks = []
  while (o + 8 <= buffer.length) {
    const len = buffer.readUInt32LE(o)
    const type = buffer.toString('utf8', o + 4, o + 8)
    const data = buffer.subarray(o + 8, o + 8 + len)
    chunks.push({ type, data })
    o += 8 + len
  }
  return chunks
}

function writeGlb(json, bin) {
  const jsonBuf = Buffer.from(JSON.stringify(json))
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4
  // glTF requires JSON chunk padding with 0x20 spaces (not nulls).
  const jsonPadded = jsonPad
    ? Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)])
    : jsonBuf
  const binPad = (4 - (bin.length % 4)) % 4
  const binPadded = binPad ? Buffer.concat([bin, Buffer.alloc(binPad)]) : bin
  const total = 12 + 8 + jsonPadded.length + 8 + binPadded.length
  const out = Buffer.alloc(total)
  out.writeUInt32LE(0x46546c67, 0)
  out.writeUInt32LE(2, 4)
  out.writeUInt32LE(total, 8)
  out.writeUInt32LE(jsonPadded.length, 12)
  out.writeUInt32LE(0x4e4f534a, 16)
  jsonPadded.copy(out, 20)
  const binAt = 20 + jsonPadded.length
  out.writeUInt32LE(binPadded.length, binAt)
  out.writeUInt32LE(0x004e4942, binAt + 4)
  binPadded.copy(out, binAt + 8)
  return out
}

async function optimizeGlb(filePath, maxEdge) {
  const buf = fs.readFileSync(filePath)
  const chunks = readChunks(buf)
  const jsonChunk = chunks.find((c) => c.type === 'JSON')
  const binChunk =
    chunks.find((c) => c.type === 'BIN\0') ||
    chunks.find((c) => c.type.startsWith('BIN'))
  if (!jsonChunk || !binChunk) throw new Error(`Bad GLB: ${filePath}`)

  const json = JSON.parse(
    Buffer.from(jsonChunk.data).toString('utf8').replace(/\0+$/g, '').trimEnd(),
  )
  const bin = Buffer.from(binChunk.data)
  const images = json.images || []
  if (images.length === 0) return { skipped: true, before: buf.length, after: buf.length }

  const replacements = new Map()
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    if (img.bufferView == null) continue
    const bv = json.bufferViews[img.bufferView]
    const start = bv.byteOffset || 0
    const src = bin.subarray(start, start + bv.byteLength)
    const isNormalish = i >= 2
    const edge = isNormalish ? Math.min(maxEdge, 1024) : maxEdge
    const out = await sharp(src)
      .rotate()
      .resize(edge, edge, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: isNormalish ? 80 : 86, mozjpeg: true })
      .toBuffer()
    replacements.set(img.bufferView, out)
    img.mimeType = 'image/jpeg'
  }

  const newParts = []
  let cursor = 0
  json.bufferViews = json.bufferViews.map((bv, idx) => {
    const bytes = replacements.has(idx)
      ? replacements.get(idx)
      : bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)
    const pad = (4 - (bytes.length % 4)) % 4
    const entry = { byteOffset: cursor, byteLength: bytes.length, buffer: 0 }
    if (bv.target != null) entry.target = bv.target
    if (bv.byteStride != null) entry.byteStride = bv.byteStride
    newParts.push(bytes)
    if (pad) newParts.push(Buffer.alloc(pad))
    cursor += bytes.length + pad
    return entry
  })

  const newBin = Buffer.concat(newParts)
  const out = writeGlb(json, newBin)
  fs.writeFileSync(filePath, out)
  return { skipped: false, before: buf.length, after: out.length }
}

function listTargets() {
  const files = []
  const stadium = path.join(ROOT, 'stadium.glb')
  if (fs.existsSync(stadium)) files.push({ file: stadium, maxEdge: MAX_EDGE.stadium })
  const trophiesDir = path.join(ROOT, 'trophies')
  if (fs.existsSync(trophiesDir)) {
    for (const name of fs.readdirSync(trophiesDir)) {
      if (!name.endsWith('.glb')) continue
      files.push({
        file: path.join(trophiesDir, name),
        maxEdge: MAX_EDGE.trophy,
      })
    }
  }
  return files
}

async function main() {
  const args = new Set(process.argv.slice(2))
  // Stadium stays as authored unless --include-stadium is passed.
  const includeStadium = args.has('--include-stadium')

  for (const { file, maxEdge } of listTargets()) {
    const rel = path.relative(process.cwd(), file)
    if (!includeStadium && rel.replace(/\\/g, '/').endsWith('stadium.glb')) {
      console.log(`keep ${rel} (use --include-stadium to recompress)`)
      continue
    }
    try {
      const result = await optimizeGlb(file, maxEdge)
      if (result.skipped) {
        console.log(`skip ${rel}`)
        continue
      }
      const mb = (n) => (n / 1024 / 1024).toFixed(2)
      console.log(
        `ok   ${rel}  ${mb(result.before)}MB -> ${mb(result.after)}MB`,
      )
    } catch (err) {
      console.error(`fail ${rel}`, err)
      process.exitCode = 1
    }
  }
}

await main()
