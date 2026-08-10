import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const playersPath = resolve(root, 'src/data/players.ts')
const outputDirectory = resolve(root, 'public/assets/legends')
const manifestPath = resolve(outputDirectory, 'ATTRIBUTION.json')
const reportPath = resolve(outputDirectory, 'commons-candidates.json')

const source = await readFile(playersPath, 'utf8')
const players = [
  ...[...source.matchAll(
    /id: '([^']+)',\s+name: '([^']+)',\s+arabicName: '([^']+)'/g,
  )].map(([, id, name, arabicName]) => ({ id, name, arabicName })),
  ...[...source.matchAll(
    /editorialPlayer\('([^']+)', '([^']+)', '([^']+)'/g,
  )].map(([, id, name, arabicName]) => ({ id, name, arabicName })),
]

if (new Set(players.map((player) => player.id)).size !== players.length) {
  throw new Error('Player data contains duplicate IDs.')
}

const api = 'https://commons.wikimedia.org/w/api.php'
const requestHeaders = { 'User-Agent': 'AlAhlyLegendsPortraitImporter/1.0' }

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))
}

async function fetchWithRateLimitRetry(url, options = {}) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, options)
    if (response.status !== 429 || attempt === 4) return response
    await delay(5_000 * (attempt + 1))
  }
  throw new Error('Unreachable retry state')
}

function normalized(value) {
  return value
    .toLowerCase()
    .replace(/^file:/, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function scoreCandidate(player, title) {
  const playerTerms = normalized(player.name).split(' ').filter(Boolean)
  const titleTerms = normalized(title).split(' ').filter(Boolean)
  const matched = playerTerms.filter((term) => titleTerms.includes(term)).length
  const coverage = matched / playerTerms.length
  const firstAndLast =
    titleTerms.includes(playerTerms[0]) &&
    titleTerms.includes(playerTerms.at(-1))
      ? 0.2
      : 0
  return coverage + firstAndLast
}

function isOpenLicense(info) {
  const license = String(info.extmetadata?.LicenseShortName?.value ?? '')
  return /^(CC|Public domain)/i.test(license)
}

async function searchCommons(player) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '10',
    gsrsearch: `"${player.name}"`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '768',
  })
  const response = await fetchWithRateLimitRetry(`${api}?${params}`, {
    headers: requestHeaders,
  })
  if (!response.ok) {
    throw new Error(
      `Commons query failed for ${player.name}: ${response.status} ${await response.text()}`,
    )
  }
  const data = await response.json()
  return (data.query?.pages ?? [])
    .map((page) => {
      const info = page.imageinfo?.[0]
      if (!info || !isOpenLicense(info)) return null
      return {
        title: page.title,
        score: scoreCandidate(player, page.title),
        thumbnailUrl: info.thumburl,
        originalUrl: info.url,
        author: info.extmetadata?.Artist?.value ?? 'Unknown',
        license: info.extmetadata?.LicenseShortName?.value ?? 'Unknown',
        credit: info.extmetadata?.Credit?.value ?? '',
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
}

async function downloadCandidate(player, candidate) {
  const extension = basename(new URL(candidate.thumbnailUrl).pathname)
    .split('.')
    .at(-1)
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
  const filename = `${player.id}.${extension || 'jpg'}`
  const destination = resolve(outputDirectory, filename)
  const response = await fetchWithRateLimitRetry(candidate.thumbnailUrl, {
    headers: requestHeaders,
  })
  if (!response.ok) throw new Error(`Download failed for ${player.name}`)
  await writeFile(destination, Buffer.from(await response.arrayBuffer()))
  return {
    playerId: player.id,
    playerName: player.name,
    filename,
    commonsFile: `https://commons.wikimedia.org/wiki/${encodeURIComponent(candidate.title.replace(/ /g, '_'))}`,
    originalUrl: candidate.originalUrl,
    author: candidate.author,
    license: candidate.license,
    credit: candidate.credit,
  }
}

await mkdir(outputDirectory, { recursive: true })

const candidates = []
for (const player of players) {
  candidates.push({ player, candidates: await searchCommons(player) })
  await delay(1_100)
}

await writeFile(reportPath, `${JSON.stringify(candidates, null, 2)}\n`)

const accepted = candidates
  .map(({ player, candidates: matches }) => ({
    player,
    candidate: matches.find((candidate) => candidate.score >= 1.2),
  }))
  .filter(({ candidate }) => candidate)

const attribution = []
for (const { player, candidate } of accepted) {
  attribution.push(await downloadCandidate(player, candidate))
}

await writeFile(
  manifestPath,
  `${JSON.stringify(
    {
      source: 'Wikimedia Commons',
      generatedAt: new Date().toISOString(),
      portraits: attribution,
    },
    null,
    2,
  )}\n`,
)

console.log(
  JSON.stringify(
    {
      searched: players.length,
      downloaded: attribution.length,
      report: reportPath,
      manifest: manifestPath,
    },
    null,
    2,
  ),
)
