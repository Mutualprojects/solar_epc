"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  School, Wrench, Package, Zap, TrendingUp, AlertCircle, CheckCircle2, Loader2,
  Calendar, Filter, RefreshCw, X, ChevronLeft, ChevronRight, Eye, MapPin, Inbox,
  Info, ShieldCheck, Grid, Clock, ChevronDown, ListFilter, Search
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, AreaChart, Area
} from "recharts";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";
import DashboardFilter from "@/components/DashboardFilter";

// Skeleton Component for Cards
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse flex flex-col justify-between h-32">
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="w-5 h-5 bg-slate-150 rounded" />
      </div>
      <div className="h-6 bg-slate-100 rounded w-2/3 mb-1" />
    </div>
    <div className="h-3 bg-slate-100 rounded w-full" />
  </div>
);

// Skeleton Component for Charts
const SkeletonChart = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-96 flex flex-col justify-between">
    <div className="h-6 bg-slate-100 rounded w-1/3 mb-6" />
    <div className="flex-1 bg-slate-50 rounded-xl flex items-end justify-between p-6 gap-3">
      <div className="bg-slate-100 w-full rounded" style={{ height: '35%' }} />
      <div className="bg-slate-100 w-full rounded" style={{ height: '65%' }} />
      <div className="bg-slate-100 w-full rounded" style={{ height: '40%' }} />
      <div className="bg-slate-100 w-full rounded" style={{ height: '85%' }} />
    </div>
  </div>
);

// Animated Counter Component
const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const duration = 800; // Animation duration in ms
    const stepTime = Math.abs(Math.floor(duration / end)) || 15;
    
    const timer = setInterval(() => {
      start += Math.ceil(end / 40); // Proportional increments
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count.toLocaleString()}</>;
};

