/**
 * Bunny CDN video URL generator
 *
 * All client-facing URLs use the /cdn/videos/ proxy path defined in next.config.ts
 * to bypass Bunny hotlink protection in both dev and production.
 * The proxy rewrites to the actual CDN hostname at the edge.
 */

export function getBunnyVideoUrl(videoId: string): string {
  return `/cdn/videos/${videoId}/playlist.m3u8`;
}

export function getBunnyVideoThumbnail(videoId: string): string {
  return `/cdn/videos/${videoId}/thumbnail.jpg`;
}

export function getBunnyVideoPreview(videoId: string): string {
  return `/cdn/videos/${videoId}/preview.webp`;
}

export function getBunnyVideoMp4Url(videoId: string, quality: '720p' | '1080p' | '360p' = '720p'): string {
  return `/cdn/videos/${videoId}/play_${quality}.mp4`;
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
