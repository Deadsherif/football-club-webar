/**
 * Download official Al Ahly board member portraits from board.alahlyegypt.com
 * Source: https://www.alahlyegypt.com/ar/club/board_members
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/assets/board')

const members = [
  {
    id: 'mahmoud-el-khatib',
    url: 'https://board.alahlyegypt.com/storage/board_members/tNgdIczSQ0ufhTNxU4KHiQEUoJogT9jTiUEJQGEk.jpg',
  },
  {
    id: 'yasseen-mansour',
    url: 'https://board.alahlyegypt.com/storage/board_members/yQVb1OQuao4HnT0RkgvACxxYZBvLAOoSUwqu9kDf.jpg',
  },
  {
    id: 'khaled-mortagy',
    url: 'https://board.alahlyegypt.com/storage/board_members/QCOwomUY4zl7TlX3IAb5GnwsCXmGKTyy1thXvS6I.png',
  },
  {
    id: 'tarek-kandil',
    url: 'https://board.alahlyegypt.com/storage/board_members/HerBYM6ICy1aFk7zjvDGtyO01I9DqWts7L3NHG7P.jpg',
  },
  {
    id: 'mohamed-el-ghazawy',
    url: 'https://board.alahlyegypt.com/storage/board_members/uFVNDl2nFJMaH4mZaGJ3pzt3rtfqkddPMH4EOuJ1.jpg',
  },
  {
    id: 'mohamed-el-damaty',
    url: 'https://board.alahlyegypt.com/storage/board_members/jUAYAYAAfY3KSxaUeGiazPTqUHkinrn4p5c8Sw2y.jpg',
  },
  {
    id: 'mohamed-el-garhy',
    url: 'https://board.alahlyegypt.com/storage/board_members/HwuFzOPx9vdsfwBvZU3YzIzwU9rfvzNbGXhedNS2.jpg',
  },
  {
    id: 'sayed-abdelhafiz',
    url: 'https://board.alahlyegypt.com/storage/board_members/Zt55W9b13glcBOYjwfkKSXxnXCozZa30H6IeqAst.jpg',
  },
  {
    id: 'hazem-hilal',
    url: 'https://board.alahlyegypt.com/storage/board_members/W7EOC9EN4bsxnZ0y8r593EwQ45j5FepXxTRKEVkG.jpg',
  },
  {
    id: 'ahmed-hossam-awad',
    url: 'https://board.alahlyegypt.com/storage/board_members/ZanqnNX5JA9VvZnfENHA0TGh2wlxDgNv5OU1YBqy.jpg',
  },
  {
    id: 'ibrahim-elamry-farouk',
    url: 'https://board.alahlyegypt.com/storage/board_members/leD23OwqVvRMZ9skuLBpaQoiCKI4rIADRwdAVu5V.jpg',
  },
  {
    id: 'roweida-hesham',
    url: 'https://board.alahlyegypt.com/storage/board_members/SA4LLJB5NZaQu0OZGd0eJnWvzY1pAIgzxwDFeVqQ.jpg',
  },
]

fs.mkdirSync(outDir, { recursive: true })

for (const member of members) {
  const res = await fetch(member.url)
  if (!res.ok) throw new Error(`Failed ${member.id}: HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const out = path.join(outDir, `${member.id}.jpg`)
  await sharp(buf)
    .rotate()
    .resize(768, 960, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 88 })
    .toFile(out)
  console.log('saved', member.id, fs.statSync(out).size)
}
