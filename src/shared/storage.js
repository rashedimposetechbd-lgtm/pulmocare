import { saveMediaItem, deleteMediaItem } from './db.js';

/**
 * Resizes and compresses an image in the browser using HTML5 Canvas.
 * Outputs a WebP blob with maximum dimensions of 1600x1600 at ~82% quality.
 */
export async function compressImage(file, maxDimension = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    // If SVG, return directly without rasterizing
    if (file.type === 'image/svg+xml') {
      resolve({ blob: file, width: 200, height: 200, dataUrl: null });
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ blob: file, width: img.width, height: img.height });
              return;
            }
            resolve({ blob, width, height });
          },
          'image/webp',
          quality
        );
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function getCandidateUploadUrls() {
  const urls = [];
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    const adminIdx = path.indexOf('/admin');
    if (adminIdx > 0) {
      const base = path.substring(0, adminIdx);
      urls.push(`${base}/api/upload`);
      urls.push(`${base}/api/upload.php`);
    }
  }
  urls.push('../api/upload');
  urls.push('../api/upload.php');
  urls.push('/api/upload');
  urls.push('/api/upload.php');
  return [...new Set(urls)];
}

/**
 * Uploads an image file to the local server folder / public uploads directory (cPanel folder compatible)
 * and registers it in the media library.
 */
export async function uploadImageFile(file, alt = '') {
  const { blob, width, height } = await compressImage(file);
  const cleanName = (file.name || 'image.webp')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanName}.webp`;

  let uploadedUrl = '';
  let finalSize = blob.size;
  let serverMediaId = '';
  const candidateUrls = getCandidateUploadUrls();

  // Try candidate upload endpoints
  for (const endpoint of candidateUrls) {
    try {
      const formData = new FormData();
      formData.append('file', blob, fileName);

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          let finalUrl = data.url;
          if (typeof window !== 'undefined') {
            const adminIdx = window.location.pathname.indexOf('/admin');
            const base = adminIdx > 0 ? window.location.pathname.substring(0, adminIdx) : '';
            if (base && finalUrl.startsWith('/uploads/')) {
              finalUrl = `${base}${finalUrl}`;
            }
          }
          uploadedUrl = finalUrl;
          if (data.size) finalSize = data.size;
          if (data.id) serverMediaId = data.id;
          break;
        }
      } else {
        const errJson = await res.json().catch(() => null);
        console.warn(`[Storage] Endpoint ${endpoint} returned ${res.status}:`, errJson);
      }
    } catch (err) {
      console.warn(`[Storage] Endpoint ${endpoint} connection failed:`, err);
    }
  }

  // Resilient fallback: Convert to data URL so user work is NEVER lost even if server drops connection
  if (!uploadedUrl) {
    console.warn('[Storage] All server upload endpoints failed. Falling back to local data URL.');
    uploadedUrl = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  }

  const mediaId = serverMediaId || `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const mediaDoc = {
    id: mediaId,
    url: uploadedUrl,
    storagePath: uploadedUrl.startsWith('/uploads/') ? uploadedUrl.slice(1) : (uploadedUrl.includes('/uploads/') ? uploadedUrl.substring(uploadedUrl.indexOf('uploads/')) : ''),
    fileName: fileName,
    size: finalSize,
    width: width || 800,
    height: height || 800,
    alt: alt || cleanName.replace(/_/g, ' ')
  };

  try {
    await saveMediaItem(mediaId, mediaDoc);
  } catch (err) {
    console.warn('[Storage] Notice: Media metadata registration:', err.message);
  }

  return mediaDoc;
}

/**
 * Deletes an image from the local uploads folder and from media database.
 */
export async function removeImageFile(mediaId, storagePath) {
  try {
    if (storagePath && storagePath.startsWith('uploads/')) {
      const filename = storagePath.replace('uploads/', '');
      await fetch(`/api/media/${encodeURIComponent(filename)}`, { method: 'DELETE' });
    }
  } catch (err) {
    console.warn('[Storage] Server file delete notice:', err);
  }

  try {
    await deleteMediaItem(mediaId);
  } catch (err) {
    console.warn('[Storage] db media item delete notice:', err);
  }
}
