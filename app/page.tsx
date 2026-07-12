'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import VideoInput, { InputModuleState } from '@/components/reframe/video-input';
import BriefCard, { BriefCardSkeleton, BriefCardError } from '@/components/reframe/brief-card';
import { Sparkles, Loader2, ArrowRight, Play, Cpu, CheckCircle, X } from 'lucide-react';
import { ReframeOutput } from '@/lib/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const modalContent = {
  privacy: {
    title: 'Privacy Policy',
    content: (
      <>
        <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-4">
          At Reframe, privacy is our core foundation. We process all reference videos in real-time within highly secure, isolated sessions.
        </p>
        <ul className="list-disc list-inside text-neutral-400 text-xs sm:text-sm space-y-2 mb-4">
          <li>No video binaries or frame captures are stored on our servers.</li>
          <li>Extracted briefs are sent directly to your browser and never cached.</li>
          <li>We do not track or share your upload history with any third parties.</li>
        </ul>
        <p className="text-neutral-500 text-[11px] font-mono">
          Last updated: July 2026
        </p>
      </>
    )
  },
  terms: {
    title: 'Terms of Service',
    content: (
      <>
        <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-4">
          By using Reframe, you agree to these simple and transparent terms of service:
        </p>
        <ul className="list-disc list-inside text-neutral-400 text-xs sm:text-sm space-y-2 mb-4">
          <li>You retain full ownership and intellectual property of your reference videos and generated briefs.</li>
          <li>You warrant that you possess the necessary rights and permissions for any uploaded media or imported links.</li>
          <li>Reframe is provided "as is" to streamline your creative process.</li>
        </ul>
        <p className="text-neutral-500 text-[11px] font-mono">
          Last updated: July 2026
        </p>
      </>
    )
  },
  security: {
    title: 'Security Disclosure',
    content: (
      <>
        <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-4">
          We maintain strict security safeguards to keep your creative assets and operations protected:
        </p>
        <ul className="list-disc list-inside text-neutral-400 text-xs sm:text-sm space-y-2 mb-4">
          <li>All uploaded files and YouTube stream requests are encrypted using TLS 1.3 in transit.</li>
          <li>Dynamic analysis runs in standard sandbox environments with immediate teardown on completion.</li>
          <li>We proactively monitor and regularly audit our AI pipeline interfaces to ensure robust execution.</li>
        </ul>
        <p className="text-neutral-500 text-[11px] font-mono">
          Last updated: July 2026
        </p>
      </>
    )
  }
};

