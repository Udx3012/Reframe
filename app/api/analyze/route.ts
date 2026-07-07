import { NextRequest, NextResponse } from 'next/server';
import { parseYouTubeUrl } from '@/lib/parseUrl';
import { buildGeminiPrompt } from '@/lib/prompts';

interface InlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

interface GeminiAPIResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}

interface YouTubeVideoItem {
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    categoryId?: string;
    tags?: string[];
    thumbnails?: {
      high?: {
        url?: string;
      };
    };
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
  };
  contentDetails?: {
    duration?: string;
  };
}

const CATEGORY_MAP: Record<string, string> = {
  '1': 'Film & Animation',
  '2': 'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
  '29': 'Nonprofits & Activism',
};

function getRelativeTime(publishedAtStr: string): string {
  const published = new Date(publishedAtStr);
  const now = new Date();
  const diffMs = now.getTime() - published.getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'recently';

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'recently';
}

interface YouTubeAPIResponse {
  items?: YouTubeVideoItem[];
}

function parseISO8601Duration(durationStr: string): string {
  const matches = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!matches) {
    return '0:00';
  }
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);

  const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

  if (hours > 0) {
    const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minutesStr}:${secondsStr}`;
  }

  return `${minutes}:${secondsStr}`;
}

function formatViewCount(viewCountStr: string): string {
  const num = parseInt(viewCountStr, 10);
  if (isNaN(num)) return '0 views';

  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M views`;
  }
  if (num >= 1_000) {
    const thousands = num / 1_000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K views`;
  }
  return `${num} views`;
}

function cleanJsonText(rawText: string): string {
  let clean = rawText.trim();
  if (clean.startsWith('```')) {
    const firstLineEnd = clean.indexOf('\n');
    const lastLineStart = clean.lastIndexOf('```');
    if (firstLineEnd !== -1 && lastLineStart !== -1 && lastLineStart > firstLineEnd) {
      clean = clean.substring(firstLineEnd + 1, lastLineStart).trim();
    }
  }
  return clean;
}

