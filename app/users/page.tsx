"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, UserPlus, Search, Edit2, Trash2, ShieldCheck,
  Mail, Phone, MapPin, Briefcase, CheckCircle2, AlertCircle, X,
  MoreVertical, Shield, Loader2
} from "lucide-react";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";

type Role = {
  id: string;
  role_name: string;
  is_active: boolean;
};

type User = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  designation: string;
  employee_id: string;
  district: string;
  is_active: boolean;
  role_id: string;
  roles?: { role_name: string };
  created_at: string;
};

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    designation: "",
    employee_id: "",
    district: "",
    password: "",
    role_id: "",
    is_active: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/users", { headers }),
        fetch("/api/roles", { headers })
      ]);

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();

      if (usersData.success) {
        setUsers(usersData.data);
      }
      if (rolesData.success) {
        setRoles(rolesData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (user: User | null = null) => {
    setFormError("");
    if (user) {
      setEditingUser(user);
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        designation: user.designation || "",
        employee_id: user.employee_id || "",
        district: user.district || "",
        password: "", // Leave blank for edit unless changing
        role_id: user.role_id || "",
        is_active: user.is_active,
      });
    } else {
      setEditingUser(null);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        designation: "",
        employee_id: "",
        district: "",
        password: "",
        role_id: roles[0]?.id || "",
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const token = localStorage.getItem("token");
      const url = "/api/users";
      const method = editingUser ? "PATCH" : "POST";

      const payload: any = { ...formData };
      if (editingUser) {
        payload.id = editingUser.id;
        if (!payload.password) delete payload.password; // Don't update if blank
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save user");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete user");
      } else {
        fetchData();
      }
    } catch (error: any) {
      alert("Error deleting user: " + error.message);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-['DM_Sans'] select-none">
      <SessionNavBar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <SharedHeader
          showSearch={false}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc] flex flex-col gap-6 lg:gap-8">

          {/* Header Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-emerald-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 tracking-tight">System Personnel</h1>
                <p className="text-sm font-semibold text-slate-500">{users.length} Total Registered Users</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full sm:w-64 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Create New User
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Personnel</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Contact</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Role & Org</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                          <span className="text-sm font-semibold">Loading Personnel...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-semibold">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
                              <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                                <Briefcase className="w-3.5 h-3.5" />
                                {user.employee_id || 'EXT-USER'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {user.email}
                            </p>
                            <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {user.phone || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                              <Shield className="w-3.5 h-3.5" />
                              {user.roles?.role_name || 'Unknown Role'}
                            </span>
                            <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {user.district || 'All Districts'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Suspended
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between text-sm font-semibold text-slate-500">
              <p>Showing {filteredUsers.length} of {users.length} users</p>
            </div>
          </div>
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-emerald-600 shrink-0">
                  {editingUser ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800">{editingUser ? 'Edit Personnel' : 'Create New Personnel'}</h3>
                  <p className="text-sm font-medium text-slate-500 hidden sm:block">{editingUser ? 'Update user credentials and assignments' : 'Add a new member to the system'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-semibold">{formError}</p>
                </div>
              )}

              <form id="user-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Basic Info */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Full Name *</label>
                      <input
                        required
                        type="text"
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Email Address *</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 h-px bg-slate-100 my-2"></div>

                {/* Organization Details */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Organization & Access
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">System Role *</label>
                      <select
                        required
                        value={formData.role_id}
                        onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-800 bg-white"
                      >
                        <option value="" disabled>Select a role</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.role_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">District Assignment</label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                        placeholder="e.g. Guntur or All"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Employee ID</label>
                      <input
                        type="text"
                        value={formData.employee_id}
                        onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                        placeholder="EMP-1234"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Job Title / Designation</label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                        placeholder="e.g. Field Engineer"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 h-px bg-slate-100 my-2"></div>

                {/* Security */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Password {editingUser && '(Leave blank to keep unchanged)'}</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                        placeholder="••••••••"
                        minLength={6}
                      />
                    </div>
                    <div className="flex items-center pt-7">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : ''}`}></div>
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.is_active}
                          onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                          Account is Active
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="user-form"
                disabled={formLoading}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {editingUser ? 'Update User' : 'Create User'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