export default function Page() {
  // Modal State
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'security' | null>(null);

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
  const generateButtonRef = useRef<HTMLDivElement | null>(null);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // Auto-scroll to generate button when isValid transitions to true
  useEffect(() => {
    if (isValid && !isAnalyzing && !hasProcessed) {
      const timer = setTimeout(() => {
        generateButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isValid, isAnalyzing, hasProcessed]);

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

    toast.loading('Analysing...', {
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

  // View Control: 'landing' | 'console'
  const [view, setView] = useState<'landing' | 'console'>('landing');

  // Dynamic step navigation states
  const currentStep = (isValid || isAnalyzing || hasProcessed) ? 2 : 1;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-neutral-800 selection:text-foreground relative overflow-hidden transition-colors duration-300">
      {/* Vercel Ambient Aura Glows */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[450px] bg-neutral-900/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute -top-[10%] -left-[10%] h-[300px] w-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
      
      {/* Navbar Header */}
      <Header />

      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          /* =========================================================================
             1. LANDING VIEW
             ========================================================================= */
          <motion.main
            key="landing-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center gap-10 relative z-10 text-center"
          >
            <div className="space-y-6 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-950 border border-neutral-900 text-[11px] font-mono text-neutral-400 select-none shadow-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Next-Gen Video Context Parser</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.12]">
                Reframe reference videos into <br />
                <span className="bg-gradient-to-r from-foreground via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
                  structured creative briefs
                </span>
              </h1>
              <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Analyze reference video layouts, audio transcripts, visual pacing, and targeted branding prompts. Automatically extract comprehensive, production-ready creative briefs powered by AI.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('console')}
              className="px-8 h-14 rounded-lg bg-white text-black font-semibold text-base hover:bg-neutral-100 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.15)] group"
            >
              <span>Try Now</span>
              <ArrowRight className="size-5 text-black group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>

            {/* Extra Professional Features Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl border-t border-neutral-900 pt-12 mt-4 text-left">
              <div className="space-y-1.5">
                <h3 className="text-xs font-mono font-bold text-foreground uppercase">Universal Video Support</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">Drag & drop MP4 and MOV files directly, or instantly import reference videos using YouTube links.</p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-mono font-bold text-foreground uppercase">AI-Powered Blueprints</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">Generate production-ready script outlines, voiceover directions, and visual style palettes in seconds.</p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-mono font-bold text-foreground uppercase">Private by Design</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">Your files are analyzed in a secure, stateless session and deleted as soon as processing completes.</p>
              </div>
            </div>

            {/* Professional Footer for Landing View */}
            <footer className="w-full border-t border-neutral-900 pt-8 pb-4 mt-16 text-center text-xs text-neutral-600 select-none">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4 font-mono">
                <button 
                  onClick={() => setActiveModal('privacy')} 
                  className="hover:text-neutral-400 transition-colors cursor-pointer bg-transparent border-none text-xs font-mono"
                >
                  Privacy Policy
                </button>
                <button 
                  onClick={() => setActiveModal('terms')} 
                  className="hover:text-neutral-400 transition-colors cursor-pointer bg-transparent border-none text-xs font-mono"
                >
                  Terms of Service
                </button>
                <button 
                  onClick={() => setActiveModal('security')} 
                  className="hover:text-neutral-400 transition-colors cursor-pointer bg-transparent border-none text-xs font-mono"
                >
                  Security Disclosure
                </button>
              </div>
              <p className="text-[10px] font-mono">
                © 2026 Reframe. Powered by HalftoneMotion. All rights reserved.
              </p>
            </footer>
          </motion.main>
        ) : (
          /* =========================================================================
             2. CONSOLE WORKSPACE VIEW
             ========================================================================= */
          <motion.main
            key="console-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 relative z-10"
          >
            {/* Navigation Back Button & Breadcrumb */}
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <button
                onClick={() => setView('landing')}
                className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-foreground transition-colors cursor-pointer bg-neutral-950 border border-neutral-900 px-3 py-1.5 rounded-lg"
              >
                <span>← Back to Home</span>
              </button>
              <div className="text-xs font-mono text-neutral-500">
                Workspace / Console / stateless-sandbox
              </div>
            </div>

            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Pane (Ingestion Console & Progress) */}
              <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 bg-neutral-950/40 border border-white/10 rounded-[40px] p-8 shadow-sm">
                
                {/* Step-by-Step Navigation & Progress Guide */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-4 bg-neutral-950/50 rounded-lg px-2"
                >
                  <div className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${currentStep === 1 ? 'opacity-100 font-semibold' : 'opacity-40'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`flex size-6 items-center justify-center rounded-full text-[10px] font-mono font-bold border-2 ${currentStep >= 1 ? 'bg-foreground text-background border-foreground' : 'border-neutral-900 text-neutral-500'}`}>
                        1
                      </span>
                      <span className="text-xs font-semibold tracking-tight text-foreground uppercase font-mono">Input</span>
                    </div>
                  </div>

                  <div className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${currentStep === 2 ? 'opacity-100 font-semibold' : 'opacity-40'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`flex size-6 items-center justify-center rounded-full text-[10px] font-mono font-bold border-2 ${currentStep >= 2 ? 'bg-foreground text-background border-foreground' : 'border-neutral-900 text-neutral-500'}`}>
                        2
                      </span>
                      <span className="text-xs font-semibold tracking-tight text-foreground uppercase font-mono">Generate</span>
                    </div>
                  </div>
                </motion.div>

                {/* Ingestion Console */}
                <div className="space-y-6 flex flex-col pt-2">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h2 className="text-base font-medium tracking-tight text-foreground">
                        Content Ingestion
                      </h2>
                      <p className="text-[10px] font-mono font-bold tracking-widest text-foreground uppercase">
                        Media Ingestion & Upload Console
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <VideoInput 
                      onChange={setInputState}
                      onValidationChange={setIsValid} 
                    />

                    {/* Prominent Primary Trigger Button */}
                    <div ref={generateButtonRef}>
                      <motion.button
                        whileHover={{ scale: isValid && !isAnalyzing && cooldownSeconds === 0 ? 1.01 : 1 }}
                        whileTap={{ scale: isValid && !isAnalyzing && cooldownSeconds === 0 ? 0.99 : 1 }}
                        onClick={handleGenerateIntelligence}
                        disabled={!isValid || isAnalyzing || cooldownSeconds > 0}
                        className="w-full h-12 rounded-lg bg-white text-black font-semibold text-sm hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer shadow-lg hover:shadow-white/5 active:scale-[0.985]"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="size-4 animate-spin text-black" />
                            <span className="tracking-wide">Processing Media File...</span>
                          </>
                        ) : cooldownSeconds > 0 ? (
                          <>
                            <Loader2 className="size-4 animate-spin text-black/50" />
                            <span className="tracking-wide">Cooldown: Wait {cooldownSeconds}s</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4 text-black group-hover:rotate-12 transition-transform duration-300" />
                            <span className="tracking-wide">Generate Brief</span>
                            <ArrowRight className="size-3.5 text-black ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pane (Generated Output Results) */}
              <div className="lg:col-span-7 flex flex-col gap-6 lg:min-h-[650px] bg-neutral-950/60 border border-white/10 rounded-[40px] p-8 shadow-xl">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-medium tracking-tight text-foreground font-sans">
                      Generated Brief
                    </h2>
                    <p className="text-[10px] font-mono font-bold tracking-widest text-foreground uppercase">
                      Intelligence Reports & Output
                    </p>
                  </div>
                </div>

                {/* Smooth Scroll Target Container & Animated Results Area */}
                <div ref={cardSectionRef} className="scroll-mt-6 min-h-[250px] relative">
                  <AnimatePresence mode="wait">
                    {isAnalyzing && (
                      <motion.div
                        key="skeleton"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                      >
                        <BriefCardSkeleton />
                      </motion.div>
                    )}

                    {error && !isAnalyzing && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                      >
                        <BriefCardError error={error} onRetry={handleGenerateIntelligence} />
                      </motion.div>
                    )}

                    {hasProcessed && briefData && !isAnalyzing && !error && (
                      <motion.div
                        key="brief"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <BriefCard data={briefData} />
                      </motion.div>
                    )}

                    {!isAnalyzing && !hasProcessed && !error && (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="border border-dashed border-neutral-900 rounded-lg p-16 flex flex-col items-center justify-center text-center gap-4 bg-neutral-950/20 backdrop-blur-sm"
                      >
                        <div className="w-12 h-12 rounded-full bg-neutral-950 border border-neutral-900 flex items-center justify-center text-neutral-500 shadow-md">
                          <Sparkles className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-foreground">Awaiting Ingestion</h3>
                          <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                            Configure the media ingestion on the left and click "Generate Brief" to run the intelligence report.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

            {/* Footer inside Console View */}
            <footer className="w-full border-t border-neutral-900 py-6 mt-8 shrink-0 relative z-10 bg-background">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left select-none">
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
          </motion.main>
        )}
      </AnimatePresence>

      {/* Interactive Policy Modal Overlay */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 max-w-md w-full relative cursor-default shadow-2xl"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-foreground transition-colors cursor-pointer p-1 rounded-lg hover:bg-neutral-900"
              >
                <X className="size-4" />
              </button>
              
              <h3 className="text-base font-semibold text-foreground mb-4">
                {modalContent[activeModal].title}
              </h3>
              
              <div className="text-left space-y-4">
                {modalContent[activeModal].content}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
