// Rasterises the flat func mark to assets/icon.png (1024²) and
// assets/splash-icon.png with no image dependencies — plain PNG encoding.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const SIZE = 1024;
const SS = 2; // supersample
const W = SIZE * SS;
const BG = [22, 22, 26];
const FG = [232, 232, 238];

// Lens geometry (vesica): two circles of radius R, centres offset ±d vertically.
const cx = W / 2, cy = W / 2;
const R = 486 * SS, d = 276 * SS;
const stroke = 46 * SS;
const ballR = 150 * SS;
const ballCy = cy + 10 * SS;
const apexY = cy - (R - d);

function lensOutline(x, y) {
  const d1 = Math.hypot(x - cx, y - (cy + d)); // top arc belongs to lower-centred circle
  const d2 = Math.hypot(x - cx, y - (cy - d));
  const onTop = Math.abs(d1 - R) < stroke / 2 && d2 < R + stroke / 2;
  const onBottom = Math.abs(d2 - R) < stroke / 2 && d1 < R + stroke / 2;
  return onTop || onBottom;
}
function cord(x, y) {
  return Math.abs(x - cx) < 7 * SS && y > apexY - stroke / 2 && y < ballCy - ballR + 6 * SS;
}
function ring(x, y) {
  const r = Math.hypot(x - cx, y - (ballCy - ballR - 2 * SS));
  return Math.abs(r - 14 * SS) < 5 * SS;
}
function ball(x, y) {
  return Math.hypot(x - cx, y - ballCy) < ballR;
}
function grid(x, y) {
  const gx = Math.abs(((x - cx) % (75 * SS)) ) < 5 * SS;
  const gy = Math.abs(((y - ballCy) % (75 * SS)) ) < 5 * SS;
  return gx || gy;
}

const px = new Float32Array(SIZE * SIZE * 3);
for (let y = 0; y < W; y++) {
  for (let x = 0; x < W; x++) {
    let c = BG;
    if (ball(x, y)) c = grid(x, y) ? BG : FG;
    else if (lensOutline(x, y) || cord(x, y) || ring(x, y)) c = FG;
    const i = ((y >> 1) * SIZE + (x >> 1)) * 3;
    px[i] += c[0] / (SS * SS);
    px[i + 1] += c[1] / (SS * SS);
    px[i + 2] += c[2] / (SS * SS);
  }
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, getPixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = getPixel(x, y);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const icon = png(SIZE, (x, y) => {
  const i = (y * SIZE + x) * 3;
  return [Math.round(px[i]), Math.round(px[i + 1]), Math.round(px[i + 2])];
});
writeFileSync('assets/icon.png', icon);
writeFileSync('assets/splash-icon.png', icon);
console.log('wrote assets/icon.png and assets/splash-icon.png');
