/** Prefix public files for GitHub Pages (`/football-club-webar/...`). */
export function publicUrl(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  const base = import.meta.env.BASE_URL || '/'
  if (base === '/') return path
  return `${base}${path.slice(1)}`
}
