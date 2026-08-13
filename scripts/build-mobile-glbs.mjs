/**
 * Bake lightweight *.mobile.glb copies for phones.
 * Desktop keeps the original files.
 *
 * Usage: npm run build:mobile-glbs
 */
import fs from 'node:fs'
import path from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import {
  dedup,
  prune,
  textureCompress,
  weld,
  simplify,
} from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

const ROOT = path.resolve('public/models')

const PRESETS = {
  stadium: { texture: 384, ratio: 0.12, error: 0.04, quality: 68 },
  crest: { texture: 384, ratio: 0.15, error: 0.04, quality: 70 },
  trophy: { texture: 384, ratio: 0.32, error: 0.02, quality: 70 },
}

function mb(n) {
  return `${(n / 1024 / 1024).toFixed(2)}MB`
}

function stripExtraMaps() {
  return (document) => {
    for (const material of document.getRoot().listMaterials()) {
      material.setNormalTexture(null)
      material.setOcclusionTexture(null)
      material.setMetallicRoughnessTexture(null)
      const clearcoat = material.getExtension('KHR_materials_clearcoat')
      if (clearcoat) {
        clearcoat.setClearcoatTexture(null)
        clearcoat.setClearcoatNormalTexture(null)
        clearcoat.setClearcoatRoughnessTexture(null)
      }
    }
  }
}

function listTargets() {
  const files = []
  const stadium = path.join(ROOT, 'stadium.glb')
  if (fs.existsSync(stadium)) {
    files.push({ input: stadium, preset: PRESETS.stadium })
  }
  const crest = path.join(ROOT, 'club-crest.glb')
  if (fs.existsSync(crest)) {
    files.push({ input: crest, preset: PRESETS.crest })
  }
  const trophiesDir = path.join(ROOT, 'trophies')
  if (fs.existsSync(trophiesDir)) {
    for (const name of fs.readdirSync(trophiesDir)) {
      if (!name.endsWith('.glb') || name.endsWith('.mobile.glb')) continue
      files.push({
        input: path.join(trophiesDir, name),
        preset: PRESETS.trophy,
      })
    }
  }
  return files
}

function mobileOutPath(input) {
  return input.replace(/\.glb$/i, '.mobile.glb')
}

async function bake(input, preset) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  const document = await io.read(input)
  await MeshoptSimplifier.ready

  await document.transform(
    stripExtraMaps(),
    dedup(),
    weld(),
    simplify({
      simplifier: MeshoptSimplifier,
      ratio: preset.ratio,
      error: preset.error,
    }),
    prune(),
    textureCompress({
      encoder: sharp,
      targetFormat: 'jpeg',
      resize: [preset.texture, preset.texture],
      quality: preset.quality,
    }),
    prune(),
    dedup(),
  )

  const out = mobileOutPath(input)
  await io.write(out, document)
  return out
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  const targets = listTargets().filter((t) => {
    if (only.length === 0) return true
    const rel = path.relative(process.cwd(), t.input).replace(/\\/g, '/')
    return only.some((q) => rel.includes(q))
  })

  if (targets.length === 0) {
    console.error('No GLBs found under public/models')
    process.exitCode = 1
    return
  }

  for (const { input, preset } of targets) {
    const rel = path.relative(process.cwd(), input).replace(/\\/g, '/')
    const before = fs.statSync(input).size
    try {
      const out = await bake(input, preset)
      const after = fs.statSync(out).size
      console.log(`ok  ${rel}  ${mb(before)} -> ${mb(after)}`)
    } catch (error) {
      console.error(`fail ${rel}`, error)
      process.exitCode = 1
    }
  }
}

await main()
