"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";
import { DM_Sans } from "next/font/google";
import { 
  User as UserIcon, Mail, Phone, Shield, Briefcase, MapPin, 
  Edit3, Save, X, Check, Loader2, Key, Info, HelpCircle,
  Camera, Upload, Eye, EyeOff, Calendar, UserCheck, ToggleLeft, ToggleRight, LogOut
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

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  employee_id: string;
  phone: string;
  designation: string;
  district: string;
  role_id: string;
  roles?: {
    role_name: string;
  };
  last_login?: string;
  created_at?: string;
  is_active: boolean;
  profile_photo?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Data States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Edit Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [district, setDistrict] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState("");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Validation & Error States
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Authentication & User Loading
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);
    fetchUserProfile(parsedUser.email);
  }, [router]);

  const fetchUserProfile = async (emailAddress: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users?email=${encodeURIComponent(emailAddress)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        const userObj: UserProfile = data.data[0];
        setProfile(userObj);
        
        // Populate edit form states
        setFullName(userObj.full_name || "");
        setEmail(userObj.email || "");
        setPhone(userObj.phone || "");
        setDesignation(userObj.designation || "");
        setDistrict(userObj.district || "");
        setEmployeeId(userObj.employee_id || "");
        setIsActive(userObj.is_active ?? true);
        setProfilePhoto(userObj.profile_photo || "");
      } else {
        showToast("error", data.error || "Failed to load user profile.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An unexpected error occurred loading profile.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Photo Upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Please select a valid image file.");
      return;
    }

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("files", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.urls && data.urls.length > 0) {
        const uploadedUrl = data.urls[0];
        setProfilePhoto(uploadedUrl);
        
        // Auto-save the photo directly in the backend to ensure a smoother experience
        const token = localStorage.getItem("token");
        const patchRes = await fetch("/api/users", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ profile_photo: uploadedUrl })
        });
        const patchData = await patchRes.json();

        if (patchData.success) {
          setProfile(patchData.data);
          
          // Update stored user object in localStorage
          const stored = localStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            const updatedUser = {
              ...parsed,
              profile_photo: uploadedUrl
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
          }
          showToast("success", "Profile picture updated successfully!");
        } else {
          showToast("error", "Failed to update profile details with uploaded image.");
        }
      } else {
        showToast("error", data.error || "Failed to upload image.");
      }
    } catch (err: any) {
      showToast("error", "Error uploading image: " + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 3. Submit / Save Logic
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Form Validations
    if (!fullName.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }

    // Email verification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    // Phone verification
    if (phone) {
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ""))) {
        setErrorMsg("Please enter a valid phone number (7-15 digits).");
        return;
      }
    }

    // Password validations
    if (password) {
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      const payload: any = {
        full_name: fullName,
        email: email,
        phone: phone,
        designation: designation,
        district: district,
        employee_id: employeeId,
        is_active: isActive,
        profile_photo: profilePhoto
      };

      if (password) {
        payload.password = password;
      }

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        showToast("success", "Profile updated successfully!");
        setProfile(data.data);
        
        // Update stored user object in localStorage
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const updatedUser = {
            ...parsed,
            full_name: data.data.full_name,
            email: data.data.email,
            phone: data.data.phone,
            designation: data.data.designation,
            district: data.data.district,
            profile_photo: data.data.profile_photo
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        }

        // Reset password fields
        setPassword("");
        setConfirmPassword("");
        setIsEditMode(false);
      } else {
        showToast("error", data.error || "Failed to update profile.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred while saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setDesignation(profile.designation || "");
      setDistrict(profile.district || "");
      setEmployeeId(profile.employee_id || "");
      setIsActive(profile.is_active ?? true);
      setProfilePhoto(profile.profile_photo || "");
    }
    setPassword("");
    setConfirmPassword("");
    setErrorMsg("");
    setIsEditMode(false);
  };

  return (
    <div className={`h-screen w-full bg-[#f8fafc] flex overflow-hidden ${dmSans.className}`}>
      {/* ── SIDEBAR ── */}
      <SessionNavBar />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative font-['DM_Sans']">
        
        <SharedHeader 
          showSearch={false}
        />

        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
              <UserIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Account Settings</h2>
              <p className="text-[10px] font-semibold text-slate-400">View and update your personal user profile information.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Enabled
            </div>
          </div>
        </div>

        {/* Toast Notification */}
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[#f8fafc]">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full py-24">
              <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
              <p className="text-xs font-black text-slate-455 uppercase tracking-widest animate-pulse">Retrieving Profile details...</p>
            </div>
          ) : profile ? (
            <div className="p-6 flex flex-col gap-5 animate-fadeIn">

              {/* ── PROFILE BANNER CARD ── */}
              <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Gradient Banner */}
                <div className="h-28 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 relative select-none">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                  {/* Decorative circles */}
                  <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/5"></div>
                  <div className="absolute -right-2 top-4 w-20 h-20 rounded-full bg-white/5"></div>
                  <div className="absolute right-5 bottom-3 text-[9px] font-black text-white/30 tracking-widest uppercase font-mono">Solar Electrification Network</div>
                </div>

                {/* Profile Info Row */}
                <div className="px-6 py-5 flex flex-col sm:flex-row items-center sm:items-center gap-5">
                  {/* Avatar */}
                  <div className="relative shrink-0 group/avatar -mt-14 sm:-mt-14">
                    <div className="w-20 h-20 rounded-2xl border-4 border-white flex items-center justify-center font-black text-emerald-700 bg-emerald-50 text-3xl shadow-lg uppercase overflow-hidden">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        fullName.charAt(0) || "U"
                      )}
                    </div>
                    <div
                      onClick={triggerFileInput}
                      className="absolute inset-0 bg-black/40 rounded-2xl border-4 border-white opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer duration-200"
                      title="Upload New Profile Picture"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-white mb-0.5" />
                          <span className="text-[8px] font-bold text-white uppercase">Upload</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                  </div>

                  {/* Name + Details */}
                  <div className="flex-1 flex flex-col gap-2 text-center sm:text-left sm:pt-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">{fullName || "USER"}</h3>
                      <span className={`inline-flex px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {isActive ? "● Active" : "● Inactive"}
                      </span>
                      <span className="inline-flex px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-wider">
                        {profile.roles?.role_name || "MEMBER"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {designation || profile.designation || "Designation not set"}
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1 text-[10px] font-bold text-slate-400 uppercase">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-350 shrink-0" />
                        Created {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                      </span>
                      {email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-350 shrink-0" />
                          {email}
                        </span>
                      )}
                      {phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-350 shrink-0" />
                          {phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Employee ID badge */}
                  {employeeId && (
                    <div className="shrink-0 flex flex-col items-center sm:items-end gap-1 select-none">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee ID</span>
                      <span className="text-sm font-black text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg tracking-wider uppercase">{employeeId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── PERSONAL & ORGANIZATIONAL DETAILS CARD ── */}
              <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 shrink-0 rounded-t-2xl">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Personal & Organizational Details</h4>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Manage and review your organization and contact properties.</p>
                  </div>
                  {!isEditMode && (
                    <button 
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>

                {/* Card Body */}
                <form onSubmit={handleSave} className="flex flex-col">
                  <div className="p-6 flex flex-col gap-5">
                    {isEditMode && errorMsg && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold uppercase flex items-center gap-2">
                        <X className="w-4 h-4 text-red-500 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Full Name */}
                      <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                        <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Full Name *</span>
                          {isEditMode ? (
                            <input 
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-700 outline-none transition-all uppercase mt-1 focus:ring-2 focus:ring-emerald-500/10"
                              placeholder="FULL NAME"
                              required
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-slate-800 uppercase mt-1 truncate">{fullName || "NOT SET"}</span>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                        <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Email Address *</span>
                          {isEditMode ? (
                            <input 
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-700 outline-none transition-all mt-1 focus:ring-2 focus:ring-emerald-500/10"
                              placeholder="email@example.com"
                              required
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-slate-700 mt-1 truncate">{email || "NOT SET"}</span>
                          )}
                        </div>
                      </div>

                      {/* Employee ID */}
                      <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                        <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Employee ID</span>
                          {isEditMode ? (
                            <input 
                              type="text"
                              value={employeeId}
                              onChange={(e) => setEmployeeId(e.target.value)}
                              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-700 outline-none transition-all uppercase mt-1 focus:ring-2 focus:ring-emerald-500/10"
                              placeholder="EMP-ID"
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-slate-700 uppercase mt-1 truncate">{employeeId || "NOT SET"}</span>
                          )}
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                        <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Mobile Number</span>
                          {isEditMode ? (
                            <input 
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-700 outline-none transition-all mt-1 focus:ring-2 focus:ring-emerald-500/10"
                              placeholder="+91 00000 00000"
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-slate-700 mt-1 truncate">{phone || "NOT SET"}</span>
                          )}
                        </div>
                      </div>

                      {/* Designation */}
                      <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                        <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Designation</span>
                          {isEditMode ? (
                            <input 
                              type="text"
                              value={designation}
                              onChange={(e) => setDesignation(e.target.value)}
                              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-700 outline-none transition-all uppercase mt-1 focus:ring-2 focus:ring-emerald-500/10"
                              placeholder="DESIGNATION"
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-slate-800 uppercase mt-1 truncate">{designation || "NOT SET"}</span>
                          )}
                        </div>
                      </div>

                      {/* District */}
                      <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                        <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">District</span>
                          {isEditMode ? (
                            <input 
                              type="text"
                              value={district}
                              onChange={(e) => setDistrict(e.target.value)}
                              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-700 outline-none transition-all uppercase mt-1 focus:ring-2 focus:ring-emerald-500/10"
                              placeholder="DISTRICT"
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-slate-800 uppercase mt-1 truncate">{district || "NOT SET"}</span>
                          )}
                        </div>
                      </div>

                      {/* System Access — Full row */}
                      <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl md:col-span-2">
                        <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">System Access & Status</span>
                            <span className="text-xs font-extrabold text-emerald-700 uppercase mt-1">
                              {profile.roles?.role_name || "MEMBER"} — {isActive ? "FULLY ACTIVE" : "SUSPENDED"}
                            </span>
                          </div>
                          {isEditMode && (
                            <button 
                              type="button" 
                              onClick={() => setIsActive(!isActive)}
                              className="text-emerald-600 hover:text-emerald-700 transition-colors focus:outline-none cursor-pointer shrink-0"
                              title="Toggle Account Status"
                            >
                              {isActive ? (
                                <ToggleRight className="w-9 h-9" />
                              ) : (
                                <ToggleLeft className="w-9 h-9 text-slate-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Password Section — Edit Mode only */}
                    {isEditMode && (
                      <div className="border-t border-slate-100 pt-5 flex flex-col gap-4">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Update Password <span className="text-slate-400 font-bold normal-case tracking-normal text-[10px]">(optional)</span>
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5 relative">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">New Password</label>
                            <input 
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all pr-10"
                              placeholder="••••••••"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 bottom-2.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Confirm Password</label>
                            <input 
                              type={showPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── STICKY ACTION FOOTER (Edit Mode) ── */}
                  {isEditMode && (
                    <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
                      <button 
                        type="button"
                        onClick={handleCancel}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {saving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="w-4 h-4" /> Update</>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 h-full text-center py-24">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              <p className="text-xs font-bold text-slate-455 uppercase">Profile was not resolved correctly.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