async function callGemini(
  prompt: string,
  apiKey: string,
  videoUrl?: string,
  base64Part?: InlineDataPart | null
): Promise<string> {
  const parts: unknown[] = [];

  if (videoUrl) {
    parts.push({
      fileData: {
        fileUri: videoUrl,
        mimeType: 'video/mp4'
      }
    });
  } else if (base64Part) {
    parts.push(base64Part);
  }

  parts.push({ text: prompt });

  const body = {
    contents: [
      {
        parts
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API returned status ${res.status}: ${errText}`);
  }

  const json = await res.json() as GeminiAPIResponse;
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return text;
}

async function fetchYouTubeMetadata(videoId: string, apiKey: string) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`YouTube API returned status ${res.status}`);
  }
  const ytData = await res.json() as YouTubeAPIResponse;
  if (!ytData.items || ytData.items.length === 0) {
    throw new Error('INVALID_VIDEO_ID');
  }
  const item = ytData.items[0];

  // 1. Scan snippet.description for words beginning with #
  const description = item.snippet?.description || '';
  const hashtags: string[] = [];
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = hashtagRegex.exec(description)) !== null) {
    hashtags.push(match[1]);
  }

  // 2. snippet.tags
  const ytTags = item.snippet?.tags || [];

  // 3. Merge, deduplicate, and strip # prefix
  const tagsSet = new Set<string>();
  hashtags.forEach(tag => tagsSet.add(tag.trim()));
  ytTags.forEach(tag => tagsSet.add(tag.trim()));
  const mergedTags = Array.from(tagsSet);

  // 4. statistics.likeCount & statistics.viewCount ratio
  const likeCountStr = item.statistics?.likeCount || '0';
  const viewCountStr = item.statistics?.viewCount || '0';
  const likes = parseInt(likeCountStr, 10);
  const views = parseInt(viewCountStr, 10);
  let engagementSignal = 'Low';
  if (!isNaN(likes) && !isNaN(views) && views > 0) {
    const ratio = likes / views;
    if (ratio > 0.05) engagementSignal = 'High';
    else if (ratio >= 0.02) engagementSignal = 'Medium';
  }

  // 5. publishedAt relative time
  const publishedAtRaw = item.snippet?.publishedAt || '';
  const publishedAt = publishedAtRaw ? getRelativeTime(publishedAtRaw) : 'recently';

  // 6. Category ID lookup
  const categoryId = item.snippet?.categoryId || '';
  const category = CATEGORY_MAP[categoryId] || 'General';

  return {
    title: item.snippet?.title || 'Unknown Title',
    viewCount: viewCountStr !== '0' ? formatViewCount(viewCountStr) : '0 views',
    duration: item.contentDetails?.duration ? parseISO8601Duration(item.contentDetails.duration) : '0:00',
    thumbnail: item.snippet?.thumbnails?.high?.url || null,
    engagementSignal,
    publishedAt,
    category,
    tags: mergedTags
  };
}

export async function POST(request: NextRequest) {
  try {
    let videoUrl = '';

    let base64Part: InlineDataPart | null = null;

    const body = await request.json();
    videoUrl = body.videoUrl || '';
    const fileBase64 = body.file || '';
    const mimeType = body.mimeType || 'video/mp4';

    if (fileBase64) {
      base64Part = {
        inlineData: {
          mimeType,
          data: fileBase64
        }
      };
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({
        error: 'CONFIGURATION_ERROR',
        message: 'GEMINI_API_KEY is not configured in the environment.'
      }, { status: 500 });
    }

    let youtubeMetadata = {
      title: null as string | null,
      viewCount: null as string | null,
      duration: null as string | null,
      thumbnail: null as string | null,
      engagementSignal: null as string | null,
      publishedAt: null as string | null,
      category: null as string | null,
      tags: null as string[] | null
    };

    let geminiJson: Record<string, string> | null = null;

    if (videoUrl) {
      const parsed = parseYouTubeUrl(videoUrl);
      if (!parsed.isValid || !parsed.videoId) {
        return NextResponse.json({
          error: 'INVALID_URL',
          message: 'Only YouTube links are supported. Use the upload option for other platforms.'
        }, { status: 400 });
      }

      const youtubeKey = process.env.YOUTUBE_API_KEY;
      if (!youtubeKey) {
        return NextResponse.json({
          error: 'CONFIGURATION_ERROR',
          message: 'YOUTUBE_API_KEY is not configured in the environment.'
        }, { status: 500 });
      }

      try {
        const ytDataPromise = fetchYouTubeMetadata(parsed.videoId, youtubeKey);
        const geminiPromise = ytDataPromise.then(ytData => {
          const prompt = buildGeminiPrompt(ytData);
          return callGemini(prompt, geminiKey, videoUrl);
        });

        const [ytData, geminiRawText] = await Promise.all([
          ytDataPromise,
          geminiPromise
        ]);

        youtubeMetadata = ytData;
        
        try {
          geminiJson = JSON.parse(cleanJsonText(geminiRawText)) as Record<string, string>;
        } catch (parseErr) {
          return NextResponse.json({
            error: 'GEMINI_PARSE_ERROR',
            message: 'Failed to parse brief JSON response from Gemini.',
            details: parseErr instanceof Error ? parseErr.message : String(parseErr),
            raw: geminiRawText
          }, { status: 502 });
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg === 'INVALID_VIDEO_ID') {
          return NextResponse.json({
            error: 'INVALID_VIDEO_ID',
            message: 'The YouTube video ID was not found or is invalid.'
          }, { status: 404 });
        }
        return NextResponse.json({
          error: 'PIPELINE_ERROR',
          message: 'Error calling YouTube or Gemini API.',
          details: errMsg
        }, { status: 502 });
      }
    } else if (base64Part) {
      try {
        const prompt = buildGeminiPrompt(youtubeMetadata);
        const geminiRawText = await callGemini(prompt, geminiKey, undefined, base64Part);
        try {
          geminiJson = JSON.parse(cleanJsonText(geminiRawText)) as Record<string, string>;
        } catch (parseErr) {
          return NextResponse.json({
            error: 'GEMINI_PARSE_ERROR',
            message: 'Failed to parse brief JSON response from Gemini.',
            details: parseErr instanceof Error ? parseErr.message : String(parseErr),
            raw: geminiRawText
          }, { status: 502 });
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({
          error: 'PIPELINE_ERROR',
          message: 'Error calling Gemini API for uploaded file.',
          details: errMsg
        }, { status: 502 });
      }
    } else {
      return NextResponse.json({
        error: 'MISSING_INPUT',
        message: 'No video URL or video file was provided.'
      }, { status: 400 });
    }

    // Validate fields
    const requiredFields = [
      'topic',
      'hook',
      'caption_style',
      'motion_profile',
      'pacing',
      'energy',
      'style_summary',
      'sound_design',
      'color_palette',
      'text_density',
      'framing'
    ];
    for (const field of requiredFields) {
      if (!geminiJson || typeof geminiJson[field] === 'undefined' || geminiJson[field] === null) {
        return NextResponse.json({
          error: 'GEMINI_INCOMPLETE_RESPONSE',
          message: `Gemini response is missing the required brief field: ${field}`
        }, { status: 502 });
      }
    }

    const output = {
      title: youtubeMetadata.title,
      viewCount: youtubeMetadata.viewCount,
      duration: youtubeMetadata.duration,
      thumbnail: youtubeMetadata.thumbnail,
      engagementSignal: youtubeMetadata.engagementSignal,
      publishedAt: youtubeMetadata.publishedAt,
      category: youtubeMetadata.category,
      tags: youtubeMetadata.tags,
      topic: geminiJson.topic,
      hook: geminiJson.hook,
      caption_style: geminiJson.caption_style,
      motion_profile: geminiJson.motion_profile,
      pacing: geminiJson.pacing,
      energy: geminiJson.energy,
      style_summary: geminiJson.style_summary,
      sound_design: geminiJson.sound_design,
      color_palette: geminiJson.color_palette,
      text_density: geminiJson.text_density,
      framing: geminiJson.framing
    };

    return NextResponse.json(output);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({
      error: 'INTERNAL_SERVER_ERROR',
      message: errorMessage
    }, { status: 500 });
  }
}
