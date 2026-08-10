/**
 * Copy Images/player images -> public/assets/legends/portraits
 * and regenerate src/data/legendPortraits.ts
 */
import {
  readdirSync,
  copyFileSync,
  mkdirSync,
  writeFileSync,
  statSync,
} from 'node:fs'
import path from 'node:path'

const SRC = path.resolve('Images/player images')
const DEST = path.resolve('public/assets/legends/portraits')
mkdirSync(DEST, { recursive: true })

const files = readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
const map = /** @type {Record<string, string>} */ ({})
const copied = []
const skipped = []

for (const file of files) {
  const ext = path.extname(file).toLowerCase()
  const base = path.basename(file, path.extname(file))
  let id = base

  const emDash = base.indexOf('\u2014')
  if (emDash >= 0) {
    id = base.slice(0, emDash).trim()
  } else {
    const m = base.match(/^([a-z0-9]+(?:-[a-z0-9]+)+)/i)
    if (m) id = m[1]
  }

  id = id.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!id) {
    skipped.push(file)
    continue
  }

  const outName = `${id}${ext === '.jpeg' ? '.jpg' : ext}`
  const outPath = path.join(DEST, outName)
  copyFileSync(path.join(SRC, file), outPath)
  map[id] = `/assets/legends/portraits/${outName}`
  copied.push({ id, file, outName, bytes: statSync(outPath).size })
}

const sorted = Object.fromEntries(
  Object.entries(map).sort(([a], [b]) => a.localeCompare(b)),
)

const ts = `/**
 * Local legend portraits from Images/player images.
 * Copied into public/assets/legends/portraits for WebAR delivery.
 */
export const legendPortraits: Record<string, string> = ${JSON.stringify(
  sorted,
  null,
  2,
)}
`

writeFileSync(path.resolve('src/data/legendPortraits.ts'), ts)

console.log(
  JSON.stringify(
    {
      copied: copied.length,
      skipped: skipped.length,
      portraits: Object.keys(sorted).length,
      sample: copied.slice(0, 8),
    },
    null,
    2,
  ),
)
if (skipped.length) console.log('skipped', skipped)
