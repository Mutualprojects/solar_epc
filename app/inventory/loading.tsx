"use client";

export default function InventoryLoading() {
  return (
    <div className="h-screen w-full bg-[#f8fafc] flex overflow-hidden animate-pulse">
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="h-4 bg-slate-200 w-48 rounded" />
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="h-4 bg-slate-200 w-24 rounded" />
          </div>
        </header>

        {/* Subheader */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-4 bg-slate-200 w-32 rounded" />
              <div className="h-3 bg-slate-100 w-48 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-56 h-8 bg-slate-100 rounded-xl animate-pulse" />
            <div className="w-44 h-8 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-4">
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
            </div>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="p-4 border-b border-slate-100 flex gap-4">
                <div className="w-1/4 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-1/4 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-1/4 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-1/4 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
