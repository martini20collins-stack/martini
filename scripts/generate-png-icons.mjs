import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, drawFn) {
  // RGBA buffer
  const stride = width * 4;
  const rawData = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let table = crc32.table;
    if (!table) {
      table = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[i] = c;
      }
      crc32.table = table;
    }
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const chunkData = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(chunkData), 0);
    return Buffer.concat([len, chunkData, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function parkingDraw(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;

  // Normalized coords -1 to 1
  const nx = (x - cx) / (w / 2);
  const ny = (y - cy) / (h / 2);
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background color: Deep indigo gradient (#1e1b4b to #4338ca)
  const gradT = (ny + 1) / 2;
  let r = Math.round(30 + gradT * 37);
  let g = Math.round(27 + gradT * 29);
  let b = Math.round(75 + gradT * 127);
  let a = 255;

  // If not maskable, round corners (squircle)
  if (!isMaskable) {
    const cornerR = 0.82;
    const cornerX = Math.max(0, Math.abs(nx) - (1 - cornerR));
    const cornerY = Math.max(0, Math.abs(ny) - (1 - cornerR));
    if (cornerX * cornerX + cornerY * cornerY > cornerR * cornerR) {
      return [0, 0, 0, 0];
    }
  }

  // Safe area scale
  const scale = isMaskable ? 0.72 : 0.88;
  const sx = nx / scale;
  const sy = ny / scale;

  // White circle badge for P in the center
  const pCircleRadius = 0.52;
  const circleDist = Math.sqrt(sx * sx + (sy + 0.12) * (sy + 0.12));
  if (circleDist < pCircleRadius) {
    // Inside badge circle
    // Draw "P" in dark indigo
    const px = sx;
    const py = sy + 0.12;
    // Vertical stem of P: x in [-0.18, -0.06], y in [-0.32, 0.32]
    const inStem = px >= -0.18 && px <= -0.06 && py >= -0.32 && py <= 0.32;
    // Loop of P: outer circle centered at (0.02, -0.10) with radius 0.22, inner radius 0.10
    const loopDist = Math.sqrt((px - 0.02) * (px - 0.02) + (py + 0.10) * (py + 0.10));
    const inLoopOuter = loopDist <= 0.22 && px >= -0.06;
    const inLoopHole = loopDist <= 0.10 && px >= -0.06;

    if (inStem || (inLoopOuter && !inLoopHole)) {
      return [30, 27, 75, 255]; // Dark indigo
    }
    return [255, 255, 255, 255]; // White circle
  }

  // Bottom cyan/emerald tag: y in [0.45, 0.72], x in [-0.55, 0.55]
  if (sy >= 0.48 && sy <= 0.78 && Math.abs(sx) <= 0.55) {
    // Stylized car badge pill
    return [56, 189, 248, 255]; // Sky cyan
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PNG icons for PWA...');
const pwa192 = createPng(192, 192, (x, y, w, h) => parkingDraw(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

const pwa512 = createPng(512, 512, (x, y, w, h) => parkingDraw(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

const pwaMaskable512 = createPng(512, 512, (x, y, w, h) => parkingDraw(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);

const appleTouch = createPng(180, 180, (x, y, w, h) => parkingDraw(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

const favicon32 = createPng(32, 32, (x, y, w, h) => parkingDraw(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon32);

console.log('All PWA PNG icons successfully generated in /public!');
