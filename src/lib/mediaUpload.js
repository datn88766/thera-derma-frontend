import { buildApiUrl, getToken, resolveUploadsUrl } from '@/api/client';

export const CATALOG_IMAGE_ACCEPT =
  '.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.svg,.avif,.heic,.ico,image/*';

export const CATALOG_VIDEO_ACCEPT = 'video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov';

export function resolveMediaUrl(url) {
  return resolveUploadsUrl(url);
}

function parseUploadResponse(payload, response) {
  if (!response.ok || payload?.ok === false) {
    throw new Error(
      payload?.error || payload?.message || `Upload thất bại (${response.status})`,
    );
  }
  const url = payload?.data?.url || payload?.url;
  if (!url) throw new Error('Upload không trả về URL media');
  return url;
}

export async function uploadCatalogImage(file) {
  const token = getToken();
  if (!token) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(buildApiUrl('/upload/blog-thumbnail'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));
  return parseUploadResponse(payload, response);
}

export async function uploadCatalogMedia(file) {
  const token = getToken();
  if (!token) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

  const formData = new FormData();
  formData.append('media', file);

  const response = await fetch(buildApiUrl('/upload/blog-media'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));
  const url = parseUploadResponse(payload, response);
  const type =
    payload?.data?.type || (String(file.type || '').startsWith('video/') ? 'video' : 'image');
  return { url, type };
}
