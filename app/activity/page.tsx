"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  Wrench,
  Package,
  UserCircle,
  School,
  Zap,
  Loader2,
  AlertCircle,
  Search,
  RefreshCw,
  Filter,
  Check,
  Inbox,
  Clock,
} from "lucide-react";
import { SessionNavBar } from "@/components/ui/sidebar";

const iconMap: Record<string, any> = {
  UserCircle,
  School,
  Package,
  Wrench,
  Zap,
};

const FILTERS = [
  { key: "all", label: "All", icon: Activity },
  { key: "UserCircle", label: "Users", icon: UserCircle },
  { key: "School", label: "Schools", icon: School },
  { key: "Package", label: "Inventory", icon: Package },
  { key: "Wrench", label: "Service", icon: Wrench },
  { key: "Zap", label: "Solar", icon: Zap },
];

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "Just started";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function parseUserAgent(ua: string) {
  if (!ua) return "Unknown Device";
  const lower = ua.toLowerCase();
  let os = "Device";
  let browser = "Browser";

  if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("macintosh") || lower.includes("mac os")) os = "macOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";
  else if (lower.includes("linux")) os = "Linux";

  if (lower.includes("chrome") || lower.includes("crios")) browser = "Chrome";
  else if (lower.includes("firefox")) browser = "Firefox";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";
  else if (lower.includes("edge")) browser = "Edge";
  
  return `${os} • ${browser}`;
}

function isSessionOnline(lastActiveStr: string) {
  if (!lastActiveStr) return false;
  const diff = Date.now() - new Date(lastActiveStr).getTime();
  return diff < 45000;
}

