import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, a = 255) {
  // Simple PNG creator with valid IHDR, IDAT, IEND chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data: filter byte (0) + width * 4 bytes per row
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  // Gradient + brand design in pure pixel buffer
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter None

    const yProgress = y / height;
    const cr = Math.round(201 - yProgress * 150); // Red to deep blue
    const cg = Math.round(59 - yProgress * 20);
    const cb = Math.round(43 + yProgress * 55);

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Calculate distance to center
      const dx = (x - width / 2) / (width / 2);
      const dy = (y - height / 2) / (height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.35) {
        // Vault Gold Center
        rawData[pxOffset] = 245;     // R
        rawData[pxOffset + 1] = 158; // G
        rawData[pxOffset + 2] = 11;  // B
        rawData[pxOffset + 3] = 255; // A
      } else if (dist < 0.45) {
        // Gold rim
        rawData[pxOffset] = 253;
        rawData[pxOffset + 1] = 224;
        rawData[pxOffset + 2] = 71;
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = cr;
        rawData[pxOffset + 1] = cg;
        rawData[pxOffset + 2] = cb;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
    }
  }
  return ~c >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createPNG(192, 192));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512, 512));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPNG(512, 512));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180));
console.log('Generated PNG icons successfully.');
