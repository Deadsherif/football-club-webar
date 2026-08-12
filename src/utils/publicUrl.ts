/** Prefix public files for GitHub Pages (`/football-club-webar/...`). */
export function publicUrl(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path

  // When deploying to Vercel, we may want to serve heavy WebAR assets (GLBs / MindAR targets)
  // from a different CDN (ex: the already-working GitHub Pages site).
  // Example: VITE_EXTERNAL_ASSET_BASE_URL=https://deadsherif.github.io/football-club-webar
  const externalBase = (import.meta.env.VITE_EXTERNAL_ASSET_BASE_URL as string | undefined)?.trim()
  const wantsExternal =
    !!externalBase &&
    (path.startsWith('/models/') || path.startsWith('/targets/'))

  if (wantsExternal) {
    const normalized = externalBase!.replace(/\/$/, '')
    return `${normalized}${path}`
  }

  const base = import.meta.env.BASE_URL || '/'
  if (base === '/') return path
  return `${base}${path.slice(1)}`
}
