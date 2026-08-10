/**
 * Build a branded archive-style portrait for Ahmed Fouad Anwar.
 * The Korabia presidents poster (and Wikipedia) only have a silhouette —
 * no verified photo is available in that source.
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outPres = path.join(root, 'public/assets/presidents/anwar.jpg')
const outLeg = path.join(
  root,
  'public/assets/legends/portraits/ahmed-fouad-anwar.jpg',
)

const w = 768
const h = 960
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a0508"/>
      <stop offset="55%" stop-color="#3b0a10"/>
      <stop offset="100%" stop-color="#120406"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="42%">
      <stop offset="0%" stop-color="#e30613" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#e30613" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <rect x="28" y="28" width="${w - 56}" height="${h - 56}" fill="none" stroke="#d4af37" stroke-width="10"/>
  <rect x="48" y="48" width="${w - 96}" height="${h - 96}" fill="none" stroke="rgba(212,175,55,0.35)" stroke-width="3"/>

  <g transform="translate(384,330)">
    <circle r="118" fill="rgba(227,6,19,0.18)" stroke="#d4af37" stroke-width="4"/>
    <circle r="96" fill="#8b0008" stroke="#d4af37" stroke-width="3"/>
    <path d="M0,-58 L18,-10 L68,-10 L28,18 L42,68 L0,38 L-42,68 L-28,18 L-68,-10 L-18,-10 Z"
      fill="#d4af37" opacity="0.95"/>
    <text y="108" text-anchor="middle" fill="#d4af37" font-family="Arial, sans-serif" font-size="22" font-weight="700">AL AHLY</text>
  </g>

  <text x="384" y="540" text-anchor="middle" fill="#d4af37" font-family="Arial, sans-serif" font-size="24" font-weight="700">PRESIDENT · CAPTAIN</text>
  <text x="384" y="600" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="40" font-weight="700">AHMED FOUAD ANWAR</text>
  <text x="384" y="660" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="600">أحمد فؤاد أنور</text>
  <text x="384" y="730" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="Arial, sans-serif" font-size="28">1940 — 1941</text>
  <text x="384" y="780" text-anchor="middle" fill="rgba(212,175,55,0.9)" font-family="Arial, sans-serif" font-size="18">FIRST TEAM CAPTAIN · ACTING PRESIDENT</text>
  <text x="384" y="860" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-family="Arial, sans-serif" font-size="15">No verified historical photograph in club archive source</text>
</svg>`

const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer()
fs.mkdirSync(path.dirname(outLeg), { recursive: true })
fs.writeFileSync(outPres, buf)
fs.writeFileSync(outLeg, buf)
console.log('wrote', outPres, buf.length)
console.log('wrote', outLeg, buf.length)
