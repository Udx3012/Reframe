'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Link2, AlertCircle, CheckCircle2, Trash2, HelpCircle, Sparkles, BookOpen } from 'lucide-react';

import { parseYouTubeUrl } from '@/lib/parseUrl';

export interface InputModuleState {
  primaryType: 'video' | 'url' | 'description' | null;
  videoFile: File | null;
  videoUrl: string;
  description: string;
  mode: 'enhancement' | 'fallback' | null;
}

interface InputModuleProps {
  onChange?: (state: InputModuleState) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function VideoInput({ onChange, onValidationChange }: InputModuleProps): React.JSX.Element {
  // Primary Media Ingestion States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  // Text Context Input
  const [description, setDescription] = useState('');

  // UI States
  const [isDragging, setIsDragging] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<'YouTube' | 'TikTok' | 'Instagram' | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived States: Mode and Validation
  const hasMedia = !!(videoFile || (videoUrl && detectedPlatform && !urlError));

  const mode: 'enhancement' | null = hasMedia && description.trim() ? 'enhancement' : null;

  const primaryType: 'video' | 'url' | null = videoFile
    ? 'video'
    : (videoUrl && detectedPlatform && !urlError)
      ? 'url'
      : null;

  // Propagate state changes to parent layout
  useEffect(() => {
    if (onChange) {
      onChange({
        primaryType,
        videoFile,
        videoUrl,
        description,
        mode,
      });
    }
  }, [primaryType, videoFile, videoUrl, description, mode, onChange]);

  // Propagate validation rules
  useEffect(() => {
    let isValid = false;
    if (videoFile && !fileError) {
      isValid = true;
    } else if (videoUrl && !urlError && detectedPlatform) {
      isValid = true;
    }

    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [videoFile, videoUrl, fileError, urlError, detectedPlatform, onValidationChange]);

  // Clean object URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  // URL Ingest
  const handleUrlChange = (value: string) => {
    setVideoUrl(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setUrlError(null);
      setDetectedPlatform(null);
      return;
    }

    // Reset video upload if URL is entered (mutual exclusion between upload/URL)
    setVideoFile(null);
    setFileError(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }

    const parsed = parseYouTubeUrl(trimmed);
    if (parsed.isValid) {
      setDetectedPlatform('YouTube');
      setUrlError(null);
    } else {
      setDetectedPlatform(null);
      setUrlError('Only YouTube links are supported. Use the upload option for other platforms.');
    }
  };

  // Upload Video Ingest
  const validateAndSetFile = (file: File) => {
    const validMimes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const validExts = ['.mp4', '.mov', '.webm'];
    const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!validMimes.includes(file.type) && !validExts.includes(fileExt)) {
      setFileError('Format not supported. Please upload an MP4, MOV, or WebM video file.');
      setVideoFile(null);
      return;
    }

    const maxLimit = 200 * 1024 * 1024; // 200MB
    if (file.size > maxLimit) {
      setFileError('File size limit exceeded. Maximum size is 200MB.');
      setVideoFile(null);
      return;
    }

    // Reset URL if video upload occurs (mutual exclusion)
    setVideoUrl('');
    setUrlError(null);
    setDetectedPlatform(null);

    setFileError(null);
    setVideoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setVideoFile(null);
    setFileError(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearUrl = () => {
    setVideoUrl('');
    setUrlError(null);
    setDetectedPlatform(null);
  };

  return (
    <div className="card-premium space-y-6" role="region" aria-label="Ingestion Console">

      {/* Title & info */}
      <div className="space-y-1">
        <label className="text-[12px] font-mono font-bold uppercase tracking-wider text-foreground block">
          Asset Ingestion Console
        </label>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Upload media, paste links, or write text instructions to seed the workspace.
        </p>
      </div>

      {/* 1. Paste Video URL (Primary Ingest) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="url-input-field" className="flex items-center gap-1.5 text-[12px] font-mono font-bold text-foreground animate-pulse-subtle">
            <span className={`h-1.5 w-1.5 rounded-full ${videoUrl && detectedPlatform && !urlError ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-neutral-800'}`} />
            1. PASTE VIDEO URL
          </label>
          {videoUrl && (
            <button
              onClick={clearUrl}
              className="text-[10px] font-mono text-rose-500 hover:text-rose-455 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3" /> Clear URL
            </button>
          )}
        </div>

        <div className={`relative ${videoFile ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500">
            <Link2 className="size-3.5" />
          </span>
          <input
            id="url-input-field"
            type="url"
            value={videoUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={!!videoFile}
            placeholder="Add YouTube link..."
            className={`w-full text-sm bg-neutral-950/60 border border-neutral-900 rounded-lg pl-9 pr-24 py-2.5 text-foreground placeholder-neutral-500 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700/20 outline-none font-mono transition-all duration-250 ${!videoUrl && !videoFile ? 'animate-glow-blink' : ''}`}
            aria-invalid={!!urlError}
          />

          {detectedPlatform && !urlError && (
            <div className="absolute inset-y-0 right-3 flex items-center gap-1.5 select-none">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in duration-200">
                <CheckCircle2 className="size-2.5" />
                {detectedPlatform}
              </span>
            </div>
          )}
        </div>

        {urlError && (
          <div className="flex items-start gap-1.5 text-[11px] leading-relaxed text-rose-500 animate-in fade-in duration-200" role="alert">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            <span>{urlError}</span>
          </div>
        )}
      </div>

      {/* Mutual exclusion indicator */}
      <div className="flex items-center gap-2.5 py-0.5">
        <div className="h-px bg-neutral-900/60 flex-1" />
        <span className="text-[9px] font-mono tracking-widest text-neutral-800">OR</span>
        <div className="h-px bg-neutral-900/60 flex-1" />
      </div>

      {/* 2. Upload Video File (Secondary Ingest) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[12px] font-mono font-bold text-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${videoFile ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-neutral-800'}`} />
            2. UPLOAD VIDEO
          </label>
          {videoFile && (
            <button
              onClick={clearFile}
              className="text-[10px] font-mono text-rose-500 hover:text-rose-455 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3" /> Clear File
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndSetFile(e.target.files[0]);
            }
          }}
          aria-hidden="true"
        />

        {videoPreviewUrl ? (
          <div className="relative rounded-lg border border-neutral-900 bg-black overflow-hidden aspect-video">
            <video
              src={videoPreviewUrl}
              controls
              className="w-full h-full object-cover"
              aria-label="Uploaded video preview player"
            />
            <div className="absolute top-2 right-2 bg-neutral-950/80 border border-neutral-900 px-2 py-1 rounded text-[10px] font-mono text-neutral-400 select-none">
              {(videoFile?.size ? videoFile.size / (1024 * 1024) : 0).toFixed(1)} MB
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!videoUrl) fileInputRef.current?.click();
            }}
            className={`border border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 group ${isDragging
                ? 'border-emerald-500 bg-emerald-950/5'
                : 'border-neutral-900 bg-neutral-950/20 hover:border-neutral-750 hover:bg-neutral-950/50 hover:shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]'
              } ${videoUrl ? 'opacity-40 pointer-events-none' : 'opacity-100'} ${!videoUrl && !videoFile && !isDragging ? 'animate-glow-blink' : ''}`}
            role="button"
            tabIndex={videoUrl ? -1 : 0}
            aria-label="Upload raw video file"
          >
            {/* Highly polished circular glass container for the upload icon */}
            <div className="w-12 h-12 rounded-full bg-neutral-900/10 border border-neutral-900/20 flex items-center justify-center text-neutral-400 group-hover:scale-105 group-hover:bg-neutral-900/30 group-hover:border-neutral-900/40 transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
              <UploadCloud className="size-5 text-foreground/70 group-hover:text-foreground" />
            </div>
            <div className="text-center select-none space-y-0.5">
              <span className="text-sm font-medium text-foreground/80 block group-hover:text-foreground transition-colors">Drag & drop video here</span>
              <span className="text-xs text-neutral-500 block group-hover:text-neutral-400 transition-colors">or click to browse local files</span>
              <span className="text-[9px] text-neutral-500 block mt-2 font-mono uppercase tracking-wider">MP4, MOV, WEBM • MAX 200MB</span>
            </div>
          </div>
        )}

        {fileError && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-500 animate-in fade-in duration-200" role="alert">
            <AlertCircle className="size-3.5" />
            <span>{fileError}</span>
          </div>
        )}
      </div>

      {/* Integration details separator */}
      <div className="h-px bg-neutral-900" />

      {/* 3. Description & Context (Optional extra description) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="description-textarea" className="text-[12px] font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1">
            3. EXTRA DESCRIPTION (OPTIONAL)
          </label>
          <div className="flex items-center gap-2 select-none">
            <span className={`text-[10px] font-mono ${description.length > 500 ? 'text-rose-500 font-bold' : 'text-neutral-600'}`}>
              {description.length} / 500
            </span>
          </div>
        </div>

        <textarea
          id="description-textarea"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter brand rules, target keywords, or styling context overrides to analyze alongside the media..."
          className={`w-full text-sm bg-neutral-950/60 border border-neutral-900 rounded-lg p-3 text-foreground placeholder-neutral-500 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700/20 outline-none resize-none leading-relaxed transition-all duration-250 ${!description ? 'animate-glow-blink' : ''}`}
        />

        {/* Supplemental description context helper */}
        <div className="flex items-start gap-1.5 text-sm text-neutral-500 leading-normal font-sans">
          <HelpCircle className="size-3.5 shrink-0 mt-0.5 text-neutral-500" />
          <span>
            Your description will act as supplemental context, reinforcing the AI visual analyses.
          </span>
        </div>
      </div>

    </div>
  );
}
