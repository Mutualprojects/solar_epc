"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";
import { DM_Sans } from "next/font/google";
import {
  Users as UsersIcon, Search, ChevronLeft, ChevronRight, Loader2,
  MapPin, Check, X, Info, Phone, Briefcase, Shield, UserCheck, ShieldAlert,
  Plus, Edit2
} from "lucide-react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

interface Role {
  role_name: string;
}

interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  designation?: string;
  district?: string;
  profile_photo?: string;
  employee_id?: string;
  is_active: boolean;
  role_id: string;
  roles?: Role;
  created_at?: string;
}

const DISTRICTS = [
  "ANANTAPUR", "CHITTOOR", "EAST GODAVARI", "GUNTUR", "KADAPA", "KRISHNA",
  "KURNOOL", "NELLORE", "PRAKASAM", "SRIKAKULAM", "VISAKHAPATNAM",
  "VIZIANAGARAM", "WEST GODAVARI", "YSR KADAPA", "NTR", "KAKINADA", "ELURU",
  "PALNADU", "BAPATLA"
];

export default function UsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  // Modal controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [designation, setDesignation] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);
    
    const roleName = parsedUser.roles?.role_name || parsedUser.role;
    if (roleName === "Super Admin") {
      setIsSuperAdmin(true);
    }

    fetchUsers(token);
    fetchRoles();
  }, [router]);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.success) {
        setAvailableRoles(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  };

  const fetchUsers = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        setUsers(data.data || []);
      } else {
        showToast("error", data.error || "Failed to retrieve user accounts.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFullName("");
    setEmail("");
    setEmployeeId("");
    setPassword("");
    setRoleId("");
    setDesignation("");
    setDistrict("");
    setPhone("");
    setIsActive(true);
    setIsAddModalOpen(true);
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUserId(user.id);
    setFullName(user.full_name || "");
    setEmail(user.email || "");
    setEmployeeId(user.employee_id || "");
    setPassword(""); // Clear password field
    setRoleId(user.role_id || "");
    setDesignation(user.designation || "");
    setDistrict(user.district || "");
    setPhone(user.phone || "");
    setIsActive(user.is_active !== false);
    setIsEditModalOpen(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !roleId) {
      showToast("error", "Full Name, Email, and Role are required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const body: any = {
        full_name: fullName,
        email: email,
        role_id: roleId,
        employee_id: employeeId || null,
        designation: designation || null,
        district: district === "ANY/ALL" || !district ? null : district,
        phone: phone || null,
        is_active: isActive
      };
      if (password) {
        body.password = password;
      }

      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", "Successfully added new user account!");
        setIsAddModalOpen(false);
        if (token) fetchUsers(token);
      } else {
        showToast("error", data.error || "Failed to create user.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred.");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !roleId) {
      showToast("error", "Full Name, Email, and Role are required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const body: any = {
        id: editingUserId,
        full_name: fullName,
        email: email,
        role_id: roleId,
        employee_id: employeeId || null,
        designation: designation || null,
        district: district === "ANY/ALL" || !district ? null : district,
        phone: phone || null,
        is_active: isActive
      };
      if (password) {
        body.password = password;
      }

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", "Successfully updated user profile!");
        setIsEditModalOpen(false);
        if (token) fetchUsers(token);
      } else {
        showToast("error", data.error || "Failed to update user.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred.");
    }
  };

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedDistrict]);

  // Extract unique districts and roles for filters
  const districts = Array.from(
    new Set(users.map((u) => u.district?.toUpperCase().trim()).filter(Boolean))
  ) as string[];

  const roles = Array.from(
    new Set(users.map((u) => u.roles?.role_name).filter(Boolean))
  ) as string[];

  // Filtering logic
  const filteredUsers = users.filter((u) => {
    // 1. Role Filter
    const matchesRole = !selectedRole || u.roles?.role_name === selectedRole;

    // 2. District Filter
    const matchesDistrict =
      !selectedDistrict || u.district?.toUpperCase().trim() === selectedDistrict.toUpperCase().trim();

    // 3. Search Term
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      u.full_name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.employee_id?.toLowerCase().includes(search) ||
      u.designation?.toLowerCase().includes(search) ||
      u.phone?.includes(search);

    return matchesRole && matchesDistrict && matchesSearch;
  });

  // Pagination Logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRole("");
    setSelectedDistrict("");
  };

  // Role Badge Styling Helper
  const getRoleBadgeStyles = (roleName: string) => {
    switch (roleName?.toLowerCase()) {
      case "super admin":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "field engineer":
        return "bg-amber-50 text-amber-700 border-amber-250";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`h-screen w-full bg-[#f8fafc] flex overflow-hidden ${dmSans.className}`}>
      {/* ── SIDEBAR ── */}
      <SessionNavBar />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <SharedHeader
          placeholder="SEARCH USERS BY NAME, EMAIL, ID..."
          showSearch={true}
          searchTerm={searchTerm}
          setSearchTerm={(val) => setSearchTerm(val)}
        />

        {/* Dynamic Toast Notifications */}
        {toast && (
          <div className="absolute top-20 right-6 z-50 animate-bounce">
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-xl ${
              toast.type === "success"
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
              <UsersIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight uppercase leading-tight">Users Directory</h2>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Manage user access and details within the solar electrification system.</p>
            </div>
          </div>

          {/* Right: Filters & Count */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Role Filter */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm w-44 shrink-0">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-6 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none w-full truncate"
              >
                <option value="">ALL ROLES</option>
                {roles.map((r) => (
                  <option key={r} value={r}>{r.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm w-44 shrink-0">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-6 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none w-full truncate"
              >
                <option value="">ALL DISTRICTS</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedRole || selectedDistrict) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-xl text-xs font-bold transition-all flex items-center gap-1 uppercase tracking-wider shadow-sm shrink-0"
              >
                Clear
              </button>
            )}

            <div className="w-px h-5 bg-slate-200 hidden sm:block shrink-0"></div>

            {/* Total Badge */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg shadow-sm shrink-0 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {filteredUsers.length} Users
            </div>

            {isSuperAdmin && (
              <button
                onClick={openAddModal}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                Add User
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between gap-6 min-h-0">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
              <p className="text-xs font-black text-slate-455 uppercase tracking-widest">Retrieving user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-16 flex flex-col items-center justify-center text-center gap-3 animate-fadeIn my-auto max-w-lg mx-auto w-full">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-150">
                <UsersIcon className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">No matching users found</h3>
              <p className="text-xs text-slate-455 font-bold uppercase leading-relaxed">
                We couldn't find any user profiles that match your search query or filter options.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-black border-b border-slate-150 select-none">
                      <th className="py-3 px-6">User Account</th>
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">District</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-6 text-right">Status</th>
                      {isSuperAdmin && <th className="py-3 px-6 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-750 divide-y divide-slate-100">
                    {paginatedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3.5">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center font-bold text-slate-750 bg-slate-50 shrink-0 overflow-hidden uppercase select-none">
                              {u.profile_photo ? (
                                <img src={u.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                getInitials(u.full_name)
                              )}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 uppercase tracking-tight leading-tight">{u.full_name}</p>
                              <p className="text-[10px] font-semibold text-slate-400 lowercase mt-0.5">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[9px] font-black uppercase tracking-wider">
                            {u.employee_id || "NOT SET"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 border rounded-md text-[9px] font-black uppercase tracking-wider ${getRoleBadgeStyles(u.roles?.role_name || "")}`}>
                            {u.roles?.role_name || "MEMBER"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 uppercase font-extrabold">
                          {u.designation || "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {u.district ? (
                            <span className="inline-flex items-center gap-1 text-slate-600 uppercase">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {u.district.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-slate-400 uppercase">ALL</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-bold">
                          {u.phone || "N/A"}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <span className={`inline-flex px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase ${
                            u.is_active !== false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}>
                            {u.is_active !== false ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3 px-6 text-right whitespace-nowrap">
                            <button
                              onClick={() => openEditModal(u)}
                              className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-100 hover:border-emerald-600 px-2.5 py-1.2 rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-emerald-600 group-hover:text-white shrink-0" />
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-4 mt-6 gap-3 shrink-0 select-none">
              <div className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
                Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} Users
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl border border-slate-200 bg-white transition-all shadow-sm ${
                    currentPage === 1
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
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        currentPage === page
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
                  className={`p-2 rounded-xl border border-slate-200 bg-white transition-all shadow-sm ${
                    currentPage === totalPages
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
      {/* ── ADD USER MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity" onClick={() => setIsAddModalOpen(false)}></div>
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden z-10 animate-fadeIn select-none flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-800 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <UsersIcon className="w-5 h-5 text-emerald-250 animate-pulse shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wider font-['DM_Sans']">Create New User Account</h3>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleAddUser} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 font-['DM_Sans'] text-left">
              {/* Row 1: Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Employee ID and Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-101"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-1">Login Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty for 'Welcome123'"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Role and Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-1">System Role *</label>
                  <select
                    required
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">SELECT ROLE</option>
                    {availableRoles.map((r) => (
                      <option key={r.id} value={r.id}>{r.role_name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Field Engineer"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 4: District and Contact Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-1">Assigned District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">ALL DISTRICTS / STATE-WIDE</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 5: Status */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3.5 rounded-xl mt-2 select-none">
                <div>
                  <span className="text-xs font-black text-slate-700 uppercase block">Account Clearance Status</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Control whether user has active clearance</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(prev => !prev)}
                  className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-50 border-emerald-250 text-emerald-700 shadow-sm"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>

              {/* Form Footer Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  CREATE USER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity" onClick={() => setIsEditModalOpen(false)}></div>
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden z-10 animate-fadeIn select-none flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-800 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <UsersIcon className="w-5 h-5 text-emerald-250 animate-pulse shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wider font-['DM_Sans']">Edit User Profile</h3>
              </div>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleEditUser} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 font-['DM_Sans'] text-left">
              {/* Row 1: Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Employee ID and Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-101"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block mb-1">Login Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty to keep unchanged"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Role and Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block mb-1">System Role *</label>
                  <select
                    required
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">SELECT ROLE</option>
                    {availableRoles.map((r) => (
                      <option key={r.id} value={r.id}>{r.role_name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Field Engineer"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 4: District and Contact Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block mb-1">Assigned District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">ALL DISTRICTS / STATE-WIDE</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50/50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 5: Status */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3.5 rounded-xl mt-2 select-none">
                <div>
                  <span className="text-xs font-black text-slate-700 uppercase block">Account Clearance Status</span>
                  <span className="text-[10px] text-slate-455 font-bold uppercase mt-0.5">Control whether user has active clearance</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(prev => !prev)}
                  className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-50 border-emerald-250 text-emerald-700 shadow-sm"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>

              {/* Form Footer Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
