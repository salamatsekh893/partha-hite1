/**
 * Utility functions to convert YouTube, Google Drive, Google Photos,
 * and direct media links into iframe embed URLs or direct image URLs.
 */

export function getEmbedVideoUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // 1. YouTube URLs (youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID)
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // 2. Google Drive video/file preview links
  const driveMatch = trimmed.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([\w-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  // 3. Vimeo links (vimeo.com/ID)
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return trimmed;
}

export function getDirectImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Convert Google Drive view link to direct image link
  const driveMatch = trimmed.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([\w-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  return trimmed;
}

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com') ||
    lower.includes('drive.google.com') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.ogg') ||
    lower.startsWith('data:video')
  );
}
