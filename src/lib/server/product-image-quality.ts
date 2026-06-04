const MIN_IMAGE_BYTES = 8_000;
const MIN_IMAGE_EDGE = 300;

type ImageDimensions = {
  width?: number;
  height?: number;
  bytes: number;
};

function dataUrlBuffer(url: string) {
  const match = url.match(/^data:[^;]+;base64,(.*)$/);

  return match ? Buffer.from(match[1], "base64") : undefined;
}

function imageDimensions(url: string): ImageDimensions | undefined {
  const buffer = dataUrlBuffer(url);

  if (!buffer) {
    return undefined;
  }

  if (buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG") {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
      bytes: buffer.length,
    };
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;

    while (offset < buffer.length) {
      while (buffer[offset] === 0xff) {
        offset += 1;
      }

      const marker = buffer[offset];
      offset += 1;
      const length = buffer.readUInt16BE(offset);
      const isSizeMarker = [
        0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
      ].includes(marker);

      if (isSizeMarker) {
        return {
          width: buffer.readUInt16BE(offset + 5),
          height: buffer.readUInt16BE(offset + 3),
          bytes: buffer.length,
        };
      }

      offset += length;
    }
  }

  return { bytes: buffer.length };
}

export function isStorefrontImageUsable(url: string) {
  if (!url.startsWith("data:")) {
    return true;
  }

  const dimensions = imageDimensions(url);

  if (!dimensions || dimensions.bytes < MIN_IMAGE_BYTES) {
    return false;
  }

  if (!dimensions.width || !dimensions.height) {
    return true;
  }

  return Math.max(dimensions.width, dimensions.height) >= MIN_IMAGE_EDGE;
}
