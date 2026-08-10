/**
 * Download El Qalaa El Hamraa board portraits from the official About page.
 * Source: https://www.elqalaaelhamraa.com/en/pages/about-us
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/assets/red-castle')

const members = [
  {
    id: 'mohamed-kamel',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/asset_2_1_1.png',
  },
  {
    id: 'ashraf-alaraby',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/Mr._ASHRAF_ALARABY.png',
  },
  {
    id: 'gamal-mokhtar',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/General_Gamal_Mokhtar.png',
  },
  {
    id: 'hassan-abd-el-magid',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/Mr_Hassan_abd_el_magid.png',
  },
  {
    id: 'inas-abdeldayem',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/Dr_Inas.png',
  },
  {
    id: 'mahmoud-al-matiny',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/Dr._MAHMOUD_AL_MATINY.png',
  },
  {
    id: 'saad-gioushy',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/Dr_Saad_Gioushy.png',
  },
  {
    id: 'tarek-shawky',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/Dr_Tarek_Shawky.png',
  },
  {
    id: 'yakoub-al-saady',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/Mr._YAKOUB_AL_SAADY.png',
  },
  {
    id: 'yasser-el-kady',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/Mr._YASSER_EL_KADY.png',
  },
  {
    id: 'yehia-abd-elkarim',
    url: 'https://www.elqalaaelhamraa.com/cdn/shop/files/General_Yehia.png',
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
    .flatten({ background: { r: 20, g: 6, b: 8 } })
    .resize(768, 960, { fit: 'contain', background: { r: 20, g: 6, b: 8 } })
    .jpeg({ quality: 90 })
    .toFile(out)
  console.log('saved', member.id, fs.statSync(out).size)
}
