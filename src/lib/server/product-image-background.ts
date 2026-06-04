import { createHash } from "crypto";
import sharp from "sharp";

type BackgroundColor = {
  red: number;
  green: number;
  blue: number;
};

type PixelData = Buffer | Uint8ClampedArray;

const cleanedImageCache = new Map<string, string>();
const MAX_CACHE_ITEMS = 250;

function luminance(red: number, green: number, blue: number) {
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function colorDistance(red: number, green: number, blue: number, backgroundColor: BackgroundColor) {
  return Math.hypot(red - backgroundColor.red, green - backgroundColor.green, blue - backgroundColor.blue);
}

function estimateEdgeBackgroundColor(data: PixelData, width: number, height: number): BackgroundColor | undefined {
  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let count = 0;

  const addPixel = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const alpha = data[offset + 3];

    if (alpha < 8 || luminance(red, green, blue) < 205) {
      return;
    }

    redTotal += red;
    greenTotal += green;
    blueTotal += blue;
    count += 1;
  };

  for (let x = 0; x < width; x += 1) {
    addPixel(x, 0);
    addPixel(x, height - 1);
  }

  for (let y = 1; y < height - 1; y += 1) {
    addPixel(0, y);
    addPixel(width - 1, y);
  }

  return count > 0
    ? {
        red: redTotal / count,
        green: greenTotal / count,
        blue: blueTotal / count,
      }
    : undefined;
}

function isBackgroundPixel(data: PixelData, pixelIndex: number, backgroundColor?: BackgroundColor) {
  const offset = pixelIndex * 4;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const alpha = data[offset + 3];
  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const pixelLuminance = luminance(red, green, blue);

  if (alpha < 8 || (pixelLuminance > 236 && maxChannel - minChannel < 36)) {
    return true;
  }

  return Boolean(
    backgroundColor &&
      pixelLuminance > 222 &&
      luminance(backgroundColor.red, backgroundColor.green, backgroundColor.blue) > 220 &&
      colorDistance(red, green, blue, backgroundColor) < 38 &&
      maxChannel - minChannel < 48,
  );
}

function dataUrlBuffer(src: string) {
  const match = src.match(/^data:image\/[^;]+;base64,(.*)$/);

  return match ? Buffer.from(match[1], "base64") : undefined;
}

function rememberCleanedImage(cacheKey: string, value: string) {
  cleanedImageCache.set(cacheKey, value);

  if (cleanedImageCache.size > MAX_CACHE_ITEMS) {
    const oldestKey = cleanedImageCache.keys().next().value;

    if (oldestKey) {
      cleanedImageCache.delete(oldestKey);
    }
  }
}

export async function removeProductImageBackground(src: string) {
  const buffer = dataUrlBuffer(src);

  if (!buffer) {
    return src;
  }

  const cacheKey = createHash("sha1").update(buffer).digest("hex");
  const cached = cleanedImageCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const { data, info } = await sharp(buffer)
      .rotate()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;

    if (channels !== 4 || !width || !height) {
      return src;
    }

    const totalPixels = width * height;
    const backgroundColor = estimateEdgeBackgroundColor(data, width, height);
    const visited = new Uint8Array(totalPixels);
    const queue: number[] = [];

    const addPixel = (pixelIndex: number) => {
      if (visited[pixelIndex] || !isBackgroundPixel(data, pixelIndex, backgroundColor)) {
        return;
      }

      visited[pixelIndex] = 1;
      queue.push(pixelIndex);
    };

    for (let x = 0; x < width; x += 1) {
      addPixel(x);
      addPixel((height - 1) * width + x);
    }

    for (let y = 0; y < height; y += 1) {
      addPixel(y * width);
      addPixel(y * width + width - 1);
    }

    for (let index = 0; index < queue.length; index += 1) {
      const pixelIndex = queue[index];
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      if (x > 0) addPixel(pixelIndex - 1);
      if (x < width - 1) addPixel(pixelIndex + 1);
      if (y > 0) addPixel(pixelIndex - width);
      if (y < height - 1) addPixel(pixelIndex + width);
    }

    if (queue.length === 0) {
      rememberCleanedImage(cacheKey, src);
      return src;
    }

    for (const pixelIndex of queue) {
      data[pixelIndex * 4 + 3] = 0;
    }

    const output = await sharp(data, { raw: { width, height, channels: 4 } })
      .webp({ quality: 92 })
      .toBuffer();
    const result = `data:image/webp;base64,${output.toString("base64")}`;

    rememberCleanedImage(cacheKey, result);
    return result;
  } catch {
    return src;
  }
}
