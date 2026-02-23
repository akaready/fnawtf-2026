/**
 * Bunny CDN video URL generator
 * Direct CDN URLs for production video playback.
 */

const CDN_HOSTNAME = 'vz-6b68e26c-531.b-cdn.net';

export function getBunnyVideoUrl(videoId: string): string {
  return `https://${CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
}

export function getBunnyVideoThumbnail(videoId: string): string {
  return `https://${CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
}

export function getBunnyVideoPreview(videoId: string): string {
  return `https://${CDN_HOSTNAME}/${videoId}/preview.webp`;
}

export function getBunnyVideoMp4Url(videoId: string, quality: '720p' | '1080p' | '360p' = '720p'): string {
  return `https://${CDN_HOSTNAME}/${videoId}/play_${quality}.mp4`;
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
