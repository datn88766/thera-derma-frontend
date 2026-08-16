export const BLOG_IMAGE_ACCEPT =
  '.jpg,.jpeg,.jpe,.jfif,.pjp,.pjpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.svg,.avif,.heic,.heif,.ico,image/*';

export const BLOG_CONTENT_MEDIA_ACCEPT = `${BLOG_IMAGE_ACCEPT},video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov`;

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.jpe',
  '.jfif',
  '.pjp',
  '.pjpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.svg',
  '.avif',
  '.heic',
  '.heif',
  '.ico',
]);

export function isAllowedBlogImageFile(file) {
  if (!file) return false;
  if (String(file.type || '').startsWith('image/')) return true;
  const name = String(file.name || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  if (dot === -1) return false;
  return IMAGE_EXTENSIONS.has(name.slice(dot));
}

export function isAllowedBlogContentMediaFile(file) {
  if (!file) return false;
  if (isAllowedBlogImageFile(file)) return true;
  if (String(file.type || '').startsWith('video/')) return true;
  const name = String(file.name || '').toLowerCase();
  return /\.(mp4|webm|ogv|ogg|mov)$/i.test(name);
}

export const BLOG_IMAGE_TYPE_HINT =
  'JPG, PNG, WEBP, GIF, BMP, TIFF, SVG, AVIF, HEIC, ICO (tối đa 10MB)';
