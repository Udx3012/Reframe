export interface ReframeOutput {
  // YouTube metadata (null for file uploads)
  title: string | null;
  viewCount: string | null;
  duration: string | null;
  thumbnail: string | null;
  publishedAt: string | null;
  category: string | null;
  engagementSignal: string | null;
  tags: string[] | null;

  // Gemini analysis (never null)
  topic: string;
  hook: string;
  caption_style: string;
  motion_profile: string;
  pacing: string;
  energy: string;
  style_summary: string;
  sound_design: string;
  color_palette: string;
  text_density: string;
  framing: string;
}
