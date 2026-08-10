import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const candidatesPath = resolve(root, 'public/assets/legends/commons-candidates.json')
const attributionPath = resolve(root, 'public/assets/legends/ATTRIBUTION.json')
const portraitMapPath = resolve(root, 'src/data/legendPortraits.ts')

const candidates = JSON.parse(await readFile(candidatesPath, 'utf8'))

const ambiguousPlayerIds = new Set([
  'ahmed-fouad-anwar',
  'hussein-sabry',
  'saleh-el-wahsh-player',
  'hussein-madkour',
  'ahmed-mekawy',
  'el-tohamy',
  'el-dazwy',
  'hassan-hamdy-player',
  'hany-mostafa',
  'ibrahim-hassan',
  'mohamed-ramadan',
  'wael-riyad',
  'ahmed-bilal',
  'alaa-ibrahim',
  'ahmed-hassan',
  'mohamed-naguib',
  'mohamed-hany',
  'mohamed-sherif',
  'yasser-ibrahim',
  'mahmoud-kahraba',
  'zizo',
])

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/^file:/, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const portraits = candidates
  .filter(({ player }) => !ambiguousPlayerIds.has(player.id))
  .map(({ player, candidates: matches }) => {
    const candidate = matches.find(
      (match) => normalize(match.title) === normalize(player.name),
    )
    return candidate ? { player, candidate } : null
  })
  .filter(Boolean)

const portraitMap = Object.fromEntries(
  portraits.map(({ player, candidate }) => [player.id, candidate.thumbnailUrl]),
)

const attribution = portraits.map(({ player, candidate }) => ({
  playerId: player.id,
  playerName: player.name,
  commonsFile: `https://commons.wikimedia.org/wiki/${encodeURIComponent(
    candidate.title.replace(/ /g, '_'),
  )}`,
  thumbnailUrl: candidate.thumbnailUrl,
  originalUrl: candidate.originalUrl,
  author: candidate.author,
  license: candidate.license,
  credit: candidate.credit,
}))

await writeFile(
  portraitMapPath,
  `/**\n * Openly licensed Wikimedia Commons portrait URLs.\n * Full attribution is recorded in public/assets/legends/ATTRIBUTION.json.\n */\nexport const legendPortraits: Record<string, string> = ${JSON.stringify(
    portraitMap,
    null,
    2,
  )}\n`,
)
await writeFile(
  attributionPath,
  `${JSON.stringify(
    {
      source: 'Wikimedia Commons',
      delivery: 'Remote thumbnails; direct local downloads were rate-limited by Wikimedia.',
      portraits: attribution,
    },
    null,
    2,
  )}\n`,
)

console.log(
  JSON.stringify(
    {
      mapped: portraits.length,
      excludedAsAmbiguous: ambiguousPlayerIds.size,
      map: portraitMapPath,
      attribution: attributionPath,
    },
    null,
    2,
  ),
)
