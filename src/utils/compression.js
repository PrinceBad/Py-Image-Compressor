// Core compression engine using HTML5 Canvas API.
// Supports percentage-based scaling (manual mode) and absolute-dimension
// profile mode with binary-search quality targeting.

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve) => canvas.toBlob((b) => resolve(b), mimeType, quality));

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const buildCanvas = (img, width, height, format) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  // JPEG needs a white background (no transparency)
  if (format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
};

/**
 * Generate a compressed blob using percentage scaling (manual mode).
 * PNG output ignores the quality parameter (lossless).
 */
export const generateCompressedBlob = async (file, quality, format, scale = 100) => {
  try {
    const img = await loadImage(file);
    const w = Math.max(1, Math.floor(img.width * (scale / 100)));
    const h = Math.max(1, Math.floor(img.height * (scale / 100)));
    const canvas = buildCanvas(img, w, h, format);
    const mimeType = `image/${format}`;
    const q = format === 'png' ? undefined : quality / 100;
    return await canvasToBlob(canvas, mimeType, q);
  } catch {
    return null;
  }
};

/**
 * Generate a blob for a DSSB profile.
 * Uses binary search on quality (1-100) to find a quality level
 * that produces a file size within [profile.minSize, profile.maxSize].
 *
 * Returns { blob, quality, withinRange, tooSmall, tooLarge } or null on error.
 */
export const generateProfileBlob = async (file, profile) => {
  try {
    const { width, height, format, minSize, maxSize } = profile;
    const img = await loadImage(file);
    const canvas = buildCanvas(img, width, height, format);
    const mimeType = `image/${format}`;

    let low = 1;
    let high = 100;
    let lastBlob = null;
    let lastQuality = 80;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const blob = await canvasToBlob(canvas, mimeType, mid / 100);
      if (!blob) break;

      lastBlob = blob;
      lastQuality = mid;

      if (blob.size >= minSize && blob.size <= maxSize) {
        // Found a quality within target range
        return { blob, quality: mid, withinRange: true, tooSmall: false, tooLarge: false };
      }

      if (blob.size < minSize) {
        low = mid + 1; // File too small → increase quality
      } else {
        high = mid - 1; // File too large → decrease quality
      }
    }

    // Return best approximation even if not in range
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
  } catch {
    return null;
  }
};
