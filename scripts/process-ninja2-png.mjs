/**
 * Regenerates public/productos/ninja2.png from ninja2.jpg (white → transparent).
 * Run: npm i sharp -D && node scripts/process-ninja2-png.mjs
 */
import sharp from "sharp";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const input = join(root, "public/productos/ninja2.jpg");
const output = join(root, "public/productos/ninja2.png");

function isNearWhite(r, g, b, a) {
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  return a < 8 || (r > 232 && g > 232 && b > 232 && maxChannel - minChannel < 28);
}

const maxEdge = 960;
const { data, info } = await sharp(input)
  .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: false })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const i = (y * width + x) * channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (isNearWhite(r, g, b, a)) {
      data[i + 3] = 0;
    }
  }
}

await sharp(data, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log("Wrote", output);
