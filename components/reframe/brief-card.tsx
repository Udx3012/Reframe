import React, { useState } from 'react';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { ReframeOutput } from '@/lib/types';

interface BriefCardProps {
  data: ReframeOutput;
}

export default function BriefCard({ data }: BriefCardProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const showMetaRow = data.viewCount !== null || data.duration !== null || data.category !== null || data.publishedAt !== null;

  const handleCopy = async () => {
    const sections: string[] = [];
    if (data.title) sections.push(`Title: ${data.title}`);
    if (data.viewCount) sections.push(`Views: ${data.viewCount}`);
    if (data.duration) sections.push(`Duration: ${data.duration}`);
    if (data.publishedAt) sections.push(`Published: ${data.publishedAt}`);
    if (data.category) sections.push(`Category: ${data.category}`);
    if (data.engagementSignal) sections.push(`Engagement: ${data.engagementSignal}`);
    if (data.tags && data.tags.length > 0) sections.push(`Tags: ${data.tags.join(', ')}`);
    
    sections.push(`Topic: ${data.topic}`);
    sections.push(`Hook: ${data.hook}`);
    sections.push(`Caption Style: ${data.caption_style}`);
    sections.push(`Motion Profile: ${data.motion_profile}`);
    sections.push(`Pacing: ${data.pacing}`);
    sections.push(`Energy: ${data.energy}`);
    sections.push(`Sound Design: ${data.sound_design}`);
    sections.push(`Color Palette: ${data.color_palette}`);
    sections.push(`Text Density: ${data.text_density}`);
    sections.push(`Framing: ${data.framing}`);
    sections.push(`Style Summary: ${data.style_summary}`);

    const plaintext = sections.join('\n\n');
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy brief:', err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-neutral-800 bg-[#0c0c0e] overflow-hidden shadow-2xl">
      {/* Thumbnail or placeholder */}
      {data.thumbnail ? (
        <Image
          src={data.thumbnail}
          alt={data.title || 'Video Thumbnail'}
          width={640}
          height={180}
          unoptimized
          className="w-full h-[180px] object-cover"
        />
      ) : (
        <div className="w-full h-[180px] bg-neutral-900 border-b border-neutral-800 flex items-center justify-center text-neutral-500 text-sm">
          No Thumbnail Available (Uploaded File)
        </div>
      )}

      {/* Card Body */}
      <div className="p-6 space-y-5">
        {/* Title & Metadata */}
        <div className="space-y-1">
          {data.title && (
            <h2 className="text-[15px] font-medium text-white tracking-tight leading-snug">
              {data.title}
            </h2>
          )}
          {showMetaRow && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-400 font-normal">
              {(() => {
                const parts: React.ReactNode[] = [];
                if (data.viewCount) {
                  parts.push(
                    <span key="views" className="flex items-center gap-1.5">
                      <span>{data.viewCount}</span>
                      {data.engagementSignal && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border leading-none ${
                          data.engagementSignal === 'High'
                            ? 'bg-emerald-950/45 text-emerald-500 border-emerald-900/40'
                            : data.engagementSignal === 'Medium'
                            ? 'bg-amber-950/45 text-amber-500 border-amber-900/40'
                            : 'bg-rose-950/45 text-rose-500 border-rose-900/40'
                        }`}>
                          {data.engagementSignal}
                        </span>
                      )}
                    </span>
                  );
                }
                if (data.duration) {
                  parts.push(<span key="duration">{data.duration}</span>);
                }
                if (data.category) {
                  parts.push(<span key="category">{data.category}</span>);
                }
                if (data.publishedAt) {
                  parts.push(<span key="published">{data.publishedAt}</span>);
                }

                return parts.reduce((acc, curr, index) => {
                  if (index === 0) return [curr];
                  return [...(acc as React.ReactNode[]), <span key={`dot-${index}`} className="text-neutral-600">·</span>, curr];
                }, [] as React.ReactNode[]);
              })()}
            </div>
          )}
        </div>

        {/* Tags Row */}
        {data.tags && data.tags.length > 0 && (
          <div className="space-y-1 pb-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-[4px] text-neutral-300 font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <hr className="border-neutral-800" />

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Topic */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Topic
            </span>
            <span className="block text-[14px] text-neutral-200 leading-relaxed font-normal">
              {data.topic}
            </span>
          </div>

          {/* Hook */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Hook
            </span>
            <span className="block text-[14px] text-neutral-200 leading-relaxed font-normal">
              {data.hook}
            </span>
          </div>

          {/* Caption Style */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Caption Style
            </span>
            <span className="block text-[14px] text-neutral-200 leading-relaxed font-normal capitalize">
              {data.caption_style}
            </span>
          </div>

          {/* Motion Profile */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Motion Profile
            </span>
            <span className="block text-[14px] text-neutral-200 leading-relaxed font-normal capitalize">
              {data.motion_profile}
            </span>
          </div>

          {/* Pacing */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Pacing
            </span>
            <span className="block text-[14px] text-neutral-200 leading-relaxed font-normal capitalize">
              {data.pacing}
            </span>
          </div>

          {/* Energy */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Energy
            </span>
            <span className="block text-[14px] text-neutral-200 leading-relaxed font-normal capitalize">
              {data.energy}
            </span>
          </div>

          {/* Sound Design */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Sound Design
            </span>
            <span className="block text-[14px] text-neutral-200 leading-relaxed font-normal capitalize">
              {data.sound_design}
            </span>
          </div>

          {/* Color Palette */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Color Palette
            </span>
            <span className="block text-[14px] text-neutral-200 leading-relaxed font-normal capitalize">
              {data.color_palette}
            </span>
          </div>

          {/* Text Density */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Text Density
            </span>
            <span className="block text-[14px] text-neutral-200 leading-relaxed font-normal capitalize">
              {data.text_density}
            </span>
          </div>

          {/* Framing */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Framing
            </span>
            <span className="block text-[14px] text-neutral-200 leading-relaxed font-normal capitalize">
              {data.framing}
            </span>
          </div>
        </div>

        {/* Style Summary Section & Copy Button */}
        <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1 flex-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              Style Summary
            </span>
            <p className="text-[15px] text-neutral-100 leading-relaxed font-normal">
              {data.style_summary}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="self-end sm:self-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 flex items-center gap-1.5 active:scale-[0.98] shrink-0"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500 animate-in fade-in zoom-in duration-200" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-neutral-400" />
                <span>Copy Brief</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BriefCardSkeleton(): React.JSX.Element {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-neutral-850 bg-[#0c0c0e] overflow-hidden shadow-2xl animate-pulse">
      {/* Thumbnail placeholder */}
      <div className="w-full h-[180px] bg-neutral-900 border-b border-neutral-850" />
      
      {/* Body placeholder */}
      <div className="p-6 space-y-5">
        <div className="space-y-2">
          {/* Title bar */}
          <div className="h-4 bg-neutral-900 rounded w-3/4" />
          {/* Meta row */}
          <div className="h-3 bg-neutral-950 rounded w-1/4" />
        </div>

        <hr className="border-neutral-800" />

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-2 bg-neutral-950 rounded w-1/3" />
              <div className="h-3 bg-neutral-900 rounded w-5/6" />
            </div>
          ))}
        </div>

        {/* Style Summary */}
        <div className="pt-4 border-t border-neutral-900 space-y-2">
          <div className="h-2 bg-neutral-950 rounded w-1/4" />
          <div className="h-3 bg-neutral-900 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

interface BriefCardErrorProps {
  error: string;
  onRetry: () => void;
}

export function BriefCardError({ error, onRetry }: BriefCardErrorProps): React.JSX.Element {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-neutral-800 bg-[#0c0c0e] p-8 text-center space-y-4 shadow-2xl flex flex-col items-center justify-center">
      <div className="text-red-500 font-medium text-sm leading-relaxed max-w-md">
        {error}
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-lg text-xs font-medium cursor-pointer transition-colors duration-200 active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
