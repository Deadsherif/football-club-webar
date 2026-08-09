# Assets guide — AL AHLY WebAR

## Crest / MindAR target

1. Place official crest at `public/assets/crest.png` (high contrast, ≥500px).
2. Run `npm run compile:target`.
3. Tracker is written to `public/targets/al-ahly.mind`.
4. Scene config: `src/config/scenes.ts`.

## Stadium

Place `public/models/stadium.glb`.  
If missing or too small, a procedural night stadium is used automatically.

## Trophies / legends / audio

- `public/models/trophies/*.glb` — referenced in `src/data/trophies.ts`
- `public/models/legends/` — optional
- `public/audio/*.mp3` — map filenames in `src/services/audioService.ts`

The app must never crash on missing assets — placeholders and procedural fallbacks keep the prototype running.
