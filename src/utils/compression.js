// Core high-performance compression engine.
// Uses createImageBitmap and OffscreenCanvas where available for fast, low-memory processing.
// Supports percentage-based scaling, modern format encoding (JPEG, WebP, PNG),
// and binary-search target file size profiling.

const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

/**
 * Loads an image source into an ImageBitmap or HTMLImageElement.
 * Uses createImageBitmap if available (3x faster, avoids huge base64 strings).
 */
const loadImageSource = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, isBitmap: true, width: bitmap.width, height: bitmap.height };
    } catch (e) {
      console.warn('createImageBitmap failed, falling back to Image element:', e);
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ source: img, isBitmap: false, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
};

/**
 * Converts a canvas (or OffscreenCanvas) to a Blob.
 */
const convertToBlob = async (canvas, isOffscreen, mimeType, quality) => {
  if (isOffscreen && canvas.convertToBlob) {
    return await canvas.convertToBlob({ type: mimeType, quality });
  }
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), mimeType, quality));
};

/**
 * Draws image source onto a canvas with background color if required (e.g. JPEG).
 */
const renderToCanvas = (sourceObj, width, height, format) => {
  let canvas;
  let isOffscreen = false;

  if (hasOffscreenCanvas) {
    try {
      canvas = new OffscreenCanvas(width, height);
      isOffscreen = true;
    } catch {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
    }
  } else {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d');
  
  // Format-specific background: JPEG doesn't support transparency, fill with pure white
  if (format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw scaled image
  ctx.drawImage(sourceObj.source, 0, 0, width, height);
  return { canvas, isOffscreen };
};

/**
 * Generate a compressed blob using percentage scaling (manual mode).
 * Supports JPEG, WebP, and PNG.
 */
export const generateCompressedBlob = async (file, quality, format = 'jpeg', scale = 100) => {
  let loaded = null;
  try {
    loaded = await loadImageSource(file);
    const w = Math.max(1, Math.floor(loaded.width * (scale / 100)));
    const h = Math.max(1, Math.floor(loaded.height * (scale / 100)));

    const { canvas, isOffscreen } = renderToCanvas(loaded, w, h, format);
    const mimeType = `image/${format}`;
    const q = format === 'png' ? undefined : Math.max(0.01, Math.min(1.0, quality / 100));

    const blob = await convertToBlob(canvas, isOffscreen, mimeType, q);
    return blob;
  } catch (err) {
    console.error('Compression error:', err);
    return null;
  } finally {
    if (loaded && loaded.isBitmap && loaded.source.close) {
      loaded.source.close();
    }
  }
};

/**
 * Generate a blob for a DSSB profile.
 * Uses binary search on quality (1-100) to find a quality level
 * that produces a file size within [profile.minSize, profile.maxSize].
 */
export const generateProfileBlob = async (file, profile) => {
  let loaded = null;
  try {
    const { width, height, format, minSize, maxSize } = profile;
    loaded = await loadImageSource(file);
    const { canvas, isOffscreen } = renderToCanvas(loaded, width, height, format);
    const mimeType = `image/${format}`;

    let low = 1;
    let high = 100;
    let lastBlob = null;
    let lastQuality = 80;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const blob = await convertToBlob(canvas, isOffscreen, mimeType, mid / 100);
      if (!blob) break;

      lastBlob = blob;
      lastQuality = mid;

      if (blob.size >= minSize && blob.size <= maxSize) {
        return { blob, quality: mid, withinRange: true, tooSmall: false, tooLarge: false };
      }

      if (blob.size < minSize) {
        low = mid + 1; // File too small → increase quality
      } else {
        high = mid - 1; // File too large → decrease quality
      }
    }

    // Return closest result
    if (lastBlob) {
      return {
        blob: lastBlob,
        quality: lastQuality,
        withinRange: false,
        tooSmall: lastBlob.size < minSize,
        tooLarge: lastBlob.size > maxSize,
      };
    }
    return null;
  } catch (err) {
    console.error('Profile compression error:', err);
    return null;
  } finally {
    if (loaded && loaded.isBitmap && loaded.source.close) {
      loaded.source.close();
    }
  }
};
