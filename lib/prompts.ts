export function buildGeminiPrompt(metadata: {
  tags: string[] | null;
  category: string | null;
  publishedAt: string | null;
  engagementSignal: string | null;
}): string {
  const tagsStr = metadata.tags && metadata.tags.length > 0 ? metadata.tags.join(', ') : 'None';
  const categoryStr = metadata.category || 'General';
  const publishedAtStr = metadata.publishedAt || 'Unknown';
  const engagementSignalStr = metadata.engagementSignal || 'Low';

  return `
The following metadata was pulled from this video's YouTube page:
- Tags and hashtags: ${tagsStr}
- Content category: ${categoryStr}
- Published: ${publishedAtStr}
- Engagement signal: ${engagementSignalStr}

Use this metadata to inform your analysis, particularly for topic, energy, style_summary, and sound_design. If the tags suggest a specific niche or content vertical, factor that into the brief.

Analyze this video as a creative director briefing a motion designer. Return ONLY a valid JSON object. No markdown. No backticks. No preamble. No extra fields.

{
  "topic": "one sentence — what this video is about",
  "hook": "describe exactly what happens in the first 5 seconds and what technique makes it compelling",
  "caption_style": "one of: kinetic text / static lower thirds / word-by-word / subtitles only / no captions / mixed",
  "motion_profile": "one of: linear cuts / 3D motion heavy / parallax / mixed live-action / minimal static",
  "pacing": "one of: fast (20+ cuts/min) / medium (8-20 cuts/min) / slow (under 8 cuts/min)",
  "energy": "one of: high energy / mid energy / calm",
  "style_summary": "one sentence describing the overall visual style a motion designer would need to replicate",
  "sound_design": "one of: music-driven / voiceover-driven / silent with text / mixed",
  "color_palette": "one of: warm / cool / high contrast / muted / monochrome",
  "text_density": "one of: heavy text overlay / moderate / minimal / none",
  "framing": "one of: native vertical 9:16 / native horizontal 16:9 / square / cropped to vertical"
}
`.trim();
}
