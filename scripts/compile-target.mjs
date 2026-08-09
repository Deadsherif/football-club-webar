/**
 * Compiles public/targets/club-crest.png → club-crest.mind using MindAR's
 * browser Compiler inside headless Chromium (no node-canvas required).
 *
 * Usage: npm run compile:target
 */
import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const pngPath = path.join(root, 'public', 'assets', 'crest.png')
const mindPath = path.join(root, 'public', 'targets', 'al-ahly.mind')
const distDir = path.join(root, 'node_modules', 'mind-ar', 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.wasm': 'application/wasm',
}

async function main() {
  await fs.access(pngPath)
  await fs.access(path.join(distDir, 'mindar-image.prod.js'))

  const pngBuf = await fs.readFile(pngPath)

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1')

      if (url.pathname === '/' || url.pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': MIME['.html'] })
        res.end(`<!doctype html>
<html><head><meta charset="utf-8" /></head><body>
<script type="module">
  import { Compiler } from '/dist/mindar-image.prod.js';
  window.__compile = async (dataUrl) => {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });
    // Downscale huge crests for faster compile / better MindAR features
    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const scaled = new Image();
    await new Promise((resolve, reject) => {
      scaled.onload = resolve;
      scaled.onerror = reject;
      scaled.src = canvas.toDataURL('image/png');
    });

    const compiler = new Compiler();
    await compiler.compileImageTargets([scaled], (p) => {
      window.__progress = p;
    });
    const buffer = compiler.exportData();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  };
  window.__ready = true;
</script>
Compiling…
</body></html>`)
        return
      }

      if (url.pathname.startsWith('/dist/')) {
        const rel = url.pathname.slice('/dist/'.length)
        const filePath = path.normalize(path.join(distDir, rel))
        if (!filePath.startsWith(distDir)) {
          res.writeHead(403)
          res.end('forbidden')
          return
        }
        const data = await fs.readFile(filePath)
        const ext = path.extname(filePath)
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        res.end(data)
        return
      }

      res.writeHead(404)
      res.end('not found')
    } catch (err) {
      res.writeHead(500)
      res.end(String(err))
    }
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.on('console', (msg) => console.log('[browser]', msg.text()))
  page.on('pageerror', (err) => console.error('[pageerror]', err))
  page.setDefaultTimeout(600000)

  console.log('Loading MindAR compiler…')
  await page.goto(`http://127.0.0.1:${port}/`)
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 })

  const dataUrl = `data:image/png;base64,${pngBuf.toString('base64')}`
  console.log('Compiling Al Ahly crest…')

  const progressTimer = setInterval(async () => {
    const p = await page.evaluate(() => window.__progress ?? 0)
    if (p) console.log(`  progress: ${Math.round(p)}%`)
  }, 5000)

  const b64 = await page.evaluate(async (url) => window.__compile(url), dataUrl)
  clearInterval(progressTimer)

  const mindBuf = Buffer.from(b64, 'base64')
  await fs.writeFile(mindPath, mindBuf)
  console.log(`Wrote ${mindPath} (${mindBuf.length} bytes)`)

  await browser.close()
  server.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
