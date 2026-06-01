"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";
import { DM_Sans } from "next/font/google";
import { 
  Wrench, Search, Grid, List, Table, Kanban,
  ChevronLeft, ChevronRight, Loader2, MapPin, 
  X, Check, Info, Calendar, Phone, Plus,
  Camera, Eye, EyeOff, Save, Trash2, Edit3, ArrowRight,
  TrendingUp, Activity, CheckCircle, Clock, LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  pincode?: string;
  principal_name?: string;
  contact_number?: string;
  address?: string;
  no_of_systems?: number;
}

interface Material {
  id: string;
  material_code: string;
  capacity?: string;
}

interface Installation {
  id: string;
  created_at: string;
  school_id: string;
  material_id: string;
  installation_code: string;
  started_at: string | null;
  completed_at: string | null;
  
  // TANK
  tank_status: string;
  tank_percentage: number;
  tank_remarks: string;
  tank_images: string[];
  tank_updated_at: string | null;

  // MMS
  mms_status: string;
  mms_percentage: number;
  mms_remarks: string;
  mms_images: string[];
  mms_updated_at: string | null;

  // COLLECTORS
  collectors_status: string;
  collectors_percentage: number;
  collectors_remarks: string;
  collectors_images: string[];
  collectors_updated_at: string | null;

  // PLUMBING
  plumbing_status: string;
  plumbing_percentage: number;
  plumbing_remarks: string;
  plumbing_images: string[];
  plumbing_updated_at: string | null;

  // OVERALL
  overall_percentage: number;
  overall_status: string;
  remarks: string;

  // JOINED
  schools?: School;
  materials?: Material;
}

