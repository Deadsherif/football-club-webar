/**
 * Copy Images/*.jpg|png president portraits -> public/assets/presidents
 * Run: node scripts/sync-president-portraits.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const srcDir = path.join(root, 'Images')
const outDir = path.join(root, 'public/assets/presidents')

/** Arabic filename in Images/ -> asset file(s) under public/assets/presidents */
const map = [
  ['ميتشيل إنس.jpg', ['ince.jpg']],
  ['عزيز عزت باشا.jpg', ['ezzat.jpg']],
  ['عبد الخالق ثروت باشا.jpg', ['sarwat.jpg']],
  ['جعفر والي باشا.jpg', ['waly-1922.jpg', 'waly-1941.jpg']],
  ['أحمد فؤاد انور.png', ['anwar.jpg']],
  ['أحمد حسنين باشا.jpg', ['hasanein.jpg']],
  ['أحمد عبود باشا.jpg', ['aboud.jpg']],
  ['صلاح الدين الدسوقي.jpg', ['desouky.jpg']],
  ['عبد المحسن مرتجي.jpg', ['mortagy-1971.jpg', 'mortagy-1965.jpg']],
  ['إبراهيم الوكيل.jpg', ['wakil.jpg']],
  ['صالح سليم.jpg', ['selim-1992.jpg', 'selim-1980.jpg']],
  ['عبده صالح الوحش.jpg', ['wahsh.jpg']],
  ['حسن حمدي.jpg', ['hamdy.jpg']],
  ['محمود طاهر.jpg', ['taher.jpg']],
  ['محمود الخطيب.jpg', ['khatib.jpg']],
]

fs.mkdirSync(outDir, { recursive: true })

for (const [from, targets] of map) {
  const src = path.join(srcDir, from)
  if (!fs.existsSync(src)) {
    console.error('MISSING', from)
    continue
  }
  const ext = path.extname(from).toLowerCase()
  for (const to of targets) {
    const dest = path.join(outDir, to)
    if (ext === '.png' && path.extname(to).toLowerCase() === '.jpg') {
      await sharp(src).jpeg({ quality: 90 }).toFile(dest)
      console.log('converted', from, '->', to)
    } else {
      fs.copyFileSync(src, dest)
      console.log('copied', from, '->', to)
    }
  }
}
