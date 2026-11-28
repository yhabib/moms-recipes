// Turns an image file the user picked into a small JPEG that the backend
// accepts: at most MAX_PHOTO_DIMENSION pixels on the longer side and at most
// MAX_PHOTO_BYTES in size.

/** Longest side, in pixels, of a resized photo. */
export const MAX_PHOTO_DIMENSION = 1200;

/** Largest photo, in bytes, that the backend accepts (1 MiB). */
export const MAX_PHOTO_BYTES = 1_048_576;

/** JPEG quality of the first encoding attempt. */
export const START_QUALITY = 0.85;

/** Lowest JPEG quality tried before the dimensions are shrunk. */
export const MIN_QUALITY = 0.5;

/** How much the quality is lowered between two attempts. */
export const QUALITY_STEP = 0.1;

/** Factor applied to the dimensions when the lowest quality is still too big. */
export const SHRINK_FACTOR = 0.8;

const NOT_AN_IMAGE = "This file is not an image we can read.";

export interface Size {
  width: number;
  height: number;
}

/** One encoding attempt: `scale` applies to the size given by `fitWithin`. */
export interface Attempt {
  scale: number;
  quality: number;
}

export const FIRST_ATTEMPT: Attempt = { scale: 1, quality: START_QUALITY };

/**
 * Scales `width` x `height` so that the longer side is at most `max`, keeping
 * the aspect ratio. Never scales up. Rounds to whole pixels, at least 1.
 */
export function fitWithin(width: number, height: number, max: number): Size {
  const ratio = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/** The canvas size for an attempt on an image of the given natural size. */
export function attemptSize(width: number, height: number, scale: number): Size {
  const base = fitWithin(width, height, MAX_PHOTO_DIMENSION);
  const longest = Math.max(base.width, base.height);
  return fitWithin(base.width, base.height, Math.max(1, Math.round(longest * scale)));
}

/**
 * Decides what to try after an attempt produced `byteSize` bytes: `null` when
 * it fits, otherwise a lower quality, or, once the quality is at its minimum,
 * smaller dimensions starting again from the first quality.
 */
export function nextAttempt(previous: Attempt, byteSize: number): Attempt | null {
  if (byteSize <= MAX_PHOTO_BYTES) {
    return null;
  }
  if (previous.quality > MIN_QUALITY) {
    const lowered = Math.round((previous.quality - QUALITY_STEP) * 100) / 100;
    return { scale: previous.scale, quality: Math.max(MIN_QUALITY, lowered) };
  }
  return { scale: previous.scale * SHRINK_FACTOR, quality: START_QUALITY };
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function decodeWithBitmap(file: File): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    release: () => bitmap.close(),
  };
}

function decodeWithImageElement(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        release: () => URL.revokeObjectURL(url),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(NOT_AN_IMAGE));
    };
    img.src = url;
  });
}

async function decode(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      return await decodeWithBitmap(file);
    } catch {
      // Some browsers do not support the options or the format here:
      // let an <img> element try.
    }
  }
  return decodeWithImageElement(file);
}

function encodeJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the photo."))),
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Decodes an image file, scales it down to fit within MAX_PHOTO_DIMENSION and
 * encodes it as a JPEG of at most MAX_PHOTO_BYTES.
 */
export async function resizePhoto(
  file: File,
): Promise<{ contentType: "image/jpeg"; data: Uint8Array }> {
  // Some platforms report no type at all; decoding decides for those.
  if (file.type !== "" && !file.type.startsWith("image/")) {
    throw new Error(NOT_AN_IMAGE);
  }
  const image = await decode(file);
  try {
    if (image.width < 1 || image.height < 1) {
      throw new Error(NOT_AN_IMAGE);
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare the photo.");
    }

    let attempt: Attempt | null = FIRST_ATTEMPT;
    while (attempt) {
      const size = attemptSize(image.width, image.height, attempt.scale);
      if (canvas.width !== size.width || canvas.height !== size.height) {
        canvas.width = size.width;
        canvas.height = size.height;
      }
      // JPEG has no transparency: fill white so transparent areas don't turn black.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size.width, size.height);
      context.drawImage(image.source, 0, 0, size.width, size.height);

      const blob = await encodeJpeg(canvas, attempt.quality);
      const next = nextAttempt(attempt, blob.size);
      if (!next) {
        return { contentType: "image/jpeg", data: new Uint8Array(await blob.arrayBuffer()) };
      }
      attempt = next;
    }
    // Unreachable: the loop only ends by returning.
    throw new Error("Could not make the photo small enough.");
  } finally {
    image.release();
  }
}