export default function SuperAdminDashboard() {
  const router = useRouter();

  // Helper to format dates chronologically
  const formatDate = (dStr: string | null) => {
    if (!dStr) return "N/A";
    return new Date(dStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Authentication & Global context
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Installations Data & Data Fetch states
  const [installations, setInstallations] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMaterialStatus, setSelectedMaterialStatus] = useState("All");
  const [selectedTankStatus, setSelectedTankStatus] = useState("All");
  const [selectedMmsStatus, setSelectedMmsStatus] = useState("All");
  const [selectedCollectorsStatus, setSelectedCollectorsStatus] = useState("All");
  const [selectedPlumbingStatus, setSelectedPlumbingStatus] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // 1. Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      const roleName = parsedUser.roles?.role_name || parsedUser.role;
      if (roleName !== "Super Admin") {
        router.push("/login");
        return;
      }
      setUser(parsedUser);
    } catch (e) {
      router.push("/login");
      return;
    }

    setAuthLoading(false);
    setMounted(true);
  }, [router]);

  // 2. Fetch Installations data
  const fetchInstallations = async () => {
    try {
      setDataLoading(true);
      setErrorMsg("");
      const res = await fetch(`/api/installations?t=${Date.now()}`, { cache: "no-store" });
      const result = await res.json();
      if (result.success) {
        setInstallations(result.data || []);
      } else {
        setErrorMsg(result.error || "Failed to load installation logs.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected database connectivity issue occurred.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchInstallations();
    }
  }, [authLoading]);

  // 3. Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedDistrict,
    selectedSchool,
    selectedStatus,
    startDate,
    endDate,
    searchQuery,
    selectedMaterialStatus,
    selectedTankStatus,
    selectedMmsStatus,
    selectedCollectorsStatus,
    selectedPlumbingStatus
  ]);

  // 4. Derive Dynamic Unique Options for Select Dropdowns
  const allUniqueDistricts = Array.from(
    new Set(installations.map(x => x.schools?.district?.trim()).filter(Boolean))
  ).sort() as string[];

  const allSchoolsFilteredByDistrict = installations
    .filter(x => !selectedDistrict || (x.schools?.district?.trim() || "").toUpperCase() === selectedDistrict.trim().toUpperCase())
    .map(x => ({ id: x.school_id, name: x.schools?.kgbv_name || "Unknown School" }))
    .filter((value, index, self) => self.findIndex(s => s.id === value.id) === index)
    .sort((a, b) => a.name.localeCompare(b.name));

  // 5. Dynamic Filters execution
  const filteredInstallations = installations.filter((item) => {
    // A. Global text search
    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();
      const schoolName = item.schools?.kgbv_name?.toLowerCase() || "";
      const schoolCode = item.schools?.school_id?.toLowerCase() || "";
      const district = item.schools?.district?.toLowerCase() || "";
      const instCode = item.installation_code?.toLowerCase() || "";
      const matCode = item.materials?.material_code?.toLowerCase() || "";
      if (!schoolName.includes(query) && !schoolCode.includes(query) && !district.includes(query) && !instCode.includes(query) && !matCode.includes(query)) {
        return false;
      }
    }

    // B. District Filter
    if (selectedDistrict) {
      const targetDist = selectedDistrict.trim().toUpperCase();
      const itemDist = (item.schools?.district || "").trim().toUpperCase();
      if (itemDist !== targetDist) {
        return false;
      }
    }

    // C. School Filter
    if (selectedSchool && item.school_id !== selectedSchool) {
      return false;
    }

    // D. Overall Installation Status Filter
    if (selectedStatus !== "All") {
      const targetStatus = selectedStatus.trim().toLowerCase();
      const itemStatus = (item.overall_status || "Pending").trim().toLowerCase();
      if (itemStatus !== targetStatus) {
        return false;
      }
    }

    // Material Status (Dispatched / Pending)
    if (selectedMaterialStatus !== "All") {
      const isDispatched = item.materials?.material_code && item.materials.material_code !== 'NOT DISPATCHED';
      if (selectedMaterialStatus === "Dispatched" && !isDispatched) return false;
      if (selectedMaterialStatus === "Pending" && isDispatched) return false;
    }

    // Tank Status
    if (selectedTankStatus !== "All") {
      if (item.tank_status !== selectedTankStatus) return false;
    }

    // MMS Status
    if (selectedMmsStatus !== "All") {
      if (item.mms_status !== selectedMmsStatus) return false;
    }

    // Collectors Status
    if (selectedCollectorsStatus !== "All") {
      if (item.collectors_status !== selectedCollectorsStatus) return false;
    }

    // Plumbing Status
    if (selectedPlumbingStatus !== "All") {
      if (item.plumbing_status !== selectedPlumbingStatus) return false;
    }

    // E. Date Range Filter (filters based on installation progress start, completion, or record creation date)
    if (startDate || endDate) {
      const dateString = item.completed_at || item.started_at || item.created_at;
      if (!dateString) return false;
      const itemTime = new Date(dateString).getTime();

      if (startDate) {
        const startSecs = new Date(startDate).setHours(0, 0, 0, 0);
        if (itemTime < startSecs) return false;
      }
      if (endDate) {
        const endSecs = new Date(endDate).setHours(23, 59, 59, 999);
        if (itemTime > endSecs) return false;
      }
    }

    return true;
  });

  // Helper to extract the actual tank/system count for an installation record
  const getSystemCount = (item: any) => {
    return Math.max(1, item.schools?.no_of_systems || 1);
  };

  // 6. Metric Calculations
  const totalSchools = Array.from(new Set(filteredInstallations.map(x => x.school_id))).length;
  const grandSchools = Array.from(new Set(installations.map(x => x.school_id))).length;

  const totalInstalledSchools = filteredInstallations
    .filter(x => x.overall_status === 'Completed').length;
  const grandInstalledSchools = installations
    .filter(x => x.overall_status === 'Completed').length;

  const totalInstalledSystems = filteredInstallations
    .filter(x => x.overall_status === 'Completed')
    .reduce((sum, item) => sum + getSystemCount(item), 0);
  const grandInstalledSystems = installations
    .filter(x => x.overall_status === 'Completed')
    .reduce((sum, item) => sum + getSystemCount(item), 0);

  const filteredSystemsCount = filteredInstallations.reduce((sum, item) => sum + getSystemCount(item), 0);
  const totalSystemsCount = installations.reduce((sum, item) => sum + getSystemCount(item), 0);

  const pendingSystems = filteredSystemsCount - totalInstalledSystems;
  const grandPendingSystems = totalSystemsCount - grandInstalledSystems;

  const pendingSchools = totalSchools - totalInstalledSchools;
  const grandPendingSchools = grandSchools - grandInstalledSchools;

  // Compatibility aliases
  const totalInstalled = totalInstalledSystems;
  const grandInstalled = grandInstalledSystems;
  const pendingInstallations = pendingSystems;
  const grandPending = grandPendingSystems;

  const filteredCount = filteredSystemsCount;
  const totalInstallationsCount = totalSystemsCount;

  // Individual Subsystems completed counts based on system/tank counts
  const tankCompleted = filteredInstallations
    .filter(x => x.tank_status === 'Completed')
    .reduce((sum, item) => sum + getSystemCount(item), 0);
  const grandTank = installations
    .filter(x => x.tank_status === 'Completed')
    .reduce((sum, item) => sum + getSystemCount(item), 0);

  const mmsCompleted = filteredInstallations
    .filter(x => x.mms_status === 'Completed')
    .reduce((sum, item) => sum + getSystemCount(item), 0);
  const grandMms = installations
    .filter(x => x.mms_status === 'Completed')
    .reduce((sum, item) => sum + getSystemCount(item), 0);

  const collectorsCompleted = filteredInstallations
    .filter(x => x.collectors_status === 'Completed')
    .reduce((sum, item) => sum + getSystemCount(item), 0);
  const grandCollectors = installations
    .filter(x => x.collectors_status === 'Completed')
    .reduce((sum, item) => sum + getSystemCount(item), 0);

  const plumbingCompleted = filteredInstallations
    .filter(x => x.plumbing_status === 'Completed')
    .reduce((sum, item) => sum + getSystemCount(item), 0);
  const grandPlumbing = installations
    .filter(x => x.plumbing_status === 'Completed')
    .reduce((sum, item) => sum + getSystemCount(item), 0);

  // 7. Paginated items for the table
  const totalPages = Math.max(1, Math.ceil(filteredInstallations.length / itemsPerPage));
  const paginatedInstallations = filteredInstallations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 8. Recharts visual structures calculation (with premium and matching HSL/Hex combinations)
  // A. Wave progression timeline (Execution Status over time based on system count tallies)
  // Sort installations chronologically by their completed_at, started_at, or created_at date
  const sortedInstallationsForTimeline = [...installations]
    .filter(x => x.completed_at || x.started_at || x.created_at)
    .sort((a, b) => {
      const dateA = new Date(a.completed_at || a.started_at || a.created_at).getTime();
      const dateB = new Date(b.completed_at || b.started_at || b.created_at).getTime();
      return dateA - dateB;
    });

  let runningTank = 0;
  let runningMms = 0;
  let runningCollectors = 0;
  let runningPlumbing = 0;

  const timelineDataPoints = sortedInstallationsForTimeline.map((item) => {
    const sysCount = getSystemCount(item);
    if (item.tank_status === "Completed") runningTank += sysCount;
    if (item.mms_status === "Completed") runningMms += sysCount;
    if (item.collectors_status === "Completed") runningCollectors += sysCount;
    if (item.plumbing_status === "Completed") runningPlumbing += sysCount;

    const dateLabel = formatDate(item.completed_at || item.started_at || item.created_at);
    return {
      date: dateLabel,
      Tank: runningTank,
      MMS: runningMms,
      Collectors: runningCollectors,
      Plumbing: runningPlumbing
    };
  });

  // Consolidate duplicate dates to avoid crowded x-axis
  const consolidatedTimelineMap: { [key: string]: typeof timelineDataPoints[0] } = {};
  timelineDataPoints.forEach((pt) => {
    consolidatedTimelineMap[pt.date] = pt; // Store latest cumulative numbers for that date
  });

  const rawConsolidatedList = Object.values(consolidatedTimelineMap);
  const finalProgressionData = rawConsolidatedList.length > 0 ? rawConsolidatedList.slice(-12) : [
    { date: "Initial", Tank: 0, MMS: 0, Collectors: 0, Plumbing: 0 },
    { date: "Kickoff", Tank: Math.round(grandTank * 0.25), MMS: Math.round(grandMms * 0.15), Collectors: Math.round(grandCollectors * 0.1), Plumbing: Math.round(grandPlumbing * 0.05) },
    { date: "Midway", Tank: Math.round(grandTank * 0.6), MMS: Math.round(grandMms * 0.5), Collectors: Math.round(grandCollectors * 0.45), Plumbing: Math.round(grandPlumbing * 0.35) },
    { date: "Current Status", Tank: grandTank, MMS: grandMms, Collectors: grandCollectors, Plumbing: grandPlumbing }
  ];

  // B. District-wise Progress (Stacked Bar Chart based on system count)
  const districtProgGroups: { [key: string]: { district: string, Completed: number, 'In Progress': number, Pending: number } } = {};
  installations.forEach((item) => {
    const dName = item.schools?.district || "Other";
    const sysCount = getSystemCount(item);
    if (!districtProgGroups[dName]) {
      districtProgGroups[dName] = { district: dName, Completed: 0, 'In Progress': 0, Pending: 0 };
    }
    const status = item.overall_status || "Pending";
    if (status === "Completed") districtProgGroups[dName].Completed += sysCount;
    else if (status === "In Progress") districtProgGroups[dName]['In Progress'] += sysCount;
    else districtProgGroups[dName].Pending += sysCount;
  });
  const districtProgressData = Object.values(districtProgGroups)
    .sort((a, b) => (b.Completed + b['In Progress'] + b.Pending) - (a.Completed + a['In Progress'] + a.Pending))
    .slice(0, 10); // Display top 10 districts for UI neatness

  // Helpers for list styling

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Completed
          </span>
        );
      case "in progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-250 rounded-full text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            In Progress
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Pending
          </span>
        );
    }
  };

  const getProgressBar = (percentage: number) => {
    const color = percentage === 100 ? 'bg-teal-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-indigo-400';
    return (
      <div className="flex items-center gap-2 max-w-[120px]">
        <div className="w-full bg-slate-100 border border-slate-200/50 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-[10px] font-black text-slate-500">{percentage}%</span>
      </div>
    );
  };

  const getStageIndicatorBadge = (status: string, letter: string, title: string) => {
    let color = "bg-slate-50 text-slate-400 border-slate-200";
    if (status?.toLowerCase() === "completed") color = "bg-teal-600 text-white border-teal-650 font-extrabold";
    else if (status?.toLowerCase() === "in progress") color = "bg-amber-550 text-white border-amber-600 font-extrabold";
    else if (status?.toLowerCase() === "suspended") color = "bg-rose-500 text-white border-rose-600 font-extrabold";

    return (
      <span
        title={`${title}: ${status || "Pending"}`}
        className={`w-6 h-6 rounded-full border text-[9px] font-black flex items-center justify-center cursor-help select-none shadow-sm transition-transform hover:scale-105 ${color}`}
      >
        {letter}
      </span>
    );
  };

  const getStageIndicators = (item: any) => {
    return (
      <div className="flex items-center gap-1.5">
        {getStageIndicatorBadge(item.tank_status, "T", "Water Tank")}
        {getStageIndicatorBadge(item.mms_status, "M", "MMS Structure")}
        {getStageIndicatorBadge(item.collectors_status, "C", "Solar Collectors")}
        {getStageIndicatorBadge(item.plumbing_status, "P", "Plumbing Works")}
      </div>
    );
  };

  const clearFilters = () => {
    setSelectedDistrict("");
    setSelectedSchool("");
    setSelectedStatus("All");
    setSelectedMaterialStatus("All");
    setSelectedTankStatus("All");
    setSelectedMmsStatus("All");
    setSelectedCollectorsStatus("All");
    setSelectedPlumbingStatus("All");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="font-bold text-slate-500 animate-pulse font-['DM_Sans']">Checking Auth Credentials...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex font-['DM_Sans'] overflow-hidden">

      {/* ── SIDEBAR ── */}
      <SessionNavBar />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Shared Header linked to local query filter state */}
        <SharedHeader
          placeholder="Global Search - school, district, installation code..."
          showSearch={true}
          searchTerm={searchQuery}
          setSearchTerm={setSearchQuery}
        />

        {/* Dashboard Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc] flex flex-col gap-8">

          {/* Header Title Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none shrink-0">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none mb-2">Command Center</h2>
              <p className="text-sm font-semibold text-slate-455">Real-time solar EPC dashboard and dynamic school installation analytics.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchInstallations}
                disabled={dataLoading}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md cursor-pointer font-bold text-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-550 ${dataLoading ? 'animate-spin text-teal-650' : ''}`} />
                {dataLoading ? "Syncing..." : "Sync Fleet"}
              </button>

              <div className="flex items-center gap-2 text-xs font-black text-slate-500 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
                LIVE OPERATION
              </div>
            </div>
          </div>

          {/* Error Message banner */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4.5 flex items-start gap-3 animate-fadeIn shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-rose-800 uppercase tracking-wide">Sync Conflict Alert</h4>
                <p className="text-xs text-rose-600 font-bold mt-1">{errorMsg}</p>
                <button
                  onClick={fetchInstallations}
                  className="mt-2 text-[10px] font-black text-rose-800 underline uppercase tracking-wider hover:text-rose-900 cursor-pointer"
                >
                  Force Retry Sync
                </button>
              </div>
            </div>
          )}

          {/* ── KPI METRICS PANEL ── */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest select-none">Executive Fleet Performance</h3>
              <span className="text-[9px] font-black bg-teal-50 border border-teal-100 text-teal-800 rounded px-2.5 py-0.5 select-none uppercase tracking-widest">
                {filteredInstallations.length} of {installations.length} Schools
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">

              {dataLoading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                <>
                  {/* Card 1: Total Installed */}
                  <div className="bg-white rounded-2xl p-4 pb-3 border-l-4 border-l-emerald-500 border border-slate-200/70 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute -top-3 -right-3 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-300">
                      <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Installed</p>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                    </div>
                    <div className="flex items-baseline gap-1 mb-1 select-none">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none"><AnimatedCounter value={grandInstalledSystems} /></h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Systems</span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-650 flex items-center gap-1.5 border-t border-slate-50 pt-1.5 mt-1.5 select-none">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {grandInstalledSystems} Systems / {grandInstalledSchools} Schools Installed
                    </p>
                  </div>

                  {/* Card 2: Pending Installations */}
                  <div className="bg-white rounded-2xl p-4 pb-3 border-l-4 border-l-indigo-500 border border-slate-200/70 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute -top-3 -right-3 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-300">
                      <Clock className="w-16 h-16 text-indigo-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Installations</p>
                      <Clock className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                    </div>
                    <div className="flex items-baseline gap-1 mb-1 select-none">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none"><AnimatedCounter value={grandPendingSystems} /></h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Systems</span>
                    </div>
                    <p className="text-[10px] font-bold text-indigo-650 flex items-center gap-1.5 border-t border-slate-50 pt-1.5 mt-1.5 select-none">
                      <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      {grandPendingSystems} Systems / {grandPendingSchools} Schools Pending
                    </p>
                  </div>

                  {/* Card 3: Total Schools */}
                  <div className="bg-white rounded-2xl p-4 pb-3 border-l-4 border-l-cyan-500 border border-slate-200/70 shadow-sm hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute -top-3 -right-3 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-300">
                      <School className="w-16 h-16 text-cyan-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Schools</p>
                      <School className="w-5 h-5 text-cyan-600 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1 select-none"><AnimatedCounter value={grandSchools} /></h3>
                    <p className="text-[10px] font-bold text-cyan-650 flex items-center gap-1.5 border-t border-slate-50 pt-1.5 mt-1.5 select-none">
                      <Info className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      {grandSchools} Schools Registered
                    </p>
                  </div>

                  {/* Card 4: Total Systems */}
                  <div className="bg-white rounded-2xl p-4 pb-3 border-l-4 border-l-blue-500 border border-slate-200/70 shadow-sm hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute -top-3 -right-3 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-300">
                      <Zap className="w-16 h-16 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Systems</p>
                      <Zap className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1 select-none"><AnimatedCounter value={totalSystemsCount} /></h3>
                    <p className="text-[10px] font-bold text-blue-650 flex items-center gap-1.5 border-t border-slate-50 pt-1.5 mt-1.5 select-none">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      {totalSystemsCount} Systems in Database
                    </p>
                  </div>

                  {/* Card 5: Tank Completed */}
                  <div className="bg-white rounded-2xl p-4 pb-3 border-l-4 border-l-sky-500 border border-slate-200/70 shadow-sm hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute -top-3 -right-3 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-300">
                      <Package className="w-16 h-16 text-sky-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanks Completed</p>
                      <Package className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1 select-none"><AnimatedCounter value={grandTank} /></h3>
                    <p className="text-[10px] font-bold text-sky-650 flex items-center gap-1.5 border-t border-slate-50 pt-1.5 mt-1.5 select-none">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      {grandTank} Tanks Complete
                    </p>
                  </div>

                  {/* Card 6: MMS Completed */}
                  <div className="bg-white rounded-2xl p-4 pb-3 border-l-4 border-l-amber-500 border border-slate-200/70 shadow-sm hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute -top-3 -right-3 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-300">
                      <Zap className="w-16 h-16 text-amber-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MMS Completed</p>
                      <Zap className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1 select-none"><AnimatedCounter value={grandMms} /></h3>
                    <p className="text-[10px] font-bold text-amber-650 flex items-center gap-1.5 border-t border-slate-50 pt-1.5 mt-1.5 select-none">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {grandMms} Structures Certified
                    </p>
                  </div>

                  {/* Card 7: Collectors Completed */}
                  <div className="bg-white rounded-2xl p-4 pb-3 border-l-4 border-l-violet-500 border border-slate-200/70 shadow-sm hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute -top-3 -right-3 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-300">
                      <Grid className="w-16 h-16 text-violet-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collectors Completed</p>
                      <Grid className="w-5 h-5 text-violet-600 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1 select-none"><AnimatedCounter value={grandCollectors} /></h3>
                    <p className="text-[10px] font-bold text-violet-650 flex items-center gap-1.5 border-t border-slate-50 pt-1.5 mt-1.5 select-none">
                      <ShieldCheck className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      {grandCollectors} Solar Arrays Live
                    </p>
                  </div>

                  {/* Card 8: Plumbing Completed */}
                  <div className="bg-white rounded-2xl p-4 pb-3 border-l-4 border-l-emerald-500 border border-slate-200/70 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute -top-3 -right-3 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-300">
                      <Wrench className="w-16 h-16 text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plumbing Completed</p>
                      <Wrench className="w-5 h-5 text-emerald-650 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1 select-none"><AnimatedCounter value={grandPlumbing} /></h3>
                    <p className="text-[10px] font-bold text-emerald-650 flex items-center gap-1.5 border-t border-slate-50 pt-1.5 mt-1.5 select-none">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {grandPlumbing} Hydraulics Active
                    </p>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* ── CHARTS SECTION (SIDE-BY-SIDE PROGRESSION) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 select-none">

            {/* Chart 1: EPC Component Execution Status Timeline (Wave Chart) */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[420px]">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Execution Status Timeline</h3>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Chronological progression of completed component systems</span>
              </div>

              {dataLoading ? (
                <SkeletonChart />
              ) : !mounted ? (
                <div className="h-72 w-full flex items-center justify-center bg-slate-50/50 rounded-xl text-xs font-bold text-slate-400">Loading Visuals...</div>
              ) : (
                <div className="h-72 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={finalProgressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTank" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMms" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPlumb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontWeight: 'bold', fontFamily: 'DM Sans' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', paddingTop: '15px' }}
                      />
                      <Area type="monotone" dataKey="Tank" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTank)" name="Water Tank" />
                      <Area type="monotone" dataKey="MMS" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorMms)" name="MMS Structure" />
                      <Area type="monotone" dataKey="Collectors" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorColl)" name="Solar Collectors" />
                      <Area type="monotone" dataKey="Plumbing" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorPlumb)" name="Plumbing Works" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 2: District-wise Progress (Stacked Bar) */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[420px]">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Top Districts Performance</h3>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Operational volume and system breakdown by district</span>
              </div>

              {dataLoading ? (
                <SkeletonChart />
              ) : !mounted ? (
                <div className="h-72 w-full flex items-center justify-center bg-slate-50/50 rounded-xl text-xs font-bold text-slate-400">Loading Visuals...</div>
              ) : districtProgressData.length === 0 ? (
                <div className="h-72 w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl gap-2">
                  <Inbox className="w-8 h-8 text-slate-350" />
                  <span className="text-xs font-black text-slate-455 uppercase tracking-widest">No District Matches Found</span>
                </div>
              ) : (
                <div className="h-72 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtProgressData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="district" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontWeight: 'bold', fontFamily: 'DM Sans' }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} />
                      <Bar dataKey="Completed" stackId="a" fill="#0d9488" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="In Progress" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Pending" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ── DashboardFilter Component ── */}
          <DashboardFilter installations={installations} dataLoading={dataLoading} />
          

        </div>
      </main>
    </div>
  );
}
