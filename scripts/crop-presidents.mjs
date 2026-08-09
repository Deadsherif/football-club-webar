/**
 * Recalibrated crop for Korabia presidents poster (499×640).
 * Row1 verified. Lower rows shifted down vs first estimate.
 */
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, '../public/assets/presidents/_source-poster.png')
const outDir = path.join(__dirname, '../public/assets/presidents')

const meta = await sharp(src).metadata()
const W = meta.width
const H = meta.height

const cells = {
  // Row 1 — 4 cards (verified)
  'selim-1992': [0.035, 0.10, 0.21, 0.16],
  'hamdy': [0.275, 0.10, 0.21, 0.16],
  'taher': [0.515, 0.10, 0.21, 0.16],
  'khatib': [0.755, 0.10, 0.21, 0.16],
  // Row 2 — 5 cards
  'mortagy-1965': [0.015, 0.285, 0.18, 0.15],
  'wakil': [0.21, 0.285, 0.18, 0.15],
  'mortagy-1971': [0.41, 0.285, 0.18, 0.15],
  'selim-1980': [0.61, 0.285, 0.18, 0.15],
  'wahsh': [0.81, 0.285, 0.18, 0.15],
  // Row 3 — 5 cards (was landing on row2 before)
  'anwar': [0.015, 0.47, 0.18, 0.15],
  'waly-1941': [0.21, 0.47, 0.18, 0.15],
  'hasanein': [0.41, 0.47, 0.18, 0.15],
  'aboud': [0.61, 0.47, 0.18, 0.15],
  'desouky': [0.81, 0.47, 0.18, 0.15],
  // Row 4 — 4 cards
  'ince': [0.035, 0.655, 0.21, 0.16],
  'ezzat': [0.275, 0.655, 0.21, 0.16],
  'sarwat': [0.515, 0.655, 0.21, 0.16],
  'waly-1922': [0.755, 0.655, 0.21, 0.16],
}

// If previous pass showed row3@0.49 = mortagy and row4@0.68 = anwar,
// use those Y values for row2/row3 and push row4 further down.
const calibrated = {
  ...cells,
  'mortagy-1965': [0.015, 0.47, 0.18, 0.145],
  'wakil': [0.21, 0.47, 0.18, 0.145],
  'mortagy-1971': [0.41, 0.47, 0.18, 0.145],
  'selim-1980': [0.61, 0.47, 0.18, 0.145],
  'wahsh': [0.81, 0.47, 0.18, 0.145],
  'anwar': [0.015, 0.655, 0.18, 0.145],
  'waly-1941': [0.21, 0.655, 0.18, 0.145],
  'hasanein': [0.41, 0.655, 0.18, 0.145],
  'aboud': [0.61, 0.655, 0.18, 0.145],
  'desouky': [0.81, 0.655, 0.18, 0.145],
  'ince': [0.04, 0.83, 0.20, 0.13],
  'ezzat': [0.28, 0.83, 0.20, 0.13],
  'sarwat': [0.52, 0.83, 0.20, 0.13],
  'waly-1922': [0.76, 0.83, 0.20, 0.13],
}

fs.mkdirSync(outDir, { recursive: true })

for (const [name, [nx, ny, nw, nh]] of Object.entries(calibrated)) {
  const left = Math.max(0, Math.round(nx * W))
  const top = Math.max(0, Math.round(ny * H))
  const width = Math.min(W - left, Math.round(nw * W))
  const height = Math.min(H - top, Math.round(nh * H))
  await sharp(src)
    .extract({ left, top, width, height })
    .resize(512, 640, { fit: 'cover' })
    .jpeg({ quality: 88 })
    .toFile(path.join(outDir, `${name}.jpg`))
  console.log(name, { left, top, width, height })
}
