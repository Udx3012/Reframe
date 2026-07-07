'use client';

import React from 'react';
import { Terminal, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full border-b border-white/6 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Identity (Linear/Vercel Aesthetic) */}
        <div className="flex items-center gap-3 select-none">
          <div className="h-9 w-9 rounded-lg bg-neutral-950 border border-neutral-900 flex items-center justify-center relative overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950 to-neutral-900 opacity-50 group-hover:scale-110 transition-transform duration-300" />
            <Sparkles className="size-4 text-neutral-200 relative z-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium tracking-tight text-white">Reframe</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-white/8 text-white/60">
                v1.0.0
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 font-mono tracking-tight uppercase">HalftoneMotion / Video Briefs</p>
          </div>
        </div>

        {/* Console Action */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Udx3012/Reframe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/50 hover:text-white hover:underline flex items-center gap-1.5 bg-neutral-950 hover:bg-neutral-900/60 border border-neutral-900 rounded-lg px-3 py-1.5 transition-all duration-300 outline-none cursor-pointer"
          >
            <Terminal className="size-3.5" />
            <span className="font-mono">Console</span>
          </a>
        </div>
      </div>
    </header>
  );
}
