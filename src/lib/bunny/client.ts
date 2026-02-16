/**
 * Bunny CDN video URL generator
 * Converts video IDs to full HLS playlist URLs
 * Works in both server and client components
 */
export function getBunnyVideoUrl(videoId: string): string {
  const cdnHostname =
    process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ||
    process.env.BUNNY_CDN_HOSTNAME ||
    'vz-8955c328-692.b-cdn.net';
  return `https://${cdnHostname}/${videoId}/playlist.m3u8`;
}

/**
 * Get video thumbnail URL from Bunny CDN
 * Works in both server and client components
 */
export function getBunnyVideoThumbnail(videoId: string): string {
  const cdnHostname =
    process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ||
    process.env.BUNNY_CDN_HOSTNAME ||
    'vz-8955c328-692.b-cdn.net';
  return `https://${cdnHostname}/${videoId}/thumbnail.jpg`;
}

/**
 * Format bytes for video file sizes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
