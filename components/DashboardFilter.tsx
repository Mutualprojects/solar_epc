"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin, ChevronLeft, ChevronRight, Loader2, Info } from "lucide-react";

interface School {
  id?: string;
  kgbv_name?: string;
  school_id?: string;
  district?: string;
  pincode?: string;
  pin_code?: string;
  no_of_systems?: number;
}

interface InstallationRecord {
  id: string;
  school_id: string;
  overall_status: string;
  tank_status: string;
  mms_status: string;
  collectors_status: string;
  plumbing_status: string;
  schools?: School;
  kgbv_name?: string;
  district?: string;
}

interface DashboardFilterProps {
  installations: InstallationRecord[];
  dataLoading: boolean;
}

export default function DashboardFilter({ installations = [], dataLoading = false }: DashboardFilterProps) {
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Increased to 50 records per page as requested

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDistrict, selectedStatus]);

  // Extract unique districts
  const districts = Array.from(
    new Set(
      installations
        .map((inst) => {
          const d = inst.schools?.district || inst.district;
          return d ? d.toUpperCase().trim() : "";
        })
        .filter(Boolean)
    )
  ).sort() as string[];

  // Filter installations
  const filteredInstallations = installations.filter((inst) => {
    // 1. Search Query
    const search = searchTerm.toLowerCase();
    const schoolName = (inst.schools?.kgbv_name || inst.kgbv_name || "").toLowerCase();
    const schoolId = (inst.schools?.school_id || inst.school_id || "").toLowerCase();
    const districtText = (inst.schools?.district || inst.district || "").toLowerCase();
    const matchesSearch =
      !searchTerm ||
      schoolName.includes(search) ||
      schoolId.includes(search) ||
      districtText.includes(search);

    // 2. District Filter
    const instDistrict = (inst.schools?.district || inst.district || "").toUpperCase().trim();
    const matchesDistrict = !selectedDistrict || instDistrict === selectedDistrict.toUpperCase().trim();

    // 3. Status Filter
    const matchesStatus =
      selectedStatus === "All" ||
      inst.overall_status?.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  // Pagination Logic
  const totalItems = filteredInstallations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredInstallations.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDistrict("");
    setSelectedStatus("All");
  };

  // Render T, M, C, P Indicators
  const renderMilestoneStatus = (inst: InstallationRecord) => {
    const milestones = [
      { label: "T", status: inst.tank_status, title: "Tank System" },
      { label: "M", status: inst.mms_status, title: "MMS Structure" },
      { label: "C", status: inst.collectors_status, title: "Collectors Array" },
      { label: "P", status: inst.plumbing_status, title: "Plumbing Loop" },
    ];

    return (
      <div className="flex gap-1 items-center select-none">
        {milestones.map((ms) => {
          const isCompleted = ms.status?.toLowerCase() === "completed";
          return (
            <span
              key={ms.label}
              title={`${ms.title}: ${ms.status || "Pending"}`}
              className={`w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center border transition-all ${isCompleted
                ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
            >
              {ms.label}
            </span>
          );
        })}
      </div>
    );
  };

  // Status Badge Helper
  const getOverallStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-150";
      case "in progress":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-3xl p-7 border border-slate-200/70 shadow-sm flex flex-col gap-6 select-none font-['DM_Sans']">

      {/* ── TOOLBAR / CONTROLS ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none mb-1">
            Installation Pipeline Ledger
          </h3>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            live school
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar inside the component */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm max-w-xs w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH SCHOOLS..."
              className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 placeholder:uppercase focus:ring-0 focus:outline-none w-full"
            />
          </div>

          {/* District Filter Dropdown */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm w-40 shrink-0">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-6 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none w-full truncate"
            >
              <option value="">ALL DISTRICTS</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm w-40 shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-6 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none w-full truncate"
            >
              <option value="All">ALL STATUSES</option>
              <option value="Completed">COMPLETED</option>
              <option value="In Progress">IN PROGRESS</option>
              <option value="Pending">PENDING</option>
            </select>
          </div>

          {/* Clear Button */}
          {(searchTerm || selectedDistrict || selectedStatus !== "All") && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-xl text-xs font-bold transition-all uppercase tracking-wider shadow-sm shrink-0"
            >
              Clear
            </button>
          )}

          <div className="w-px h-5 bg-slate-200 hidden sm:block shrink-0"></div>

          {/* Total Badge */}
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg shadow-sm shrink-0 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {filteredInstallations.length} schools
          </div>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {dataLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Syncing timeline matrix...
          </p>
        </div>
      ) : filteredInstallations.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-150 shadow-sm">
            <Info className="w-5 h-5 text-slate-450" />
          </div>
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            No matching installations
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed max-w-sm">
            Modify search query or dropdown criteria to match active solar components records.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-black border-b border-slate-150 select-none">
                  <th className="py-3.5 px-4 pl-6">District</th>
                  <th className="py-3.5 px-4">School Name</th>
                  <th className="py-3.5 px-4">Systems</th>
                  <th className="py-3.5 px-4">Installation Status</th>
                  <th className="py-3.5 px-4 pr-6 text-right">Execution Status</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                {paginatedData.map((inst) => {
                  const schoolName = inst.schools?.kgbv_name || inst.kgbv_name || "Unknown School";
                  const districtText = inst.schools?.district || inst.district || "N/A";
                  const systemsCount = inst.schools?.no_of_systems || 0;
                  const pincodeVal = inst.schools?.pincode || inst.schools?.pin_code;

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 pl-6">
                        <span className="text-slate-600 uppercase font-extrabold flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {districtText.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-slate-800 uppercase">
                            {schoolName.toUpperCase()}
                          </span>
                          {pincodeVal && (
                            <span className="text-[10px] font-black text-slate-400/80 tracking-wide">
                              {pincodeVal}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-black uppercase tracking-wider">
                          {systemsCount}
                        </span>
                      </td>
                      <td className="py-3 px-4">{renderMilestoneStatus(inst)}</td>
                      <td className="py-3 px-4 pr-6 text-right">
                        <span
                          className={`inline-flex px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wide ${getOverallStatusBadge(
                            inst.overall_status
                          )}`}
                        >
                          {inst.overall_status?.toUpperCase() || "PENDING"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PAGINATION CONTROLS ── */}
      {!dataLoading && filteredInstallations.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-4 mt-1 gap-3 shrink-0 select-none">
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
  );
}
