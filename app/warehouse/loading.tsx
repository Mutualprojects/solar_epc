"use client";

export default function WarehouseLoading() {
  return (
    <div className="h-screen w-full bg-[#f8fafc] flex overflow-hidden">
      {/* Sidebar Skeleton */}
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

      {/* Main Content Skeleton */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden animate-pulse">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="h-4 bg-slate-200 w-48 rounded" />
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="h-4 bg-slate-200 w-24 rounded" />
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-6 bg-slate-200 rounded w-32" />
              <div className="h-4 bg-slate-100 rounded w-64" />
            </div>
            <div className="flex gap-2">
              <div className="w-28 h-9 bg-slate-200 rounded-xl" />
              <div className="w-28 h-9 bg-slate-200 rounded-xl" />
            </div>
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm h-28 flex flex-col justify-between">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>

          {/* Table / Grid list section skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-4">
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
            </div>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="p-4 border-b border-slate-100 flex gap-4">
                <div className="w-1/4 h-4 bg-slate-100 rounded" />
                <div className="w-1/4 h-4 bg-slate-100 rounded" />
                <div className="w-1/4 h-4 bg-slate-100 rounded" />
                <div className="w-1/4 h-4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
