# AL AHLY — MORE THAN A CLUB

Premium mobile-first **WebAR** prototype for Al Ahly SC.

**Journey:** Landing → Intro → Camera → Crest scan → Cinematic portal → 3D stadium → *YOU ARE THE 12TH PLAYER* → History / Trophies / Legends / Future

## Stack

React · Vite · TypeScript · Three.js · MindAR · Tailwind CSS · Web Audio

## Quick start

```bash
cd football-club-webar
npm install
npm run dev
```

Open the **HTTPS** URL on a phone (iOS Safari / Android Chrome). Accept the self-signed cert once.

### Compile the crest tracker

```bash
npm run compile:target
```

Reads `public/assets/crest.png` → writes `public/targets/al-ahly.mind`.

### Production

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static HTTPS host (Vercel, Netlify, S3+CloudFront, Nginx).

## Experience flow

1. **Landing** — AL AHLY / MORE THAN A CLUB  
2. **Intro** — scan instructions + OPEN CAMERA  
3. **AR Scanner** — MindAR image tracking  
4. **Cinematic** — glow → particles → portal → stadium rise → lights → crowd  
5. **Titles** — THE LEGACY CONTINUES → YOU ARE THE 12TH PLAYER  
6. **Explore** — floating menu: History · Trophies · Legends · Future  
7. **Ask Al Ahly** — mock AI assistant (swap API later)

Desktop visitors see a **QR / open on phone** gate. Devices without WebAR can use the **interactive fallback**.

## Asset map

| Path | Purpose |
|------|---------|
| `public/assets/crest.png` | UI crest / compile source |
| `public/targets/al-ahly.mind` | MindAR tracker |
| `public/models/stadium.glb` | Stadium (procedural fallback if tiny/missing) |
| `public/models/trophies/` | Trophy GLBs |
| `public/models/legends/` | Optional legend models |
| `public/audio/` | Optional real audio files |

## Architecture

```
src/
  ar/           engine, scenes, effects, assets
  components/   screens, ar overlays, panels
  data/         history, trophies, legends, future
  services/     audio, analytics, ai
  i18n/         en (MVP) + ar (ready)
  hooks/        useExperience
  utils/        device capability
```

## Localization

MVP UI is **English**. Call `setLocale('ar')` from `src/i18n` to switch to Arabic RTL later.

## Connect a real AI API

Edit `src/services/aiService.ts` — replace `ask()` with your backend:

```ts
const res = await fetch('/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, history }),
})
return (await res.json()).reply
```

## Analytics

`src/services/analyticsService.ts` logs events in development. Wire to your provider inside `track()`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | HTTPS Vite server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run compile:target` | Compile crest → `.mind` |
