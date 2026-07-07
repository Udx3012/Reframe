export interface ParsedYouTubeUrl {
  isValid: boolean;
  videoId: string | null;
  isShort: boolean;
}

export function parseYouTubeUrl(url: string): ParsedYouTubeUrl {
  const result: ParsedYouTubeUrl = {
    isValid: false,
    videoId: null,
    isShort: false,
  };

  if (!url) {
    return result;
  }

  const cleanUrl = url.trim();

  // 1. YouTube Shorts check: youtube.com/shorts/ID
  // Matches optional http/s, optional www., optional m.
  const shortsRegex = /^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?|&|$)/i;
  const shortsMatch = cleanUrl.match(shortsRegex);
  if (shortsMatch) {
    result.isValid = true;
    result.videoId = shortsMatch[1];
    result.isShort = true;
    return result;
  }

  // 2. Short URL check: youtu.be/ID
  const youtuBeRegex = /^(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|&|$)/i;
  const youtuBeMatch = cleanUrl.match(youtuBeRegex);
  if (youtuBeMatch) {
    result.isValid = true;
    result.videoId = youtuBeMatch[1];
    result.isShort = false;
    return result;
  }

  // 3. Standard URL check: youtube.com/watch?v=ID (could have parameters before or after v=)
  const watchRegex = /^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]{11})(?:&|$)/i;
  const watchMatch = cleanUrl.match(watchRegex);
  if (watchMatch) {
    result.isValid = true;
    result.videoId = watchMatch[1];
    result.isShort = false;
    return result;
  }

  return result;
}