export default function InstallationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Data States
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  // Selection/Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // View Mode: "grid" | "table"
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Completed");

  // Pagination States (50 per page as required)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Toast State
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Create Form State
  const [newSchoolId, setNewSchoolId] = useState("");
  const [newMaterialId, setNewMaterialId] = useState("");
  const [newInstCode, setNewInstCode] = useState("");
  const [creating, setCreating] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchInitialData();
  }, [router]);

  // Load saved filters on mount
  useEffect(() => {
    const savedDistrict = sessionStorage.getItem("inst_district");
    if (savedDistrict !== null) setSelectedDistrict(savedDistrict);

    const savedSchool = sessionStorage.getItem("inst_school");
    if (savedSchool !== null) setSelectedSchoolId(savedSchool);

    const savedStatus = sessionStorage.getItem("inst_status");
    if (savedStatus !== null) {
      setSelectedStatus(savedStatus);
    } else {
      setSelectedStatus("Completed");
    }

    const savedSearch = sessionStorage.getItem("inst_search");
    if (savedSearch !== null) setSearchTerm(savedSearch);

    const savedPage = sessionStorage.getItem("inst_page");
    if (savedPage) setCurrentPage(parseInt(savedPage, 10));

    const savedView = sessionStorage.getItem("inst_view");
    if (savedView === "grid" || savedView === "table") setViewMode(savedView);
  }, []);

  // Save filters on change
  useEffect(() => {
    sessionStorage.setItem("inst_district", selectedDistrict);
    sessionStorage.setItem("inst_school", selectedSchoolId);
    sessionStorage.setItem("inst_status", selectedStatus);
    sessionStorage.setItem("inst_search", searchTerm);
    sessionStorage.setItem("inst_page", currentPage.toString());
    sessionStorage.setItem("inst_view", viewMode);
  }, [selectedDistrict, selectedSchoolId, selectedStatus, searchTerm, currentPage, viewMode]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const timestamp = Date.now();
      // Fetch installations, schools and materials in parallel
      const [resInst, resSchools, resMaterials] = await Promise.all([
        fetch(`/api/installations?t=${timestamp}`, { cache: "no-store" }),
        fetch(`/api/schools?t=${timestamp}`, { cache: "no-store" }),
        fetch(`/api/materials?t=${timestamp}`, { cache: "no-store" })
      ]);

      const dataInst = await resInst.json();
      const dataSchools = await resSchools.json();
      const dataMaterials = await resMaterials.json();

      if (dataInst.success) {
        setInstallations(dataInst.data || []);
      }
      if (dataSchools.success) {
        setSchools(dataSchools.data || []);
        // Extract unique districts
        const uniqueDistricts: string[] = Array.from(
          new Set((dataSchools.data || []).map((s: School) => s.district?.trim().toUpperCase()).filter(Boolean))
        );
        setDistricts(uniqueDistricts);
      }
      if (dataMaterials.success) {
        setMaterials(dataMaterials.data || []);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to retrieve installation module records.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger refetch
  const refetchInstallations = async () => {
    try {
      const res = await fetch(`/api/installations?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setInstallations(data.data || []);
      }
    } catch (e: any) {
      console.error("Error refetching:", e.message);
    }
  };

  // Filter Dropdowns
  const dropdownFilteredSchools = schools.filter(s => {
    if (!selectedDistrict) return true;
    return s.district?.trim().toUpperCase() === selectedDistrict.trim().toUpperCase();
  });

  // Main list filters
  const filteredInstallations = installations.filter(inst => {
    const matchesDistrict = !selectedDistrict || inst.schools?.district?.trim().toUpperCase() === selectedDistrict.trim().toUpperCase();
    const matchesSchool = !selectedSchoolId || inst.school_id === selectedSchoolId;
    const matchesStatus = !selectedStatus || inst.overall_status?.toLowerCase() === selectedStatus.toLowerCase();
    
    const search = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      inst.installation_code?.toLowerCase().includes(search) ||
      inst.overall_status?.toLowerCase().includes(search) ||
      inst.remarks?.toLowerCase().includes(search) ||
      inst.schools?.kgbv_name?.toLowerCase().includes(search) ||
      inst.schools?.district?.toLowerCase().includes(search) ||
      inst.schools?.pincode?.toLowerCase().includes(search) ||
      inst.schools?.principal_name?.toLowerCase().includes(search) ||
      inst.schools?.contact_number?.toLowerCase().includes(search) ||
      inst.schools?.address?.toLowerCase().includes(search) ||
      inst.materials?.material_code?.toLowerCase().includes(search) ||
      inst.materials?.capacity?.toLowerCase().includes(search) ||
      inst.tank_status?.toLowerCase().includes(search) ||
      inst.mms_status?.toLowerCase().includes(search) ||
      inst.collectors_status?.toLowerCase().includes(search) ||
      inst.plumbing_status?.toLowerCase().includes(search) ||
      inst.tank_remarks?.toLowerCase().includes(search) ||
      inst.mms_remarks?.toLowerCase().includes(search) ||
      inst.collectors_remarks?.toLowerCase().includes(search) ||
      inst.plumbing_remarks?.toLowerCase().includes(search);

    return matchesDistrict && matchesSchool && matchesStatus && matchesSearch;
  });

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDistrict("");
    setSelectedSchoolId("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  // Pagination
  const totalItems = filteredInstallations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInstallations = filteredInstallations.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };



  // Handle Create Submit
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolId || !newMaterialId || !newInstCode) {
      showToast("error", "Please fill in all required setup fields.");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/installations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: newSchoolId,
          material_id: newMaterialId,
          installation_code: newInstCode.toUpperCase().trim()
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast("success", "Installation record successfully created!");
        setIsCreateOpen(false);
        setNewSchoolId("");
        setNewMaterialId("");
        setNewInstCode("");
        refetchInstallations();
      } else {
        showToast("error", data.error || "Failed to create installation record.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred.");
    } finally {
      setCreating(false);
    }
  };

  // Status style helper
  const getStatusBadgeStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "in progress":
        return "bg-amber-50 text-amber-700 border-amber-250";
      case "suspended":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className={`h-screen w-full bg-[#f8fafc] flex overflow-hidden ${dmSans.className}`}>
      {/* ── SIDEBAR ── */}
      <SessionNavBar />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        <SharedHeader 
          placeholder="SEARCH ALL INSTALLATION DATA..."
          showSearch={true}
          searchTerm={searchTerm}
          setSearchTerm={(val) => setSearchTerm(val)}
        />

        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 font-['DM_Sans'] select-none shadow-sm">
          {/* Title & Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 animate-pulse shrink-0">
              <Wrench className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight uppercase">Solar Installations</h2>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Track and manage site execution Data</p>
            </div>
          </div>

          {/* Controls Panel (Filters + Toggles + Add button) */}
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            
            {/* District Filter */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 gap-1.5 shadow-sm">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0">District:</span>
              <select 
                value={selectedDistrict} 
                onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedSchoolId(""); }}
                className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none pr-1 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none"
              >
                <option value="">ALL DISTRICTS</option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* School Filter */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 gap-1.5 shadow-sm max-w-[200px]">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0">School:</span>
              <select 
                value={selectedSchoolId} 
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none pr-1 cursor-pointer uppercase truncate font-['DM_Sans'] focus:ring-0 focus:outline-none max-w-[120px]"
              >
                <option value="">ALL SCHOOLS</option>
                {dropdownFilteredSchools.map(s => (
                  <option key={s.id} value={s.id}>{s.kgbv_name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 gap-1.5 shadow-sm">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0">Status:</span>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none pr-1 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none"
              >
                <option value="">ALL STATUSES</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Clear Button */}
            {(searchTerm || selectedDistrict || selectedSchoolId || selectedStatus) && (
              <button 
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Clear
              </button>
            )}

            <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block"></div>

            {/* View Mode Toggle (Grid vs Table) */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner">
              <button 
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === "grid" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Grid</span>
              </button>
              <button 
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === "table" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                title="Table View"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Table</span>
              </button>
            </div>

          </div>
        </div>

        {/* Scrollable Data/Content */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col justify-between gap-6 min-h-0">
          
          {loading ? (
            <div className="flex-1 overflow-y-auto min-h-0 animate-pulse pr-1">
              {viewMode === "grid" ? (
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
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-4">
                    <div className="w-1/4 h-4 bg-slate-200 rounded" />
                    <div className="w-1/4 h-4 bg-slate-200 rounded" />
                    <div className="w-1/4 h-4 bg-slate-200 rounded" />
                    <div className="w-1/4 h-4 bg-slate-200 rounded" />
                  </div>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="p-4 border-b border-slate-100 flex gap-4">
                      <div className="w-1/4 h-4 bg-slate-100 rounded" />
                      <div className="w-1/4 h-4 bg-slate-100 rounded" />
                      <div className="w-1/4 h-4 bg-slate-100 rounded" />
                      <div className="w-1/4 h-4 bg-slate-100 rounded" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : filteredInstallations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-16 flex flex-col items-center justify-center text-center gap-3 animate-fadeIn my-auto max-w-lg mx-auto w-full">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Wrench className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">No matching installations found</h3>
              <p className="text-xs text-slate-455 font-bold uppercase leading-relaxed">
                We couldn't find any installation records matching your current filter options.
              </p>
              <button 
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                Clear Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="flex-1 overflow-y-auto min-h-0 animate-fadeIn pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {paginatedInstallations.map((inst) => (
                  <div 
                    key={inst.id} 
                    onClick={() => router.push(`/installations/${inst.id}`)}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-250 cursor-pointer transition-all p-4 flex flex-col justify-between relative group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/10 via-emerald-500/55 to-emerald-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded">
                          {inst.installation_code}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeStyles(inst.overall_status)}`}>
                          {inst.overall_status}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {inst.schools?.kgbv_name || "UNKNOWN SCHOOL"} | {inst.schools?.no_of_systems ?? 0}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-350" /> {inst.schools?.district || "N/A"}{inst.schools?.pincode ? ` • ${inst.schools.pincode}` : ''}
                        </p>
                      </div>

                      {/* Progress representation */}
                      <div className="mt-1">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          <span>Overall Progress</span>
                          <span className="text-emerald-700">{inst.overall_percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-105 h-2 rounded-full overflow-hidden border border-slate-150">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${inst.overall_percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Micro components list */}
                      <div className="grid grid-cols-2 gap-2 mt-1 border-t border-slate-100 pt-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tank</span>
                          <span className="text-[9px] font-bold text-slate-700">{inst.tank_status}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">MMS</span>
                          <span className="text-[9px] font-bold text-slate-700">{inst.mms_status}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Collectors</span>
                          <span className="text-[9px] font-bold text-slate-700">{inst.collectors_status}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Plumbing</span>
                          <span className="text-[9px] font-bold text-slate-700">{inst.plumbing_status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-wider select-none">
                      <span>Started: {inst.started_at ? new Date(inst.started_at).toLocaleDateString() : "Pending"}</span>
                      <span>Completed: {inst.completed_at ? new Date(inst.completed_at).toLocaleDateString() : "Pending"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn w-full">
              <div className="flex-1 overflow-auto min-h-0 w-full">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none shadow-[0_1px_0_0_rgb(226,232,240)]">
                      <th className="px-6 py-4 whitespace-nowrap">Installation Code</th>
                      <th className="px-6 py-4 whitespace-nowrap">School Name</th>
                      <th className="px-6 py-4 whitespace-nowrap">District</th>
                      <th className="px-6 py-4 whitespace-nowrap">Progress</th>
                      <th className="px-6 py-4 whitespace-nowrap">Overall Status</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-650">
                    {paginatedInstallations.map((inst) => (
                      <tr 
                        key={inst.id}
                        onClick={() => router.push(`/installations/${inst.id}`)}
                        className="hover:bg-slate-50/40 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4.5 whitespace-nowrap font-black text-slate-800 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                          {inst.installation_code}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap font-extrabold text-slate-700 uppercase">
                          {inst.schools?.kgbv_name || "N/A"} | {inst.schools?.no_of_systems ?? 0}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap uppercase text-slate-500">
                          {inst.schools?.district || "N/A"}{inst.schools?.pincode ? ` • ${inst.schools.pincode}` : ''}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap min-w-[150px]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 shrink-0">
                              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" style={{ width: `${inst.overall_percentage}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-emerald-700">{inst.overall_percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeStyles(inst.overall_status)}`}>
                            {inst.overall_status}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right whitespace-nowrap text-[10px] font-black text-slate-400 uppercase">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-slate-500"><span className="text-slate-350">START:</span> {inst.started_at ? new Date(inst.started_at).toLocaleDateString() : "Pending"}</span>
                            <span><span className="text-slate-350">CLOSE:</span> {inst.completed_at ? new Date(inst.completed_at).toLocaleDateString() : "Pending"}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer / Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 flex items-center justify-between shrink-0 shadow-sm mt-auto select-none">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} installations
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest px-2.5">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL: SETUP NEW INSTALLATION RECORD ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-250 shadow-2xl flex flex-col animate-scaleUp overflow-hidden max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Wrench className="w-4.5 h-4.5 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Setup New Installation</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {/* Select School */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Select School *</label>
                <select
                  required
                  value={newSchoolId}
                  onChange={(e) => setNewSchoolId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all uppercase font-['DM_Sans']"
                >
                  <option value="">-- CHOOSE SCHOOL --</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.kgbv_name.toUpperCase()} ({s.district.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              {/* Select Material */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Select Material Record *</label>
                <select
                  required
                  value={newMaterialId}
                  onChange={(e) => setNewMaterialId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all uppercase font-['DM_Sans']"
                >
                  <option value="">-- CHOOSE MATERIAL --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.material_code.toUpperCase()} ({m.capacity || "CAPACITY UNKNOWN"})</option>
                  ))}
                </select>
              </div>

              {/* Installation Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Installation Code *</label>
                <input 
                  type="text"
                  required
                  value={newInstCode}
                  onChange={(e) => setNewInstCode(e.target.value)}
                  placeholder="E.G., INST-HYD-001"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all uppercase placeholder:text-slate-400"
                />
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Setting up...</> : "Setup Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
