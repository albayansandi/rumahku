// Generates solid colored valid PNG icons with RGBA raster buffer
import fs from 'node:fs';
import zlib from 'node:zlib';

function createPNG(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk (scanlines: 1 filter byte + width * 4 bytes per line)
  const lineSize = 1 + width * 4;
  const rawData = Buffer.alloc(lineSize * height);

  for (let y = 0; y < height; y++) {
    const lineStart = y * lineSize;
    rawData[lineStart] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const px = lineStart + 1 + x * 4;
      // Draw a stylish emerald/slate rounded icon
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const isInsideSafeSquare = (Math.abs(x - cx) < width * 0.45) && (Math.abs(y - cy) < height * 0.45);
      
      if (isInsideSafeSquare) {
        // Gradient from emerald-600 to slate-900
        const factor = y / height;
        rawData[px] = Math.round(16 * (1 - factor) + 15 * factor);     // R
        rawData[px + 1] = Math.round(185 * (1 - factor) + 23 * factor); // G
        rawData[px + 2] = Math.round(129 * (1 - factor) + 42 * factor); // B
        rawData[px + 3] = 255;
      } else {
        rawData[px] = 15;
        rawData[px + 1] = 23;
        rawData[px + 2] = 42;
        rawData[px + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  
  // CRC-32 calculation
  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (c ^ buf[n]);
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180));
console.log('PNG Icons successfully generated in /public');