function timeAgo(dateString: string) {
  const diff = Math.max(0, Date.now() - new Date(dateString).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return `just now`;
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

// Buckets an activity into a date group label.
function dateGroup(dateString: string) {
  const now = new Date();
  const d = new Date(dateString);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  if (d >= startOfToday) return "Today";
  if (d >= startOfYesterday) return "Yesterday";
  if (d >= startOfWeek) return "This week";
  return "Earlier";
}

const GROUP_ORDER = ["Today", "Yesterday", "This week", "Earlier"];

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      if (data.success) {
        setActivities(data.data);
      } else {
        setError(data.error || "Failed to load activities");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const res = await fetch(`/api/admin/sessions?t=${Date.now()}`, { cache: "no-store" });
      const result = await res.json();
      if (result.success) {
        setSessions(result.data || []);
      }
    } catch (err) {
      console.error("Failed to load user login sessions", err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchSessions();

    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [fetchActivities, fetchSessions]);

  // Filter + search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities.filter((a) => {
      const matchesFilter = activeFilter === "all" || a.icon === activeFilter;
      const matchesQuery =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        a.desc?.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [activities, query, activeFilter]);

  // Group filtered results by date bucket, preserving order
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const a of filtered) {
      const g = dateGroup(a.timestamp);
      (map[g] ||= []).push(a);
    }
    return GROUP_ORDER.filter((g) => map[g]?.length).map((g) => ({
      group: g,
      items: map[g],
    }));
  }, [filtered]);

  const todayCount = useMemo(
    () => activities.filter((a) => dateGroup(a.timestamp) === "Today").length,
    [activities]
  );

  return (
    <div className="flex h-[100vh] overflow-hidden bg-slate-50/60 font-sans">
      <SessionNavBar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-5 sm:p-8 lg:p-10 max-w-7xl mx-auto">
          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-[0_8px_20px_rgba(16,185,129,0.15)] shrink-0">
                <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
                    Activity Log
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      Live
                    </span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                  Real-time overview of all platform events and updates.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                fetchActivities(true);
                fetchSessions();
              }}
              disabled={refreshing}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm hover:border-emerald-300 hover:text-emerald-700 hover:shadow transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* ── Stat chips ── */}
          {!loading && !error && activities.length > 0 && (
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 mb-6">
              <StatChip label="Total events" value={activities.length} />
              <StatChip label="Today" value={todayCount} accent />
              <StatChip label="Showing" value={filtered.length} muted />
            </div>
          )}

          {/* ── Split Layout Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left 2 Columns: Controls & Activity Feed */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* ── Controls: search + filters ── */}
              {!loading && !error && activities.length > 0 && (
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search events…"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                    {FILTERS.map((f) => {
                      const Ico = f.icon;
                      const active = activeFilter === f.key;
                      return (
                        <button
                          key={f.key}
                          onClick={() => setActiveFilter(f.key)}
                          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${active
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                            : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                            }`}
                        >
                          <Ico className="w-3.5 h-3.5" />
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Feed Container ── */}
              <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-8 lg:p-10 relative">
                {loading ? (
                  <SkeletonFeed />
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <p className="font-black text-slate-700">Couldn't load activities</p>
                    <p className="text-sm font-semibold text-slate-400 mt-1 max-w-sm">{error}</p>
                    <button
                      onClick={() => fetchActivities(true)}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Try again
                    </button>
                  </div>
                ) : activities.length === 0 ? (
                  <EmptyState
                    icon={<Activity className="w-8 h-8" />}
                    title="No activities logged yet"
                    subtitle="Events will appear here as they happen across the platform."
                  />
                ) : filtered.length === 0 ? (
                  <EmptyState
                    icon={<Inbox className="w-8 h-8" />}
                    title="No matching events"
                    subtitle="Try adjusting your search or filter."
                  />
                ) : (
                  <div className="flex flex-col gap-9">
                    {grouped.map(({ group, items }) => (
                      <div key={group}>
                        {/* Group header */}
                        <div className="flex items-center gap-3 mb-5">
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            {group}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {items.length}
                          </span>
                          <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        {/* Timeline */}
                        <div className="relative">
                          <div className="absolute left-[27px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-slate-100 via-slate-100 to-transparent rounded-full" />
                          <div className="flex flex-col gap-7">
                            {items.map((activity, idx) => {
                              const IconComponent = iconMap[activity.icon] || Activity;
                              return (
                                <div
                                  key={activity.id}
                                  className="flex gap-4 sm:gap-6 relative z-10 group animate-fadeInUp"
                                  style={{ animationDelay: `${Math.min(idx * 40, 320)}ms` }}
                                >
                                  {/* Icon node */}
                                  <div
                                    className={`w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] shrink-0 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${activity.bg} ${activity.color}`}
                                  >
                                    <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 pt-1.5 pb-1.5 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 mb-1">
                                      <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-800 truncate">
                                        {activity.title}
                                      </h3>
                                      <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full w-fit">
                                        {timeAgo(activity.timestamp)}
                                      </span>
                                    </div>
                                    <p className="text-[13px] sm:text-[14px] font-semibold text-slate-500 leading-relaxed">
                                      {activity.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Session tracker */}
            <div className="lg:col-span-1 flex flex-col gap-6 select-text">
              <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Live Staff Monitor</h3>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {sessions.filter(s => isSessionOnline(s.last_active_time)).length} Online
                  </span>
                </div>

                {sessionsLoading && sessions.length === 0 ? (
                  <div className="py-8 flex justify-center items-center">
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    No active sessions
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto pr-1 no-scrollbar">
                    {sessions.map((session: any) => {
                      const userData = session.users || {};
                      const roleName = userData.roles?.role_name || "Staff";
                      const online = isSessionOnline(session.last_active_time);
                      const initials = userData.full_name
                        ? userData.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                        : "US";

                      return (
                        <div key={session.id} className="flex items-start justify-between p-3 rounded-xl hover:bg-slate-50/50 border border-slate-55 transition-all">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-black flex items-center justify-center shrink-0 uppercase text-[11px] border border-emerald-100 relative">
                              {initials}
                              {online && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white animate-pulse"></span>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-slate-800 font-extrabold text-[11px] truncate uppercase leading-tight">
                                {userData.full_name || 'Unknown User'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold truncate lowercase mb-1.5 leading-none">
                                {userData.email || '—'}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                  roleName === "Super Admin" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                                  roleName === "Viewer" ? "bg-slate-100 text-slate-500 border border-slate-200" :
                                  "bg-blue-50 text-blue-700 border border-blue-100"
                                }`}>
                                  {roleName}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-0.5">
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  {formatDuration(session.duration_seconds)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-[8px] text-slate-550 font-extrabold uppercase">
                              {parseUserAgent(session.user_agent).split(" • ")[0]}
                            </span>
                            <span className="block text-[8px] text-slate-400 font-medium">
                              IP: {session.ip_address || "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          opacity: 0;
          animation: fadeInUp 0.4s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ── Sub-components ── */

function StatChip({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: number;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 sm:min-w-[120px] ${accent
        ? "bg-emerald-50 border-emerald-100"
        : muted
          ? "bg-slate-50 border-slate-100"
          : "bg-white border-slate-200"
        }`}
    >
      <div
        className={`text-2xl font-black tracking-tight ${accent ? "text-emerald-600" : "text-slate-800"
          }`}
      >
        {value}
      </div>
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
        {icon}
      </div>
      <p className="font-black text-slate-600">{title}</p>
      <p className="text-sm font-semibold text-slate-400 mt-1 max-w-sm">{subtitle}</p>
    </div>
  );
}

function SkeletonFeed() {
  return (
    <div className="relative">
      <div className="absolute left-[27px] top-3 bottom-3 w-[2px] bg-slate-100 rounded-full" />
      <div className="flex flex-col gap-7">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 sm:gap-6 relative z-10 animate-pulse">
            <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] shrink-0 rounded-2xl bg-slate-100 border-4 border-white" />
            <div className="flex-1 pt-2">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="h-3.5 bg-slate-100 rounded-full" style={{ width: `${40 + (i % 3) * 12}%` }} />
                <div className="h-4 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="h-3 bg-slate-100 rounded-full" style={{ width: `${65 + (i % 2) * 15}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}