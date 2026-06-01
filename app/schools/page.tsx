"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";
import { DM_Sans } from "next/font/google";
import {
  School as SchoolIcon, Search, SlidersHorizontal, Grid, List, Table, Kanban,
  ChevronLeft, ChevronRight, Loader2, Pin, MapPin,
  X, Check, Info, Sparkles, GraduationCap, User as UserIcon, LogOut,
  Phone, Calendar, UserCheck, ShieldAlert,
  Database, Activity, Award, CheckCircle, AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

interface School {
  id: string;
  school_id: string;
  kgbv_name: string;
  district: string;
  pin_code?: string;
  address?: string;
  principal_name?: string;
  contact_number?: string;
  created_at?: string;
  is_active?: boolean;
  no_of_systems?: number;
}

export default function SchoolsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Data States
  const [schools, setSchools] = useState<School[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedSchoolDetails, setSelectedSchoolDetails] = useState<School | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenDrawer = (school: School) => {
    setSelectedSchoolDetails(school);
    setTimeout(() => setDrawerOpen(true), 10);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedSchoolDetails(null), 300);
  };

  // View Toggle: "grid" (Grid Card View) | "list" (List Row View) | "table" (Table View) | "kanban" (District Columns)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table" | "kanban">("grid");

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState(""); // School Dropdown ID
  const [selectedSystemFilter, setSelectedSystemFilter] = useState(""); // System count filter
  const [selectedStatus, setSelectedStatus] = useState("Completed"); // Default status filter to Completed

  // Pagination States (50 Records Per Page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Toast / Status Message
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Authentication & Data Fetching
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchSchools();
  }, [router]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const [resSchools, resInstallations] = await Promise.all([
        fetch("/api/schools"),
        fetch("/api/installations")
      ]);
      const dataSchools = await resSchools.json();
      const dataInstallations = await resInstallations.json();

      if (dataSchools.success) {
        setSchools(dataSchools.data || []);
        // Extract unique districts (converted to UPPERCASE to guarantee consistency)
        const uniqueDistricts: string[] = Array.from(
          new Set((dataSchools.data || []).map((s: School) => s.district?.toUpperCase()).filter(Boolean))
        );
        setDistricts(uniqueDistricts);
      } else {
        showToast("error", dataSchools.error || "Failed to fetch schools.");
      }

      if (dataInstallations.success) {
        setInstallations(dataInstallations.data || []);
      }
    } catch (err: any) {
      showToast("error", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Load saved filters on mount
  useEffect(() => {
    const savedDistrict = sessionStorage.getItem("school_district");
    if (savedDistrict !== null) setSelectedDistrict(savedDistrict);

    const savedSchool = sessionStorage.getItem("school_id");
    if (savedSchool !== null) setSelectedSchoolId(savedSchool);

    const savedSystem = sessionStorage.getItem("school_system");
    if (savedSystem !== null) setSelectedSystemFilter(savedSystem);

    const savedStatus = sessionStorage.getItem("school_status");
    if (savedStatus !== null) {
      setSelectedStatus(savedStatus);
    } else {
      setSelectedStatus("Completed");
    }

    const savedSearch = sessionStorage.getItem("school_search");
    if (savedSearch !== null) setSearchTerm(savedSearch);

    const savedPage = sessionStorage.getItem("school_page");
    if (savedPage) setCurrentPage(parseInt(savedPage, 10));

    const savedView = sessionStorage.getItem("school_view");
    if (savedView === "grid" || savedView === "list" || savedView === "table" || savedView === "kanban") {
      setViewMode(savedView as any);
    }
  }, []);

  // Save filters on change
  useEffect(() => {
    sessionStorage.setItem("school_district", selectedDistrict);
    sessionStorage.setItem("school_id", selectedSchoolId);
    sessionStorage.setItem("school_system", selectedSystemFilter);
    sessionStorage.setItem("school_status", selectedStatus);
    sessionStorage.setItem("school_search", searchTerm);
    sessionStorage.setItem("school_page", currentPage.toString());
    sessionStorage.setItem("school_view", viewMode);
  }, [selectedDistrict, selectedSchoolId, selectedSystemFilter, selectedStatus, searchTerm, currentPage, viewMode]);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDistrict, selectedSchoolId, selectedSystemFilter, selectedStatus]);

  // When District changes, reset selected School ID
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDistrict(e.target.value);
    setSelectedSchoolId(""); // Reset the specific school dropdown selection
  };

  // 2. Filter Logic
  // Filter the dropdown list of schools based on the selected district (if any is selected)
  const dropdownFilteredSchools = schools.filter(s => {
    if (!selectedDistrict) return true;
    return s.district?.toUpperCase() === selectedDistrict.toUpperCase();
  });

  // Filter and sort the final display schools list
  const filteredSchools = schools
    .filter(s => {
      // A. Matches District Dropdown (if selected)
      const matchesDistrict = !selectedDistrict || s.district?.toUpperCase() === selectedDistrict.toUpperCase();

      // B. Matches School Dropdown (if selected)
      const matchesSchoolId = !selectedSchoolId || s.id === selectedSchoolId;

      // C. Matches Search Query (Name or ID or Pincode)
      const search = searchTerm.toLowerCase();
      const name = s.kgbv_name?.toLowerCase() || "";
      const sid = s.school_id?.toLowerCase() || "";
      const pin = (s.pin_code || "").toLowerCase();
      const matchesSearch = !searchTerm || name.includes(search) || sid.includes(search) || pin.includes(search);

      // D. Matches System Filter (1 single system, 2 double systems, etc.)
      let matchesSystem = true;
      if (selectedSystemFilter === "1") {
        matchesSystem = s.no_of_systems === 1;
      } else if (selectedSystemFilter === "2") {
        matchesSystem = s.no_of_systems === 2;
      } else if (selectedSystemFilter === "3") {
        matchesSystem = s.no_of_systems === 3;
      } else if (selectedSystemFilter === "4+") {
        matchesSystem = (s.no_of_systems || 0) >= 4;
      }

      // E. Matches Status Filter
      let matchesStatus = true;
      if (selectedStatus) {
        const inst = installations.find(i => i.school_id === s.id);
        const overallStatus = inst?.overall_status || "Pending";
        matchesStatus = overallStatus.toLowerCase() === selectedStatus.toLowerCase();
      }

      return matchesDistrict && matchesSchoolId && matchesSearch && matchesSystem && matchesStatus;
    })
    .sort((a, b) => {
      const getPriority = (schoolId: string) => {
        const inst = installations.find(i => i.school_id === schoolId);
        if (!inst) return 3; // Default to Pending (priority 3)

        // 1. If overall_status is present, map it
        if (inst.overall_status) {
          const status = inst.overall_status.toLowerCase();
          if (status === "completed") return 1;
          if (status === "in progress") return 2;
          if (status === "pending") return 3;
        }

        // 2. Fallback to calculating from subsystem statuses
        const subStatuses = [
          inst.tank_status || "Pending",
          inst.mms_status || "Pending",
          inst.collectors_status || "Pending",
          inst.plumbing_status || "Pending"
        ].map(s => s.toLowerCase());

        const subPercentages = [
          inst.tank_percentage || 0,
          inst.mms_percentage || 0,
          inst.collectors_percentage || 0,
          inst.plumbing_percentage || 0
        ];

        let completedCount = 0;
        for (let i = 0; i < 4; i++) {
          if (subStatuses[i] === "completed" || subPercentages[i] > 0) {
            completedCount++;
          }
        }

        if (completedCount === 4) return 1;
        if (completedCount > 0) return 2;
        return 3;
      };

      const priorityA = getPriority(a.id);
      const priorityB = getPriority(b.id);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Secondary sort: keep alphabetical order by school name
      return a.kgbv_name.localeCompare(b.kgbv_name);
    });

  // 3. Pagination Logic
  const totalItems = filteredSchools.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchools = filteredSchools.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDistrict("");
    setSelectedSchoolId("");
    setSelectedSystemFilter("");
    setSelectedStatus("");
    handleCloseDrawer();
  };

  const renderInstallationStatusIndicators = (schoolId: string) => {
    const inst = installations.find(i => i.school_id === schoolId);
    const stages = [
      { label: "T", status: inst?.tank_status || "Pending", title: "Tank" },
      { label: "M", status: inst?.mms_status || "Pending", title: "MMS" },
      { label: "C", status: inst?.collectors_status || "Pending", title: "Collectors" },
      { label: "P", status: inst?.plumbing_status || "Pending", title: "Plumbing" },
    ];

    return (
      <div className="flex gap-1 items-center select-none" onClick={(e) => e.stopPropagation()}>
        {stages.map((stage) => {
          const isCompleted = stage.status?.toLowerCase() === "completed";
          return (
            <span
              key={stage.label}
              title={`${stage.title}: ${stage.status}`}
              className={`w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center border transition-all ${
                isCompleted
                  ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              {stage.label}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`h-screen w-full bg-[#f8fafc] flex overflow-hidden ${dmSans.className}`}>
      {/* ── SIDEBAR ── */}
      <SessionNavBar />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <SharedHeader
          placeholder="SEARCH BY SCHOOL NAME, ID OR PIN..."
          showSearch={true}
          searchTerm={searchTerm}
          setSearchTerm={(val) => setSearchTerm(val.toUpperCase())}
        />

        {/* Dynamic Toast Notifications */}
        {toast && (
          <div className="absolute top-20 right-6 z-50 animate-bounce">
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-xl ${toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
              }`}>
              {toast.type === "success" ? (
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
          </div>
        )}

        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-6 shrink-0 overflow-x-auto scrollbar-none">
          {/* Left: Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0">
              <SchoolIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight uppercase leading-tight">Schools Directory</h2>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">View and manage schools in the solar electrification network.</p>
            </div>
          </div>

          {/* Right: Filters & Controls in a single row */}
          <div className="flex items-center gap-3 shrink-0">

            {/* District dropdown (Label Removed) */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm w-44 shrink-0">
              <select
                value={selectedDistrict}
                onChange={handleDistrictChange}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-6 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none w-full truncate"
              >
                <option value="">ALL DISTRICTS</option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* School dropdown (Label Removed) */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm w-56 shrink-0">
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-6 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none w-full truncate"
              >
                <option value="">ALL SCHOOLS</option>
                {dropdownFilteredSchools.map(s => (
                  <option key={s.id} value={s.id}>{s.kgbv_name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* System Count dropdown (1 single system, 2 double systems, etc.) */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm w-48 shrink-0">
              <select
                value={selectedSystemFilter}
                onChange={(e) => setSelectedSystemFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-6 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none w-full truncate"
              >
                <option value="">ALL SYSTEMS</option>
                <option value="1">1 SINGLE SYSTEM</option>
                <option value="2">2 DOUBLE SYSTEMS</option>
                <option value="3">3 SYSTEMS</option>
                <option value="4+">4+ SYSTEMS</option>
              </select>
            </div>

            {/* Installation Status dropdown */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm w-44 shrink-0">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-6 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none w-full truncate"
              >
                <option value="">ALL STATUSES</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Reset Filters button */}
            {(searchTerm || selectedDistrict || selectedSchoolId || selectedSystemFilter || selectedStatus) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 uppercase tracking-wider shadow-sm shrink-0"
              >
                Clear
              </button>
            )}

            <div className="w-px h-5 bg-slate-200 hidden sm:block shrink-0"></div>

            {/* Four-Way View Mode Toggler */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === "grid" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === "list" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === "table" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                title="Table View"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === "kanban" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                title="Kanban View"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Kanban</span>
              </button>
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block shrink-0"></div>

            {/* Total count badge */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg shadow-sm shrink-0 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {schools.length} schools
            </div>
          </div>
        </div>

        {/* Scrollable Data/Content Section */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between gap-6 min-h-0">

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
              <p className="text-xs font-black text-slate-455 uppercase tracking-widest">Retrieving schools data...</p>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-16 flex flex-col items-center justify-center text-center gap-3 animate-fadeIn my-auto max-w-lg mx-auto w-full">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-150">
                <SchoolIcon className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">No matching schools found</h3>
              <p className="text-xs text-slate-455 font-bold uppercase leading-relaxed">
                We couldn't find any schools that match your search term or filtering options.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* 1. Grid Card View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fadeIn">
              {paginatedSchools.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleOpenDrawer(s)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-250 cursor-pointer transition-all p-4 flex flex-col justify-between relative group overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/10 via-emerald-500/50 to-emerald-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 font-black text-xs uppercase shadow-sm">
                        {s.kgbv_name.charAt(0)}
                      </div>
                      <span className="text-[9px] font-black text-emerald-650 uppercase tracking-widest bg-emerald-50/50 border border-emerald-100/50 px-2 py-0.5 rounded shadow-sm">
                        Systems: {s.no_of_systems || 0}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-2 min-h-[32px] group-hover:text-emerald-700 transition-colors">
                        {s.kgbv_name.toUpperCase()}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-450 uppercase">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500">{s.district.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
                    {renderInstallationStatusIndicators(s.id)}
                    <span className="text-emerald-600 font-extrabold uppercase text-[9px] bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-md group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === "list" ? (
            /* 2. List View (Wide Cards) */
            <div className="flex flex-col gap-3 animate-fadeIn">
              {paginatedSchools.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleOpenDrawer(s)}
                  className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md p-4 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm uppercase shrink-0">
                      {s.kgbv_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">
                        {s.kgbv_name.toUpperCase()}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-1 text-[10px] font-bold text-slate-455 uppercase">
                        <span className="inline-flex px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded font-black text-emerald-700 shadow-sm">
                          Systems: {s.no_of_systems || 0}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {s.district.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          {renderInstallationStatusIndicators(s.id)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">
                      Active Electrification
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === "table" ? (
            /* 3. Table View */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-black border-b border-slate-150 select-none">
                      <th className="py-3 px-4 pl-6">School Name</th>
                      <th className="py-3 px-4">Systems</th>
                      <th className="py-3 px-4">District</th>
                      <th className="py-3 px-4">Installation Status</th>
                      <th className="py-3 px-4 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                    {paginatedSchools.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => handleOpenDrawer(s)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 pl-6">
                          <span className="font-extrabold text-slate-800 uppercase">{s.kgbv_name.toUpperCase()}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-black uppercase tracking-wider">
                            {s.no_of_systems || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-600 uppercase font-extrabold">{s.district.toUpperCase()}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {renderInstallationStatusIndicators(s.id)}
                        </td>
                        <td className="py-3 px-4 pr-6 text-right">
                          <span className="inline-flex px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black uppercase">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 4. Kanban View (Grouped by District columns) */
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 select-none animate-fadeIn min-h-[50vh]">
              {districts.map(districtName => {
                const districtSchools = filteredSchools.filter(s => s.district?.toUpperCase() === districtName.toUpperCase());
                if (districtSchools.length === 0) return null; // Ignore columns that filter down to 0 matching items

                return (
                  <div key={districtName} className="w-80 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col shrink-0 max-h-full">
                    {/* Column Header */}
                    <div className="p-3.5 border-b border-slate-150 flex justify-between items-center bg-white rounded-t-2xl shrink-0">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{districtName}</span>
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                        {districtSchools.length}
                      </span>
                    </div>

                    {/* Column Card List */}
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
                      {districtSchools.map(school => (
                        <div
                          key={school.id}
                          onClick={() => handleOpenDrawer(school)}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col gap-2 group cursor-pointer"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black text-emerald-650 uppercase tracking-widest bg-emerald-50/50 border border-emerald-100/50 px-1.5 py-0.5 rounded shadow-sm">
                              Systems: {school.no_of_systems || 0}
                            </span>
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase shrink-0">
                              Active
                            </span>
                          </div>
                          <h5 className="text-xs font-black text-slate-800 uppercase leading-snug group-hover:text-emerald-700 transition-colors">
                            {school.kgbv_name.toUpperCase()}
                          </h5>
                          <div className="flex items-center justify-between mt-1 text-[9px] font-bold text-slate-450 uppercase border-t border-slate-50 pt-2">
                            {renderInstallationStatusIndicators(school.id)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls (50 items per page) */}
          {filteredSchools.length > 0 && viewMode !== "kanban" && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-4 mt-6 gap-3 shrink-0 select-none">
              <div className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
                Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} Schools
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl border border-slate-200 bg-white transition-all shadow-sm ${currentPage === 1
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-slate-50 active:scale-95 text-slate-700 hover:border-slate-350"
                    }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${currentPage === page
                        ? "bg-emerald-600 text-white shadow-md border border-emerald-600"
                        : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-350"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-xl border border-slate-200 bg-white transition-all shadow-sm ${currentPage === totalPages
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-slate-50 active:scale-95 text-slate-700 hover:border-slate-350"
                    }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── SCHOOL DETAILS OFF-CANVAS SIDE PANEL (Sliding Drawer) ── */}
      {selectedSchoolDetails && (
        <div className="fixed inset-0 z-50 flex justify-end select-none">
          {/* Backdrop overlay */}
          <div 
            onClick={handleCloseDrawer}
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${
              drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Drawer Panel content */}
          <div 
            className={`relative w-full sm:w-[480px] bg-[#f8fafc] h-full shadow-2xl border-l border-slate-200/80 flex flex-col z-50 transform transition-transform duration-300 ease-out ${
              drawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-800 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-emerald-250" />
                <h3 className="text-xs font-black uppercase tracking-wider font-['DM_Sans']">School Profile</h3>
              </div>
              <button 
                onClick={handleCloseDrawer}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-left">
              {/* Cover card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group shrink-0">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-black uppercase shrink-0 shadow-inner">
                    {selectedSchoolDetails.kgbv_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-slate-800 uppercase tracking-tight truncate">
                      {selectedSchoolDetails.kgbv_name.toUpperCase()}
                    </h4>
                  </div>
                </div>
              </div>

              {/* KPIs Grid */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col items-center text-center hover:border-slate-300 transition-colors">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Systems</span>
                  <span className="text-lg font-black text-slate-800">{selectedSchoolDetails.no_of_systems || 0}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col items-center text-center hover:border-slate-300 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${selectedSchoolDetails.is_active !== false ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Status</span>
                  <span className={`text-xs font-black uppercase mt-1 ${selectedSchoolDetails.is_active !== false ? "text-emerald-700" : "text-rose-700"}`}>
                    {selectedSchoolDetails.is_active !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Installation Status Section */}
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 shrink-0">Installation Status</h5>
              <div className="flex flex-col gap-3 shrink-0">
                {(() => {
                  const inst = installations.find(i => i.school_id === selectedSchoolDetails.id);
                  const stages = [
                    { name: "Tank", status: inst?.tank_status || "Pending", percentage: inst?.tank_percentage || 0 },
                    { name: "MMS", status: inst?.mms_status || "Pending", percentage: inst?.mms_percentage || 0 },
                    { name: "Collectors", status: inst?.collectors_status || "Pending", percentage: inst?.collectors_percentage || 0 },
                    { name: "Plumbing", status: inst?.plumbing_status || "Pending", percentage: inst?.plumbing_percentage || 0 }
                  ];

                  const isOverallCompleted = inst?.overall_status === 'Completed';
                  const hasCertificate = !!inst?.completion_certificate;

                  return (
                    <>
                      {/* Overall Progress */}
                      {inst && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Overall Progress</span>
                            <span className="text-xs font-black text-slate-800">{inst.overall_percentage || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${inst.overall_percentage || 0}%` }}></div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {stages.map((stage) => {
                          const isCompleted = stage.status.toLowerCase() === "completed" || stage.percentage > 0;
                          return (
                            <div key={stage.name} className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isCompleted ? (
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse shrink-0"></span>
                                ) : (
                                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></span>
                                )}
                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                                  {stage.name}
                                </span>
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 ${isCompleted ? "text-emerald-600" : "text-slate-400"}`}>
                                {isCompleted ? "Completed" : "Pending"}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Certificate Upload Status if Installation Completed */}
                      {isOverallCompleted && (
                        <div className={`mt-2 p-4 rounded-xl border flex flex-col gap-3 shadow-sm ${hasCertificate ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${hasCertificate ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                                <Award className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-[10px] font-black uppercase tracking-wider truncate ${hasCertificate ? "text-emerald-800" : "text-amber-800"}`}>
                                  Completion Certificate
                                </p>
                                <p className={`text-[11px] font-bold mt-0.5 truncate ${hasCertificate ? "text-emerald-600" : "text-amber-700"}`}>
                                  {hasCertificate ? "Official Document Uploaded" : "Missing / Pending Upload"}
                                </p>
                              </div>
                            </div>
                            {hasCertificate ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
                            )}
                          </div>
                          
                          {/* Image Preview */}
                          {hasCertificate && (
                            <div className="relative w-full h-[140px] rounded-lg overflow-hidden border border-emerald-200 shadow-sm bg-white mt-1 group">
                              <img
                                src={inst.completion_certificate.startsWith('https://') ? inst.completion_certificate : `/api/proxy-image?url=${encodeURIComponent(inst.completion_certificate)}`}
                                alt="Completion Certificate"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Unavailable';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Title label */}
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 shrink-0">Technical Details</h5>

              {/* Grid detail items */}
              <div className="flex flex-col gap-3.5 shrink-0">
                {/* District */}
                <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <MapPin className="w-5 h-5 text-slate-455" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">District Location</span>
                    <span className="text-xs font-black text-slate-800 uppercase block mt-0.5">{selectedSchoolDetails.district.toUpperCase()}</span>
                  </div>
                </div>

                {/* Pin Code */}
                <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <Pin className="w-5 h-5 text-slate-455" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pin Code / Zip</span>
                    <span className="text-xs font-black text-slate-800 uppercase block mt-0.5">{selectedSchoolDetails.pin_code || "N/A"}</span>
                  </div>
                </div>

                {/* Principal Name */}
                <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-550 shrink-0">
                    <UserIcon className="w-5 h-5 text-slate-455" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">School Head / Principal</span>
                    <span className="text-xs font-black text-slate-800 uppercase block mt-0.5">{selectedSchoolDetails.principal_name || "NOT SET"}</span>
                  </div>
                </div>

                {/* Contact Number */}
                <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-550 shrink-0">
                    <Phone className="w-5 h-5 text-slate-455" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Direct Contact Line</span>
                    <span className="text-xs font-black text-slate-800 uppercase block mt-0.5">{selectedSchoolDetails.contact_number || "NOT SET"}</span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-550 shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-slate-455" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Postal Address</span>
                    <span className="text-xs font-bold text-slate-700 uppercase leading-relaxed block mt-1">
                      {selectedSchoolDetails.address || "ADDRESS NOT CONFIGURED"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end select-none shrink-0 shadow-inner">
              <button 
                onClick={handleCloseDrawer}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md font-['DM_Sans'] text-center hover:shadow-lg active:scale-98"
              >
                Close Side Panel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
