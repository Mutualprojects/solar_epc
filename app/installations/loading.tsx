"use client";

import { Wrench, MapPin } from "lucide-react";

export default function InstallationsLoading() {
  return (
    <div className="h-screen w-full bg-[#f8fafc] flex overflow-hidden">
      {/* ── SIDEBAR SKELETON ── */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden lg:flex flex-col shrink-0 animate-pulse">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800" />
          <div className="h-4 bg-slate-800 w-24 rounded" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-800 rounded w-full" />
          ))}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header Skeleton */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between animate-pulse">
          <div className="h-4 bg-slate-200 w-48 rounded" />
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="h-4 bg-slate-200 w-24 rounded" />
          </div>
        </header>

        {/* Subheader Skeleton */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-4 bg-slate-200 w-32 rounded" />
              <div className="h-3 bg-slate-100 w-48 rounded" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="w-28 h-8 bg-slate-100 rounded-xl" />
            <div className="w-36 h-8 bg-slate-100 rounded-xl" />
            <div className="w-28 h-8 bg-slate-100 rounded-xl" />
            <div className="w-20 h-8 bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Card Grid Skeleton */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between gap-4 h-[220px]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-20 h-4 bg-slate-100 rounded" />
                  <div className="w-16 h-4 bg-slate-100 rounded-full" />
                </div>

                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="w-16 h-3 bg-slate-100 rounded" />
                    <div className="w-8 h-3 bg-slate-100 rounded" />
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full" />
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div className="h-5 bg-slate-50 rounded" />
                  <div className="h-5 bg-slate-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
