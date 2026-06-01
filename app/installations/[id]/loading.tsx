"use client";

export default function InstallationDetailsLoading() {
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
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 animate-pulse">
          <div className="w-32 h-6 bg-slate-100 rounded" />
          <div className="w-48 h-8 bg-slate-100 rounded-xl" />
          <div className="w-24 h-4 bg-slate-100 rounded" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-4 space-y-6">
              {/* Header Card Skeleton */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-5 bg-slate-100 rounded-lg" />
                  <div className="w-20 h-5 bg-slate-100 rounded-full" />
                </div>
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </div>
              </div>

              {/* Progress Ring Skeleton */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
                <div className="w-36 h-36 rounded-full border-8 border-slate-100 flex items-center justify-center" />
                <div className="h-4 bg-slate-200 rounded w-24" />
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:col-span-8 space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100" />
                      <div className="space-y-1">
                        <div className="h-4 bg-slate-200 rounded w-32" />
                        <div className="h-3 bg-slate-100 rounded w-20" />
                      </div>
                    </div>
                    <div className="w-20 h-5 bg-slate-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
