// Generates PWA PNG icons without any image dependency:
// rounded-square accent background + a 3-waypoint "path" glyph,
// rasterized with signed distance functions and encoded as PNG by hand.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const ACCENT = [0x35, 0x56, 0xc9]
const WHITE = [0xff, 0xff, 0xff]

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(size, pixels) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const sdRoundedRect = (x, y, half, r) => {
  const qx = Math.abs(x) - (half - r)
  const qy = Math.abs(y) - (half - r)
  const ox = Math.max(qx, 0)
  const oy = Math.max(qy, 0)
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(ox, oy) - r
}

const sdSegment = (px, py, ax, ay, bx, by) => {
  const abx = bx - ax
  const aby = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby)))
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t))
}

function drawIcon(size, { rounded }) {
  const s = size / 512
  const pts = [[140, 360], [256, 200], [372, 330]].map(([x, y]) => [x * s, y * s])
  const pixels = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x + 0.5 - size / 2
      const cy = y + 0.5 - size / 2
      const bg = rounded ? sdRoundedRect(cx, cy, size / 2, size * 0.215) : -1
      const i = (y * size + x) * 4
      if (bg > 0.5) continue // transparent
      const alpha = rounded ? Math.round(255 * Math.min(1, 0.5 - bg)) : 255
      let color = ACCENT
      const px = x + 0.5
      const py = y + 0.5
      const stroke = Math.min(
        sdSegment(px, py, ...pts[0], ...pts[1]),
        sdSegment(px, py, ...pts[1], ...pts[2]),
      ) - 14 * s
      const dots = Math.min(...pts.map(([ax, ay]) => Math.hypot(px - ax, py - ay))) - 30 * s
      if (Math.min(stroke, dots) < 0) color = WHITE
      pixels[i] = color[0]
      pixels[i + 1] = color[1]
      pixels[i + 2] = color[2]
      pixels[i + 3] = alpha
    }
  }
  return encodePng(size, pixels)
}

mkdirSync(join(root, 'public/icons'), { recursive: true })
writeFileSync(join(root, 'public/icons/icon-512.png'), drawIcon(512, { rounded: true }))
writeFileSync(join(root, 'public/icons/icon-192.png'), drawIcon(192, { rounded: true }))
writeFileSync(join(root, 'public/icons/apple-touch-icon.png'), drawIcon(180, { rounded: false }))
console.log('icons written to public/icons/')
