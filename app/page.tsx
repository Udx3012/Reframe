'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import VideoInput, { InputModuleState } from '@/components/reframe/video-input';
import BriefCard, { BriefCardSkeleton, BriefCardError } from '@/components/reframe/brief-card';
import { Sparkles, Loader2 } from 'lucide-react';
import { ReframeOutput } from '@/lib/types';
import { toast } from 'sonner';

export default function Page() {
  // Global Media States
  const [isValid, setIsValid] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  
  // Input State capturing uploads & urls
  const [inputState, setInputState] = useState<InputModuleState | null>(null);

  // Intelligence Pack data state
  const [briefData, setBriefData] = useState<ReframeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cooldown Controls
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardSectionRef = useRef<HTMLDivElement | null>(null);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldownSeconds(seconds);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.substring(base64String.indexOf(',') + 1);
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Main Generation Pipeline
  const handleGenerateIntelligence = useCallback(async () => {
    if (!isValid || isAnalyzing || cooldownSeconds > 0 || !inputState) return;
    setIsAnalyzing(true);
    setHasProcessed(false);
    setBriefData(null);
    setError(null);

    setTimeout(() => {
      cardSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    toast.loading('Ingesting video metadata parameters...', {
      id: 'analysis-toast',
      style: { background: '#0a0a0a', borderColor: '#1f1f1f', color: '#fff' }
    });

    try {
      let base64File: string | null = null;
      let mimeType: string | null = null;

      if (inputState.videoFile) {
        base64File = await fileToBase64(inputState.videoFile);
        mimeType = inputState.videoFile.type || 'video/mp4';
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: inputState.videoUrl || '',
          file: base64File,
          mimeType: mimeType
        })
      });

      if (!response.ok) {
        let errType = '';
        try {
          const errData = await response.json();
          errType = errData.error || '';
        } catch {}

        let userMsg = 'An unexpected error occurred. Please try again.';
        if (errType === 'INVALID_URL' || errType === 'INVALID_VIDEO_ID') {
          userMsg = 'Only valid YouTube links are supported. Please check the link and try again.';
        } else if (errType === 'CONFIGURATION_ERROR') {
          userMsg = 'The server configuration is incomplete. Please contact support.';
        } else if (errType.startsWith('GEMINI_') || errType === 'PIPELINE_ERROR') {
          userMsg = "We had trouble analyzing this video's visual contents. Please try again.";
        }
        setError(userMsg);
        throw new Error(userMsg);
      }

      const data = await response.json();
      setBriefData(data);
      setHasProcessed(true);
      setIsAnalyzing(false);

      toast.success('Video context parsed successfully.', {
        id: 'analysis-toast',
        style: { background: '#0a0a0a', borderColor: '#1f1f1f', color: '#fff' }
      });
      startCooldown(15);

    } catch (err: unknown) {
      setIsAnalyzing(false);
      setHasProcessed(false);
      toast.dismiss('analysis-toast');
      
      const errMsg = err instanceof Error ? err.message : '';
      if (!errMsg || errMsg.includes('Status')) {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  }, [isValid, isAnalyzing, cooldownSeconds, inputState]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-neutral-800 selection:text-white relative overflow-hidden">
      {/* Vercel Ambient Aura Glows */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[350px] bg-neutral-900/10 rounded-full blur-[100px] pointer-events-none z-0" />
      
      {/* Navbar Header */}
      <Header />

      {/* Main Container Layout */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 relative z-10">
        
        {/* Content Ingestion Section */}
        <section className="space-y-6 flex flex-col border-t border-white/6 pt-6">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h1 className="text-[22px] font-medium tracking-tight text-white">
                Content Ingestion
              </h1>
              <p className="text-[11px] font-mono tracking-wider text-neutral-500 uppercase">
                Media Ingestion & Upload
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <VideoInput 
              onChange={setInputState}
              onValidationChange={setIsValid} 
            />

            {/* Prominent Primary Trigger Button */}
            <button
              onClick={handleGenerateIntelligence}
              disabled={!isValid || isAnalyzing || cooldownSeconds > 0}
              className="w-full h-12 rounded-lg bg-white text-black font-medium text-sm hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.985]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="size-4 animate-spin text-black" />
                  <span>Processing Media File...</span>
                </>
              ) : cooldownSeconds > 0 ? (
                <>
                  <Loader2 className="size-4 animate-spin text-black/50" />
                  <span>Cooldown: Wait {cooldownSeconds}s</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4 text-black group-hover:rotate-12 transition-transform duration-300" />
                  <span>Generate Brief</span>
                </>
              )}
            </button>



            {/* Smooth Scroll Target Container */}
            <div ref={cardSectionRef} className="scroll-mt-6">
              {/* Loading Skeleton State */}
              {isAnalyzing && (
                <BriefCardSkeleton />
              )}

              {/* Inline Error State */}
              {error && !isAnalyzing && (
                <BriefCardError error={error} onRetry={handleGenerateIntelligence} />
              )}

              {/* BriefCard Output Component */}
              {hasProcessed && briefData && !isAnalyzing && !error && (
                <BriefCard data={briefData} />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900 py-6 mt-8 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left select-none">
          <p className="text-[10px] font-mono text-neutral-600">
            © 2026 Reframe. Powered by HalftoneMotion. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono border border-emerald-900/40 bg-emerald-950/20 text-emerald-500 px-2 py-0.5 rounded-[4px] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Stateless Production Sandbox
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
