import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const width = 960;
const height = 640;
const outputDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public/properties",
);

const photos = [
  { name: "vila-moraca-living.png", sky: [92, 58, 42], ground: [196, 154, 118], accent: [74, 48, 36] },
  { name: "vila-moraca-kitchen.png", sky: [78, 72, 64], ground: [214, 196, 176], accent: [120, 92, 68] },
  { name: "vila-moraca-bedroom.png", sky: [62, 48, 58], ground: [168, 124, 108], accent: [48, 36, 42] },
  { name: "vila-moraca-terrace.png", sky: [118, 142, 156], ground: [176, 148, 120], accent: [64, 78, 72] },
  { name: "stan-preko-living.png", sky: [86, 64, 48], ground: [188, 160, 132], accent: [58, 42, 34] },
  { name: "stan-preko-kitchen.png", sky: [96, 88, 78], ground: [206, 190, 168], accent: [92, 78, 64] },
  { name: "stan-preko-bedroom.png", sky: [70, 54, 62], ground: [160, 122, 112], accent: [52, 38, 46] },
  { name: "stan-preko-terrace.png", sky: [104, 132, 148], ground: [168, 142, 116], accent: [58, 72, 66] },
  { name: "kuca-varos-living.png", sky: [98, 62, 40], ground: [184, 140, 104], accent: [82, 50, 32] },
  { name: "kuca-varos-kitchen.png", sky: [84, 76, 66], ground: [198, 180, 158], accent: [110, 86, 64] },
  { name: "kuca-varos-bedroom.png", sky: [68, 46, 52], ground: [154, 112, 102], accent: [46, 32, 38] },
  { name: "kuca-varos-terrace.png", sky: [126, 150, 158], ground: [170, 146, 118], accent: [72, 86, 78] },
];

function crc32(buffer) {
  let crc = ~0;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function mix(from, to, amount) {
  return from.map((channel, index) =>
    Math.round(channel + (to[index] - channel) * amount),
  );
}

function paint(palette, x, y) {
  const horizon = height * 0.62;
  const vertical = y / (height - 1);
  const base =
    y < horizon
      ? mix(palette.sky, [232, 214, 196], vertical * 0.35)
      : mix(palette.ground, [92, 72, 58], (y - horizon) / (height - horizon));
  const windowLeft = width * 0.18;
  const windowRight = width * 0.82;
  const windowTop = height * 0.16;
  const windowBottom = height * 0.58;
  const inWindow =
    x > windowLeft && x < windowRight && y > windowTop && y < windowBottom;
  const frame =
    inWindow &&
    (x < windowLeft + 10 ||
      x > windowRight - 10 ||
      y < windowTop + 10 ||
      y > windowBottom - 10 ||
      Math.abs(x - width / 2) < 4);
  if (frame) {
    return palette.accent;
  }
  if (inWindow) {
    return mix(base, [244, 236, 226], 0.45);
  }
  const sill = y > height * 0.72 && y < height * 0.8;
  if (sill) {
    return mix(base, palette.accent, 0.55);
  }
  return base;
}

function png(palette) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [red, green, blue] = paint(palette, x, y);
      const offset = row + 1 + x * 4;
      raw[offset] = red;
      raw[offset + 1] = green;
      raw[offset + 2] = blue;
      raw[offset + 3] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(outputDir, { recursive: true });
for (const photo of photos) {
  writeFileSync(join(outputDir, photo.name), png(photo));
}
