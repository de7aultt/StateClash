import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function createPng(width, height, drawPixel) {
  const bytesPerPixel = 4;
  const rowSize = width * bytesPerPixel;
  const rawData = Buffer.alloc(height * (rowSize + 1));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = deflateSync(rawData, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([length, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function renderCoin(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const d = dist(x, y, cx, cy);
  const outerR = 27;
  const innerR = 21;
  if (d > outerR + 1) return [0, 0, 0, 0];
  const outerEdge = clamp(1 - (d - outerR), 0, 1);
  if (d > innerR) {
    const rimShade = 0.8 + 0.4 * ((cx - x + cy - y) / (w * 1.2));
    return [Math.round(250 * rimShade), Math.round(195 * rimShade), Math.round(35 * rimShade), Math.round(255 * outerEdge)];
  }
  const diamondDist = Math.abs(x - cx) + Math.abs(y - cy);
  if (diamondDist < 12) {
    return [255, 255, 240, 255];
  }
  const innerShade = 0.7 + 0.3 * ((y - cy) / innerR);
  return [Math.round(225 * innerShade), Math.round(165 * innerShade), Math.round(20 * innerShade), 255];
}

function renderSoundOn(x, y, w, h) {
  if (x >= 14 && x <= 24 && y >= 24 && y <= 40) {
    return [56, 189, 248, 255];
  }
  if (x > 22 && x <= 36) {
    const progress = (x - 22) / 14;
    const topY = 24 - progress * 14;
    const bottomY = 40 + progress * 14;
    if (y >= topY && y <= bottomY) {
      return [56, 189, 248, 255];
    }
  }
  const dCenter = dist(x, y, 26, 32);
  if (x > 38 && Math.abs(dCenter - 18) <= 2.2 && Math.abs(y - 32) <= 16) {
    return [56, 189, 248, 255];
  }
  if (x > 44 && Math.abs(dCenter - 26) <= 2.2 && Math.abs(y - 32) <= 22) {
    return [56, 189, 248, 255];
  }
  return [0, 0, 0, 0];
}

function renderSoundOff(x, y, w, h) {
  const slashDist = Math.abs((x - y) / Math.SQRT2);
  if (slashDist < 2.5 && x >= 10 && x <= 54 && y >= 10 && y <= 54) {
    return [244, 63, 94, 255];
  }
  if (x >= 14 && x <= 24 && y >= 24 && y <= 40) {
    return [148, 163, 184, 180];
  }
  if (x > 22 && x <= 36) {
    const progress = (x - 22) / 14;
    const topY = 24 - progress * 14;
    const bottomY = 40 + progress * 14;
    if (y >= topY && y <= bottomY) {
      return [148, 163, 184, 180];
    }
  }
  return [0, 0, 0, 0];
}

function renderPause(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const barW = 7;
  const barH = 26;
  const gap = 12;
  const inLeft = x >= cx - gap / 2 - barW && x <= cx - gap / 2 && y >= cy - barH / 2 && y <= cy + barH / 2;
  const inRight = x >= cx + gap / 2 && x <= cx + gap / 2 + barW && y >= cy - barH / 2 && y <= cy + barH / 2;
  if (inLeft || inRight) {
    return [226, 232, 240, 255];
  }
  return [0, 0, 0, 0];
}

function renderShop(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  if (x >= 14 && x <= 50 && y >= 24 && y <= 48) {
    if (y <= 28) return [56, 189, 248, 255];
    if (x === 14 || x === 50 || y === 48) return [56, 189, 248, 255];
    if (x >= 28 && x <= 36 && y >= 28 && y <= 36) return [251, 191, 36, 255];
    return [15, 23, 42, 230];
  }
  const dRoof = dist(x, y, cx, 24);
  if (dRoof <= 14 && dRoof >= 11 && y <= 24) {
    return [56, 189, 248, 255];
  }
  return [0, 0, 0, 0];
}

function renderDouble(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const d = dist(x, y, cx, cy);
  if (d > 27) return [0, 0, 0, 0];
  if (d >= 24) return [244, 63, 94, 255];
  const inCross1 = Math.abs((x - 22) - (y - 32)) < 2.5 && Math.abs(x - 22) <= 8 && Math.abs(y - 32) <= 8;
  const inCross2 = Math.abs((x - 22) + (y - 32)) < 2.5 && Math.abs(x - 22) <= 8 && Math.abs(y - 32) <= 8;
  if (inCross1 || inCross2) return [255, 255, 255, 255];
  if (x >= 34 && x <= 46 && y >= 24 && y <= 40) {
    if (y <= 27 || y >= 37) return [255, 255, 255, 255];
    if (x >= 43 && y <= 31) return [255, 255, 255, 255];
    if (x <= 37 && y >= 31) return [255, 255, 255, 255];
  }
  return [30, 41, 59, 230];
}

function renderAirdrop(x, y, w, h) {
  const cx = w / 2;
  const dChute = dist(x, y, cx, 24);
  if (dChute <= 18 && dChute >= 15 && y <= 24) {
    return [52, 211, 153, 255];
  }
  if (y > 24 && y < 38) {
    const leftLine = Math.abs((y - 24) * 0.7 - (cx - 16 - x));
    const rightLine = Math.abs((y - 24) * 0.7 - (x - cx - 16));
    if (leftLine < 1.5 || rightLine < 1.5) return [148, 163, 184, 180];
  }
  if (x >= cx - 8 && x <= cx + 8 && y >= 38 && y <= 50) {
    if (x === cx - 8 || x === cx + 8 || y === 38 || y === 50) return [52, 211, 153, 255];
    if (x >= cx - 2 && x <= cx + 2) return [251, 191, 36, 255];
    if (y >= 43 && y <= 45) return [251, 191, 36, 255];
    return [15, 23, 42, 240];
  }
  return [0, 0, 0, 0];
}

function renderLock(x, y, w, h) {
  const cx = w / 2;
  const dShackle = dist(x, y, cx, 24);
  if (dShackle <= 12 && dShackle >= 8 && y <= 24) {
    return [203, 213, 225, 255];
  }
  if (y > 22 && y <= 32) {
    if ((x >= 20 && x <= 24) || (x >= 40 && x <= 44)) {
      return [203, 213, 225, 255];
    }
  }
  if (x >= 16 && x <= 48 && y >= 30 && y <= 54) {
    const dHole = dist(x, y, cx, 40);
    if (dHole <= 3.5) return [15, 23, 42, 255];
    if (x >= cx - 1.5 && x <= cx + 1.5 && y >= 40 && y <= 47) return [15, 23, 42, 255];
    if (x === 16 || x === 48 || y === 30 || y === 54) return [251, 191, 36, 255];
    return [217, 119, 6, 255];
  }
  return [0, 0, 0, 0];
}

function renderSettings(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const d = dist(x, y, cx, cy);
  if (d <= 6) return [0, 0, 0, 0];
  if (d <= 14) return [56, 189, 248, 255];
  if (d <= 23) {
    const angle = (Math.atan2(y - cy, x - cx) + Math.PI * 2) % (Math.PI * 2);
    const toothPhase = (angle / (Math.PI / 4)) % 1;
    if (toothPhase >= 0.25 && toothPhase <= 0.75) {
      return [56, 189, 248, 255];
    }
  }
  return [0, 0, 0, 0];
}

const icons = [
  ['coin.png', renderCoin],
  ['sound-on.png', renderSoundOn],
  ['sound-off.png', renderSoundOff],
  ['pause.png', renderPause],
  ['shop.png', renderShop],
  ['double.png', renderDouble],
  ['airdrop.png', renderAirdrop],
  ['lock.png', renderLock],
  ['settings.png', renderSettings]
];

const targetDirs = [
  join(process.cwd(), 'public', 'art'),
  join(process.cwd(), 'art')
];

for (const dir of targetDirs) {
  mkdirSync(dir, { recursive: true });
}

for (const [name, fn] of icons) {
  const png = createPng(64, 64, fn);
  for (const dir of targetDirs) {
    const filePath = join(dir, name);
    writeFileSync(filePath, png);
    console.log(`Generated: ${filePath} (${png.length} bytes)`);
  }
}
