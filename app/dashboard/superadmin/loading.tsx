"use client";

export default function SuperAdminDashboardLoading() {
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden animate-pulse">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="h-4 bg-slate-200 w-48 rounded" />
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="h-4 bg-slate-200 w-24 rounded" />
          </div>
        </header>

        {/* Scrollable content area skeleton */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header Title skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-6 bg-slate-200 rounded w-48" />
              <div className="h-4 bg-slate-100 rounded w-80" />
            </div>
            <div className="w-28 h-8 bg-slate-200 rounded-xl" />
          </div>

          {/* Cards skeleton grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm h-32 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-2/3" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>

          {/* Charts section skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-7 border border-slate-200/70 h-[420px] flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="flex-1 bg-slate-50 rounded-2xl mt-4 flex items-end justify-between p-6 gap-3">
                  <div className="bg-slate-150 w-full rounded" style={{ height: '35%' }} />
                  <div className="bg-slate-150 w-full rounded" style={{ height: '65%' }} />
                  <div className="bg-slate-150 w-full rounded" style={{ height: '40%' }} />
                  <div className="bg-slate-150 w-full rounded" style={{ height: '85%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
