import React, { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, Eye, Clock, Calendar } from 'lucide-react';
import { ReframeOutput } from '@/lib/types';
import { motion } from 'framer-motion';

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

  // Entry transitions for a premium, lightweight feel
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-2xl mx-auto rounded-[32px] border border-neutral-900 bg-neutral-950 overflow-hidden shadow-2xl space-y-8 pb-8"
    >
      {/* Thumbnail or placeholder */}
      {data.thumbnail ? (
        <div className="relative w-full h-[220px] overflow-hidden">
          <Image
            src={data.thumbnail}
            alt={data.title || 'Video Thumbnail'}
            width={640}
            height={220}
            unoptimized
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-[100px] border-b border-neutral-900 bg-neutral-900/10" />
      )}

      {/* Card Content Area - Spacious Layout */}
      <div className="px-8 sm:px-10 space-y-8">
        
        {/* Title & Metadata */}
        <motion.div variants={itemVariants} className="space-y-4">
          {data.title && (
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight leading-snug">
              {data.title}
            </h2>
          )}
          
          {showMetaRow && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-500 font-mono">
              {data.viewCount && (
                <span className="flex items-center gap-1">
                  <Eye className="size-3.5" />
                  <span>{data.viewCount}</span>
                </span>
              )}
              {data.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  <span>{data.duration}</span>
                </span>
              )}
              {data.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  <span>{data.publishedAt}</span>
                </span>
              )}
              {data.engagementSignal && (
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${
                  data.engagementSignal === 'High'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : data.engagementSignal === 'Medium'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  {data.engagementSignal} Rating
                </span>
              )}
            </div>
          )}

          {/* Tags cloud */}
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-[100px] overflow-y-auto pr-2 scrollbar-thin">
              {data.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2.5 py-0.5 bg-neutral-900 border border-neutral-900 rounded-full text-foreground/75 font-mono hover:text-foreground hover:border-neutral-700 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <hr className="border-neutral-900" />

        {/* SECTION 1: Creative Intent (Topic & Hook) */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="space-y-2">
            <span className="block text-xs uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
              Topic
            </span>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
              {data.topic}
            </p>
          </div>

          <div className="space-y-2">
            <span className="block text-xs uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
              Hook
            </span>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
              {data.hook}
            </p>
          </div>
        </motion.div>

        {/* Divider */}
        <hr className="border-neutral-900" />

        {/* SECTION 2: Technical Parameters Blueprint */}
        <motion.div variants={itemVariants} className="space-y-6">
          <span className="block text-xs uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
            Style Parameter Blueprint
          </span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
            {[
              { label: 'Caption Style', val: data.caption_style },
              { label: 'Motion Profile', val: data.motion_profile },
              { label: 'Pacing Rate', val: data.pacing },
              { label: 'Energy Profile', val: data.energy },
              { label: 'Sound Design', val: data.sound_design },
              { label: 'Color Palette', val: data.color_palette },
              { label: 'Text Density', val: data.text_density },
              { label: 'Framing Aspect', val: data.framing }
            ].map((param, i) => (
              <div key={i} className="flex flex-col gap-1 border-b border-neutral-900 pb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">{param.label}</span>
                <span className="text-xs sm:text-[13px] font-medium text-foreground capitalize mt-0.5 select-all">
                  {param.val}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <hr className="border-neutral-900" />

        {/* SECTION 3: Executive Summary */}
        <motion.div variants={itemVariants} className="space-y-2">
          <span className="block text-xs uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
            Style Summary
          </span>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
            {data.style_summary}
          </p>
        </motion.div>

        {/* Copy Action Button */}
        <motion.div variants={itemVariants} className="pt-2">
          <button
            onClick={handleCopy}
            className="w-full py-4 bg-foreground text-background hover:opacity-90 font-bold rounded-xl text-sm cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.985] shadow-lg"
          >
            {copied ? (
              <>
                <Check className="size-4 animate-in fade-in zoom-in duration-200" />
                <span>Brief Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>Copy Full Brief</span>
              </>
            )}
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
}

export function BriefCardSkeleton(): React.JSX.Element {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-neutral-900 bg-neutral-950 overflow-hidden shadow-2xl animate-pulse">
      {/* Thumbnail placeholder */}
      <div className="w-full h-[180px] bg-neutral-900 border-b border-neutral-900" />
      
      {/* Body placeholder */}
      <div className="p-6 space-y-5">
        <div className="space-y-2">
          {/* Title bar */}
          <div className="h-4 bg-neutral-900 rounded w-3/4" />
          {/* Meta row */}
          <div className="h-3 bg-neutral-950 rounded w-1/4" />
        </div>

        <hr className="border-neutral-900" />

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
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-neutral-900 bg-neutral-950 p-8 text-center space-y-4 shadow-2xl flex flex-col items-center justify-center">
      <div className="text-red-500 font-medium text-sm leading-relaxed max-w-md">
        {error}
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-foreground border border-neutral-900 rounded-lg text-xs font-medium cursor-pointer transition-colors duration-200 active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
