import { readFileSync, writeFileSync } from 'node:fs'
import { deflateSync, inflateSync } from 'node:zlib'

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const crcTable = new Uint32Array(256)

for (let value = 0; value < 256; value += 1) {
  let crc = value
  for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  crcTable[value] = crc >>> 0
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, checksum])
}

function decodePng(path) {
  const source = readFileSync(path)
  if (!source.subarray(0, 8).equals(pngSignature)) throw new Error(`${path} is not a PNG`)

  let header
  const imageData = []
  for (let offset = 8; offset < source.length;) {
    const length = source.readUInt32BE(offset)
    const type = source.toString('ascii', offset + 4, offset + 8)
    const data = source.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') header = Buffer.from(data)
    if (type === 'IDAT') imageData.push(data)
    offset += length + 12
    if (type === 'IEND') break
  }

  const width = header.readUInt32BE(0)
  const height = header.readUInt32BE(4)
  if (header[8] !== 8 || header[9] !== 6 || header[12] !== 0) {
    throw new Error(`${path} must be an 8-bit RGBA PNG`)
  }

  const stride = width * 4
  const packed = inflateSync(Buffer.concat(imageData))
  const pixels = new Uint8Array(stride * height)
  let packedOffset = 0

  for (let y = 0; y < height; y += 1) {
    const filter = packed[packedOffset++]
    const rowOffset = y * stride
    for (let x = 0; x < stride; x += 1) {
      const raw = packed[packedOffset++]
      const left = x >= 4 ? pixels[rowOffset + x - 4] : 0
      const above = y > 0 ? pixels[rowOffset - stride + x] : 0
      const upperLeft = y > 0 && x >= 4 ? pixels[rowOffset - stride + x - 4] : 0
      let predictor = 0

      if (filter === 1) predictor = left
      else if (filter === 2) predictor = above
      else if (filter === 3) predictor = Math.floor((left + above) / 2)
      else if (filter === 4) {
        const estimate = left + above - upperLeft
        const leftDistance = Math.abs(estimate - left)
        const aboveDistance = Math.abs(estimate - above)
        const cornerDistance = Math.abs(estimate - upperLeft)
        predictor = leftDistance <= aboveDistance && leftDistance <= cornerDistance ? left : aboveDistance <= cornerDistance ? above : upperLeft
      } else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`)

      pixels[rowOffset + x] = (raw + predictor) & 0xff
    }
  }

  return { header, height, pixels, stride, width }
}

function encodePng({ header, height, pixels, stride, width }, path) {
  const rows = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (stride + 1)
    rows[rowOffset] = 0
    Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(rows, rowOffset + 1)
  }

  const output = Buffer.concat([
    pngSignature,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
  writeFileSync(path, output)
}

function removeLightPink({ pixels, width, height }) {
  let removed = 0
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const index = pixel * 4
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]
    if (pixels[index + 3] > 0 && red > 220 && green > 160 && blue > 160 && red - green > 20 && Math.abs(green - blue) < 50) {
      pixels[index + 3] = 0
      removed += 1
    }
  }
  return removed
}

function removeNavy({ pixels, width, height }) {
  let removed = 0
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const index = pixel * 4
    if (pixels[index] < 45 && pixels[index + 1] < 60 && pixels[index + 2] < 82 && pixels[index + 2] - pixels[index] < 60) {
      pixels[index + 3] = 0
      removed += 1
    }
  }
  return removed
}

const welcome = decodePng('src/assets/admin-welcome.png')
const welcomeRemoved = removeLightPink(welcome)
encodePng(welcome, 'src/assets/admin-welcome-transparent.png')

const features = decodePng('src/assets/admin-features.png')
const featuresRemoved = removeNavy(features)
encodePng(features, 'src/assets/admin-features-transparent.png')

console.log(`Removed backgrounds: welcome ${welcomeRemoved}, features ${featuresRemoved}`)