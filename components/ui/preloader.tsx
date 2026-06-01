"use client";

import { useEffect, useState } from "react";

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const diff = Math.max(1, (100 - prev) * 0.15);
        return Math.min(100, prev + diff);
      });
    }, 80);

    // Initial load fade out
    const handleLoad = () => {
      setProgress(100);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 600); // matching transition duration
      }, 400);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    const fallbackTimeout = setTimeout(() => {
      handleLoad();
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      window.removeEventListener("load", handleLoad);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white transition-opacity duration-600 ease-in-out select-none ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ willChange: "opacity" }}
    >
      {/* Soft premium ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-emerald-100/30 rounded-full blur-[80px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-teal-100/20 rounded-full blur-[80px] animate-pulse delay-700"></div>

      <div className="flex flex-col items-center max-w-sm w-full px-6 text-center z-10">
        <div className="relative w-44 h-44 md:w-52 md:h-52 mb-8 rounded-3xl bg-white border border-slate-100 p-4 shadow-[0_12px_40px_rgba(16,185,129,0.08)] flex items-center justify-center overflow-hidden transition-all duration-500 hover:shadow-[0_16px_50px_rgba(16,185,129,0.12)] animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent"></div>
          
          <img
            src="/robot-with-solar-panel.png"
            alt="Solar Electrification Network"
            className="w-full h-full object-contain rounded-2xl transition-transform duration-700 hover:scale-105"
          />
        </div>

        <h1 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-[0.25em] leading-tight mb-2 font-sans">
          SOLAR <span className="text-emerald-600">EPC</span>
        </h1>
        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-6 font-sans">
          Rooftop Solar Implementation Platform
        </p>

        {/* Sleek light progress bar */}
        <div className="w-full max-w-[200px] bg-slate-100 border border-slate-200/50 h-1.5 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <span className="text-[8px] md:text-[9px] font-black text-emerald-600/80 uppercase tracking-widest mt-3.5 animate-pulse font-sans">
          {progress < 100 ? "Initializing systems..." : "Ready"}
        </span>
      </div>
    </div>
  );
}
