"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Plus,
  FileText,
  Truck,
  Box,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Hash,
  MapPin,
  Phone,
  User,
  X,
  Check,
  Edit3,
  UploadCloud,
  Image as ImageIcon
} from "lucide-react";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────
type ActiveTab = "warehouses" | "inward" | "outward";

interface WarehouseItem {
  id: string;
  created_at: string;
  warehouse_name: string;
  location: string;
  phone_number: string;
  address?: string;
  contact_person?: string;
  is_active: boolean;
}

interface StockEntry {
  id: string;
  created_at: string;
  warehouse_id: string;
  invoice_id: string;
  vendor_name: string;
  remarks: string;
  inward_images?: any;
  warehouseName?: string;
}

// ─── Mock Data Fallbacks ──────────────────────────────────────────────────────

// Status badges helper configurations
const statusConfig: Record<string, { color: string; dot: string }> = {
  Received:   { color: "bg-emerald-50 text-emerald-700 border border-emerald-200",  dot: "bg-emerald-500" },
  Dispatched: { color: "bg-emerald-50 text-emerald-700 border border-emerald-200",  dot: "bg-emerald-500" },
  Pending:    { color: "bg-amber-50 text-amber-700 border border-amber-200",        dot: "bg-amber-400 animate-pulse" },
  "In Transit":{ color: "bg-blue-50 text-blue-700 border border-blue-200",          dot: "bg-blue-500 animate-pulse" },
  Rejected:   { color: "bg-rose-50 text-rose-700 border border-rose-200",          dot: "bg-rose-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig["Pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function categoryBadge(cat: string) {
  const map: Record<string, string> = {
    Solar:    "bg-amber-50 text-amber-700 border-amber-200",
    Tank:     "bg-cyan-50 text-cyan-700 border-cyan-200",
    MMS:      "bg-violet-50 text-violet-700 border-violet-200",
    Plumbing: "bg-teal-50 text-teal-700 border-teal-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border ${map[cat] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>
      {cat}
    </span>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function WarehousePage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("warehouses");
  const [search, setSearch] = useState("");
  
  // Real DB state
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [inwardEntries, setInwardEntries] = useState<StockEntry[]>([]);
  const [outwardEntries, setOutwardEntries] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Modals state
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [isAddInwardOpen, setIsAddInwardOpen] = useState(false);
  const [isAddOutwardOpen, setIsAddOutwardOpen] = useState(false);

  // Modal modes: 'add' or 'edit'
  const [warehouseModalMode, setWarehouseModalMode] = useState<"add" | "edit">("add");
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [inwardModalMode, setInwardModalMode] = useState<"add" | "edit">("add");
  const [editingInwardId, setEditingInwardId] = useState<string | null>(null);
  const [outwardModalMode, setOutwardModalMode] = useState<"add" | "edit">("add");
  const [editingOutwardId, setEditingOutwardId] = useState<string | null>(null);

  // Success alert/toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Add Warehouse Form state
  const [whForm, setWhForm] = useState({
    warehouse_name: "",
    location: "",
    phone_number: "",
    is_active: true
  });

  // Add Inward Form state
  const [inwardForm, setInwardForm] = useState({
    warehouse_id: "",
    invoice_id: "",
    vendor_name: "",
    remarks: ""
  });

  // Add Outward Form state
  const [outwardForm, setOutwardForm] = useState({
    school_code: "",
    warehouse_id: "",
    tank: "",
    mms: "",
    collectors: "",
    plumbing: "",
    dc_number: "",
    driver_name: "",
    driver_phone: "",
    vehicle_number: "",
    remarks: ""
  });
  const [outwardImages, setOutwardImages] = useState<string[]>([]);
  const [inwardImages, setInwardImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(0);

  useEffect(() => {
    (window as any).showLightbox = (images: string[]) => {
      setLightboxImages(images);
      setActiveLightboxIndex(0);
    };
    return () => {
      delete (window as any).showLightbox;
    };
  }, []);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) { router.push("/login"); return; }
    try {
      const parsed = JSON.parse(storedUser);
      const role = parsed.roles?.role_name || parsed.role;
      if (role !== "Super Admin") { router.push("/login"); return; }
    } catch { router.push("/login"); return; }
    setAuthLoading(false);
  }, [router]);

  // Fetch real data
  const fetchData = async () => {
    try {
      setDbLoading(true);
      const whRes = await fetch("/api/warehouses");
      const whJson = await whRes.json();
      if (whJson.success) {
        setWarehouses(whJson.data || []);
      }

      const inRes = await fetch("/api/material-inward");
      const inJson = await inRes.json();
      if (inJson.success) {
        const transformed: StockEntry[] = (inJson.data || []).map((row: any) => ({
          id: row.id,
          created_at: row.created_at,
          warehouse_id: row.warehouse_id,
          invoice_id: row.invoice_id,
          vendor_name: row.vendor_name || "Unknown Vendor",
          remarks: row.remarks || "",
          inward_images: row.inward_images || [],
          warehouseName: row.warehouses?.warehouse_name || "N/A"
        }));
        
        setInwardEntries(transformed);
      } else {
        setInwardEntries([]);
      }

      const outRes = await fetch("/api/materials");
      const outJson = await outRes.json();
      if (outJson.success) {
        const transformed = (outJson.data || []).map((row: any) => ({
          id: row.id,
          created_at: row.created_at,
          school_code: row.school_code,
          schoolName: row.schools?.kgbv_name || "Unknown School",
          district: row.schools?.district || "",
          tank: row.tank || 0,
          mms: row.mms || 0,
          collectors: row.collectors || 0,
          plumbing: row.plumbing || 0,
          warehouse_id: row.warehouse_id || "",
          warehouseName: row.warehouses?.warehouse_name || "N/A",
          dc_number: row.dc_number || "",
          driver_name: row.driver_name || "",
          driver_phone: row.driver_phone || "",
          vehicle_number: row.vehicle_number || "",
          outward_images: row.outward_images || [],
          remarks: row.remarks || ""
        }));
        setOutwardEntries(transformed);
      } else {
        setOutwardEntries([]);
      }

      const scRes = await fetch("/api/schools");
      const scJson = await scRes.json();
      if (scJson.success) {
        setSchools(scJson.data || []);
      }
    } catch (err) {
      console.error("Error loading warehouse database:", err);
      setInwardEntries([]);
      setOutwardEntries([]);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  // Handlers
  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whForm.warehouse_name || !whForm.location) {
      setFormError("Warehouse Name and Location/City are required");
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError("");
      
      const isEdit = warehouseModalMode === "edit";
      const url = "/api/warehouses";
      const method = isEdit ? "PATCH" : "POST";
      const payload = isEdit ? { ...whForm, id: editingWarehouseId } : whForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsAddWarehouseOpen(false);
        setWhForm({
          warehouse_name: "",
          location: "",
          phone_number: "",
          is_active: true
        });
        setToast({ 
          message: isEdit ? "Warehouse updated successfully!" : "Warehouse added successfully!", 
          type: "success" 
        });
        fetchData();
      } else {
        setFormError(data.error || `Failed to ${isEdit ? "update" : "create"} warehouse`);
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSaveInward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardForm.warehouse_id || !inwardForm.invoice_id) {
      setFormError("Warehouse Destination and Invoice ID are required");
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError("");
      
      const isEdit = inwardModalMode === "edit";
      const url = "/api/material-inward";
      const method = isEdit ? "PATCH" : "POST";
      const payload = {
        ...inwardForm,
        inward_images: inwardImages,
        ...(isEdit ? { id: editingInwardId } : {})
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsAddInwardOpen(false);
        setInwardForm({
          warehouse_id: "",
          invoice_id: "",
          vendor_name: "",
          remarks: ""
        });
        setInwardImages([]);
        setToast({ 
          message: isEdit ? "Inward stock entry updated successfully!" : "Inward stock entry added successfully!", 
          type: "success" 
        });
        fetchData();
      } else {
        setFormError(data.error || `Failed to ${isEdit ? "update" : "add"} inward stock entry`);
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadProgress(10);
      try {
        const files = Array.from(e.target.files);
        const uploadedUrls: string[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp'
          };
          
          const compressedBlob = await imageCompression(file, options);
          const newFileName = file.name.replace(/\.[^/.]+$/, ".webp");
          const compressedFile = new File([compressedBlob], newFileName, { type: 'image/webp' });

          const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const filePath = `outward/${uniqueSuffix}-${compressedFile.name}`;

          const { data, error } = await supabase.storage
            .from('solar_modules')
            .upload(filePath, compressedFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('solar_modules')
            .getPublicUrl(data.path);

          uploadedUrls.push(urlData.publicUrl);
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        }

        setOutwardImages(prev => [...prev, ...uploadedUrls]);
        setToast({ message: "Images uploaded successfully!", type: "success" });
      } catch (err: any) {
        console.error("Image upload error:", err);
        setToast({ message: err.message || "Failed to upload images.", type: "error" });
      } finally {
        setUploadProgress(null);
      }
    }
  };

  const removeOutwardImage = (index: number) => {
    setOutwardImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleInwardFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadProgress(10);
      try {
        const files = Array.from(e.target.files);
        const uploadedUrls: string[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Validate file type
          if (!file.type.startsWith('image/')) {
            throw new Error(`File "${file.name}" is not a valid image file.`);
          }

          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp'
          };
          
          const compressedBlob = await imageCompression(file, options);
          const newFileName = file.name.replace(/\.[^/.]+$/, ".webp");
          const compressedFile = new File([compressedBlob], newFileName, { type: 'image/webp' });

          const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const filePath = `inward/${uniqueSuffix}-${compressedFile.name}`;

          let usedBucket = 'solar_module';
          let uploadResult = await supabase.storage
            .from(usedBucket)
            .upload(filePath, compressedFile, {
              cacheControl: '3600',
              upsert: false
            });

          // Graceful fallback to 'solar_modules' if 'solar_module' fails
          if (uploadResult.error) {
            console.warn("Upload to 'solar_module' bucket failed, attempting fallback to 'solar_modules'...", uploadResult.error.message);
            usedBucket = 'solar_modules';
            uploadResult = await supabase.storage
              .from(usedBucket)
              .upload(filePath, compressedFile, {
                cacheControl: '3600',
                upsert: false
              });
          }

          if (uploadResult.error) {
            throw new Error(`Upload failed for "${file.name}": ${uploadResult.error.message}`);
          }

          const { data: urlData } = supabase.storage
            .from(usedBucket)
            .getPublicUrl(uploadResult.data.path);

          uploadedUrls.push(urlData.publicUrl);
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        }

        setInwardImages(prev => [...prev, ...uploadedUrls]);
        setToast({ message: "Images uploaded successfully!", type: "success" });
      } catch (err: any) {
        console.error("Image upload error:", err);
        setToast({ message: err.message || "Failed to upload images.", type: "error" });
      } finally {
        setUploadProgress(null);
      }
    }
  };

  const removeInwardImage = (index: number) => {
    setInwardImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveOutward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outwardForm.school_code) {
      setFormError("Destination School is required");
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError("");

      const isEdit = outwardModalMode === "edit";
      const url = "/api/materials";
      const method = isEdit ? "PATCH" : "POST";
      
      const payload = {
        school_code: outwardForm.school_code,
        warehouse_id: outwardForm.warehouse_id || null,
        tank: outwardForm.tank ? parseFloat(outwardForm.tank) : 0,
        mms: outwardForm.mms ? parseFloat(outwardForm.mms) : 0,
        collectors: outwardForm.collectors ? parseFloat(outwardForm.collectors) : 0,
        plumbing: outwardForm.plumbing ? parseFloat(outwardForm.plumbing) : 0,
        dc_number: outwardForm.dc_number || null,
        driver_name: outwardForm.driver_name || null,
        driver_phone: outwardForm.driver_phone || null,
        vehicle_number: outwardForm.vehicle_number || null,
        remarks: outwardForm.remarks || null,
        outward_images: outwardImages,
        ...(isEdit ? { id: editingOutwardId } : {})
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        setIsAddOutwardOpen(false);
        setOutwardForm({
          school_code: "",
          warehouse_id: "",
          tank: "",
          mms: "",
          collectors: "",
          plumbing: "",
          dc_number: "",
          driver_name: "",
          driver_phone: "",
          vehicle_number: "",
          remarks: ""
        });
        setOutwardImages([]);
        setToast({ 
          message: isEdit ? "Outward dispatch updated successfully!" : "Outward dispatch created successfully!", 
          type: "success" 
        });
        fetchData();
      } else {
        setFormError(data.error || `Failed to ${isEdit ? "update" : "create"} outward record.`);
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Searching & Filtering
  const filteredInward = inwardEntries.filter(r =>
    !search || 
    r.invoice_id.toLowerCase().includes(search.toLowerCase()) ||
    r.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
    r.remarks.toLowerCase().includes(search.toLowerCase()) ||
    (r.warehouseName && r.warehouseName.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredOutward = outwardEntries.filter(entry => 
    !search ||
    entry.schoolName.toLowerCase().includes(search.toLowerCase()) ||
    entry.district.toLowerCase().includes(search.toLowerCase()) ||
    entry.dc_number.toLowerCase().includes(search.toLowerCase()) ||
    entry.driver_name.toLowerCase().includes(search.toLowerCase()) ||
    entry.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
    (entry.warehouseName && entry.warehouseName.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredWarehouses = warehouses.filter(w =>
    !search || w.warehouse_name.toLowerCase().includes(search.toLowerCase()) ||
    w.location.toLowerCase().includes(search.toLowerCase())
  );

  // KPI Summaries
  const totalInwardReceipts = inwardEntries.length;
  const totalOutwardUnits = outwardEntries.length;
  const totalWarehouses = warehouses.length;
  const activeWarehouses = warehouses.filter(w => w.is_active).length;

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="font-bold text-slate-500 animate-pulse font-['DM_Sans']">Loading Warehouse...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex font-['DM_Sans'] overflow-hidden">
      {/* Sidebar Navigation */}
      <SessionNavBar />

      {/* Main Command Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <SharedHeader
          placeholder="Search warehouse logs, locations, or items..."
          showSearch={true}
          searchTerm={search}
          setSearchTerm={setSearch}
        />

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-[#f8fafc]">

          {/* Page Dynamic Title Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none mb-0.5">Warehouse</h1>
                <p className="text-xs font-semibold text-slate-400">Material tracking, inward logs &amp; centers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setWhForm({
                    warehouse_name: "",
                    location: "",
                    phone_number: "",
                    is_active: true
                  });
                  setWarehouseModalMode("add");
                  setEditingWarehouseId(null);
                  setIsAddWarehouseOpen(true);
                }}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                Add Warehouse
              </button>
              <button 
                onClick={() => {
                  setInwardForm({
                    warehouse_id: "",
                    invoice_id: "",
                    vendor_name: "",
                    remarks: ""
                  });
                  setInwardImages([]);
                  setInwardModalMode("add");
                  setEditingInwardId(null);
                  setIsAddInwardOpen(true);
                }}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl shadow-sm shadow-emerald-500/30 transition-all hover:shadow-md cursor-pointer font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New Inward
              </button>
              <button 
                onClick={() => {
                  setOutwardForm({
                    school_code: "",
                    warehouse_id: "",
                    tank: "",
                    mms: "",
                    collectors: "",
                    plumbing: "",
                    dc_number: "",
                    driver_name: "",
                    driver_phone: "",
                    vehicle_number: "",
                    remarks: ""
                  });
                  setOutwardImages([]);
                  setOutwardModalMode("add");
                  setEditingOutwardId(null);
                  setIsAddOutwardOpen(true);
                }}
                className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-3.5 py-2 rounded-xl shadow-sm shadow-indigo-500/30 transition-all hover:shadow-md cursor-pointer font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New Outward
              </button>
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
            {[
              {
                label: "Total Inward",
                value: totalInwardReceipts.toLocaleString(),
                sub: `${inwardEntries.length} stock receipts`,
                icon: <ArrowDownToLine className="w-4 h-4" />,
                accent: "border-l-emerald-500",
                iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600",
                subColor: "text-emerald-600",
              },
              {
                label: "Total Outward",
                value: totalOutwardUnits.toLocaleString(),
                sub: `${outwardEntries.length} dispatches`,
                icon: <ArrowUpFromLine className="w-4 h-4" />,
                accent: "border-l-indigo-500",
                iconBg: "bg-indigo-50 border-indigo-100 text-indigo-600",
                subColor: "text-indigo-600",
              },
              {
                label: "Total Warehouses",
                value: totalWarehouses,
                sub: `Registered hubs`,
                icon: <Warehouse className="w-4 h-4" />,
                accent: "border-l-amber-500",
                iconBg: "bg-amber-50 border-amber-100 text-amber-600",
                subColor: "text-amber-600",
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`bg-white rounded-xl p-3 px-4 border-l-4 ${card.accent} border border-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{card.label}</p>
                  <div className={`w-6.5 h-6.5 rounded-lg border flex items-center justify-center shrink-0 ${card.iconBg}`}>
                    {card.icon}
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{card.value}</h3>
                <p className={`text-[9px] font-bold flex items-center gap-1 border-t border-slate-100 pt-1 ${card.subColor}`}>
                  <TrendingUp className="w-2.5 h-2.5" />{card.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-col gap-0 shrink-0">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
              {([
                { key: "warehouses", label: "Warehouse Data", icon: <Warehouse className="w-4 h-4" /> },
                { key: "inward",     label: "Inward Data",    icon: <ArrowDownToLine className="w-4 h-4" /> },
                { key: "outward",    label: "Outward Data",   icon: <ArrowUpFromLine className="w-4 h-4" /> },
              ] as { key: ActiveTab; label: string; icon: React.ReactElement }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
          </div>



          {/* ── INWARD TAB ── */}
          {activeTab === "inward" && (
            <WarehouseTable
              data={filteredInward}
              type="inward"
              emptyLabel="No Inwards"
              onEdit={(entry) => {
                setInwardForm({
                  warehouse_id: entry.warehouse_id || "",
                  invoice_id: entry.invoice_id || "",
                  vendor_name: entry.vendor_name || "",
                  remarks: entry.remarks || ""
                });
                setInwardImages(Array.isArray(entry.inward_images) ? entry.inward_images : []);
                setInwardModalMode("edit");
                setEditingInwardId(entry.id);
                setIsAddInwardOpen(true);
              }}
            />
          )}

          {/* ── OUTWARD TAB ── */}
          {activeTab === "outward" && (
            <WarehouseTable
              data={filteredOutward}
              type="outward"
              emptyLabel="No Outwards"
              onEdit={(entry) => {
                setOutwardForm({
                  school_code: entry.school_code || "",
                  warehouse_id: entry.warehouse_id || "",
                  tank: entry.tank !== undefined && entry.tank !== null ? entry.tank.toString() : "",
                  mms: entry.mms !== undefined && entry.mms !== null ? entry.mms.toString() : "",
                  collectors: entry.collectors !== undefined && entry.collectors !== null ? entry.collectors.toString() : "",
                  plumbing: entry.plumbing !== undefined && entry.plumbing !== null ? entry.plumbing.toString() : "",
                  dc_number: entry.dc_number || "",
                  driver_name: entry.driver_name || "",
                  driver_phone: entry.driver_phone || "",
                  vehicle_number: entry.vehicle_number || "",
                  remarks: entry.remarks || ""
                });
                setOutwardImages(Array.isArray(entry.outward_images) ? entry.outward_images : []);
                setOutwardModalMode("edit");
                setEditingOutwardId(entry.id);
                setIsAddOutwardOpen(true);
              }}
            />
          )}

          {/* ── WAREHOUSE DATA TAB ── */}
          {activeTab === "warehouses" && (
            <div className="flex flex-col gap-4">
              {dbLoading ? (
                <div className="bg-white rounded-2xl border border-slate-200/70 p-12 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Syncing Warehouses...</span>
                </div>
              ) : filteredWarehouses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center flex flex-col items-center justify-center gap-3">
                  <Warehouse className="w-10 h-10 text-slate-300" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Warehouses Registered</p>
                  <button 
                    onClick={() => {
                      setWhForm({
                        warehouse_name: "",
                        location: "",
                        phone_number: "",
                        is_active: true
                      });
                      setWarehouseModalMode("add");
                      setEditingWarehouseId(null);
                      setIsAddWarehouseOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First Warehouse
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWarehouses.map((wh) => (
                    <div 
                      key={wh.id} 
                      className="bg-white rounded-2xl border border-slate-200/70 p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between">
                          <h3 className="font-extrabold text-slate-800 text-[14px] leading-snug">{wh.warehouse_name}</h3>
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${wh.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {wh.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex items-start gap-1 text-[11px] text-slate-500 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100 font-medium mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{wh.location || "No location address specified."}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          {wh.phone_number ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{wh.phone_number}</span>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-[10px] font-medium">No contact</div>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setWhForm({
                                  warehouse_name: wh.warehouse_name,
                                  location: wh.location,
                                  phone_number: wh.phone_number || "",
                                  is_active: wh.is_active
                                });
                                setWarehouseModalMode("edit");
                                setEditingWarehouseId(wh.id);
                                setIsAddWarehouseOpen(true);
                              }}
                              className="flex items-center gap-1 text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/50 px-1.5 py-0.5 rounded-md cursor-pointer transition-colors"
                            >
                              <Edit3 className="w-2.5 h-2.5" /> Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ── ADD WAREHOUSE MODAL ── */}
      {isAddWarehouseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-slate-800 text-base">{warehouseModalMode === "edit" ? "Edit Warehouse Details" : "Add New Warehouse"}</h3>
              </div>
              <button 
                onClick={() => { setIsAddWarehouseOpen(false); setFormError(""); }}
                className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 font-bold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Warehouse Name*</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Hyderabad Central Hub"
                    value={whForm.warehouse_name}
                    onChange={(e) => setWhForm({...whForm, warehouse_name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Location / City*</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Hyderabad"
                    value={whForm.location}
                    onChange={(e) => setWhForm({...whForm, location: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="tel"
                  placeholder="e.g. +91 98765 43210 or 10-digit number"
                  value={whForm.phone_number}
                  onChange={(e) => setWhForm({...whForm, phone_number: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-700">Active Status</span>
                  <span className="text-[10px] font-semibold text-slate-400">Controls warehouse dispatch permissions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWhForm({...whForm, is_active: !whForm.is_active})}
                  className={`w-11 h-6 rounded-full transition-all duration-300 p-0.5 focus:outline-none flex items-center cursor-pointer ${whForm.is_active ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => { setIsAddWarehouseOpen(false); setFormError(""); }}
                  className="bg-slate-100 hover:bg-slate-200/80 text-slate-600 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {warehouseModalMode === "edit" ? "Save Changes" : "Save Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD INWARD DATA MODAL ── */}
      {isAddInwardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-slate-800 text-base">
                  {inwardModalMode === "edit" ? "Edit Inward Record" : "New Inward Material Receipt"}
                </h3>
              </div>
              <button 
                onClick={() => { setIsAddInwardOpen(false); setFormError(""); }}
                className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInward} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 font-bold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Warehouse Destination*</label>
                <select
                  required
                  value={inwardForm.warehouse_id}
                  onChange={(e) => setInwardForm({...inwardForm, warehouse_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Target Warehouse --</option>
                  {warehouses.filter(w => w.is_active).map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.warehouse_name} ({wh.location})</option>
                  ))}
                </select>
                {warehouses.filter(w => w.is_active).length === 0 && (
                  <p className="text-[9px] font-bold text-amber-500">No active warehouses registered! Please add a warehouse first.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Invoice ID / Bill Ref*</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. INV-1024-A"
                    value={inwardForm.invoice_id}
                    onChange={(e) => setInwardForm({...inwardForm, invoice_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Supplier / Vendor Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. SunTech Ltd"
                    value={inwardForm.vendor_name}
                    onChange={(e) => setInwardForm({...inwardForm, vendor_name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Remarks / Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Write any checking comments or remarks..."
                  value={inwardForm.remarks}
                  onChange={(e) => setInwardForm({...inwardForm, remarks: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Image Upload for inward_images */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inward Verification Images</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 transition-all bg-slate-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer relative group">
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={handleInwardFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <p className="text-xs font-bold text-slate-500 text-center">Click or Drag &amp; Drop Inward Receipt Photos</p>
                  <p className="text-[9px] font-semibold text-slate-400">Supports PNG, JPG, WEBP (Max 10MB per file)</p>
                </div>

                {uploadProgress !== null && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 animate-pulse" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}

                {/* Uploaded Images Preview */}
                {inwardImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {inwardImages.map((url, index) => (
                      <div key={index} className="relative rounded-xl border border-slate-200 overflow-hidden aspect-video group">
                        <img 
                          src={url} 
                          alt={`Upload Preview ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => removeInwardImage(index)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => { setIsAddInwardOpen(false); setFormError(""); }}
                  className="bg-slate-100 hover:bg-slate-200/80 text-slate-600 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {inwardModalMode === "edit" ? "Save Changes" : "Save Inward Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT OUTWARD DATA MODAL ── */}
      {isAddOutwardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-slate-800 text-base">
                  {outwardModalMode === "edit" ? "Edit Outward Record" : "New Outward Material Dispatch"}
                </h3>
              </div>
              <button 
                onClick={() => { setIsAddOutwardOpen(false); setFormError(""); }}
                className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOutward} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
              {formError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 font-bold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Destination School & Warehouse Source */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Destination School*</label>
                  <select
                    required
                    value={outwardForm.school_code}
                    onChange={(e) => setOutwardForm({...outwardForm, school_code: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">-- Select Target School --</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>{school.kgbv_name.toUpperCase()} ({school.school_id})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Source Warehouse</label>
                  <select
                    value={outwardForm.warehouse_id}
                    onChange={(e) => setOutwardForm({...outwardForm, warehouse_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">-- Select Dispatch Warehouse (Optional) --</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.warehouse_name} ({wh.location})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Material Qty Dispatched (Tank, MMS, Collectors, Plumbing) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 flex flex-col gap-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Material Quantity Dispatched</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Tank</label>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Qty"
                      value={outwardForm.tank}
                      onChange={(e) => setOutwardForm({...outwardForm, tank: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">MMS Structure</label>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Qty"
                      value={outwardForm.mms}
                      onChange={(e) => setOutwardForm({...outwardForm, mms: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Collectors</label>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Qty"
                      value={outwardForm.collectors}
                      onChange={(e) => setOutwardForm({...outwardForm, collectors: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Plumbing Units</label>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Qty"
                      value={outwardForm.plumbing}
                      onChange={(e) => setOutwardForm({...outwardForm, plumbing: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Logistics & Dispatch Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">DC Number (Delivery Challan)</label>
                  <input 
                    type="text"
                    placeholder="e.g. DC-77891"
                    value={outwardForm.dc_number}
                    onChange={(e) => setOutwardForm({...outwardForm, dc_number: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Vehicle Number</label>
                  <input 
                    type="text"
                    placeholder="e.g. TS-09-EA-1234"
                    value={outwardForm.vehicle_number}
                    onChange={(e) => setOutwardForm({...outwardForm, vehicle_number: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Driver Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={outwardForm.driver_name}
                    onChange={(e) => setOutwardForm({...outwardForm, driver_name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Driver Phone Number</label>
                  <input 
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={outwardForm.driver_phone}
                    onChange={(e) => setOutwardForm({...outwardForm, driver_phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Image Upload for outward_images */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Outward Verification Images</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 transition-all bg-slate-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer relative group">
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <p className="text-xs font-bold text-slate-500 text-center">Click or Drag &amp; Drop Outward Dispatch Photos</p>
                  <p className="text-[9px] font-semibold text-slate-400">Supports PNG, JPG, WEBP (Max 10MB per file)</p>
                </div>

                {uploadProgress !== null && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300 animate-pulse" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}

                {/* Uploaded Images Preview */}
                {outwardImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {outwardImages.map((url, index) => (
                      <div key={index} className="relative rounded-xl border border-slate-200 overflow-hidden aspect-video group">
                        <img 
                          src={url} 
                          alt={`Upload Preview ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => removeOutwardImage(index)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Remarks / Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Write any dispatch notes or remarks..."
                  value={outwardForm.remarks}
                  onChange={(e) => setOutwardForm({...outwardForm, remarks: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => { setIsAddOutwardOpen(false); setFormError(""); }}
                  className="bg-slate-100 hover:bg-slate-200/80 text-slate-600 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {outwardModalMode === "edit" ? "Save Changes" : "Save Outward Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX GALLERY MODAL ── */}
      {lightboxImages && lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 transition-all">
          <button 
            onClick={() => setLightboxImages(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10 shadow-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="max-w-4xl w-full flex flex-col items-center gap-4 relative">
            <div className="relative aspect-video max-h-[70vh] w-full border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-black">
              <img 
                src={lightboxImages[activeLightboxIndex]} 
                alt={`Lightbox Image ${activeLightboxIndex + 1}`}
                className="object-contain w-full h-full"
              />
            </div>

            {lightboxImages.length > 1 && (
              <div className="flex items-center gap-2 mt-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                {lightboxImages.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveLightboxIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${activeLightboxIndex === idx ? "bg-indigo-400 scale-125 shadow-md shadow-indigo-500/50" : "bg-white/30 hover:bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 animate-bounce flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl border font-bold text-xs transition-all duration-300 ${
          toast.type === "success" 
            ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/25" 
            : "bg-rose-500 border-rose-400 text-white shadow-rose-500/25"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}

// ─── Shared Table Component ───────────────────────────────────────────────────
function WarehouseTable({
  data,
  type,
  emptyLabel,
  onEdit,
}: {
  data: any[];
  type: "inward" | "outward";
  emptyLabel: string;
  onEdit?: (entry: any) => void;
}) {
  const accentColor = type === "inward" ? "text-emerald-600" : "text-indigo-600";
  const Icon = type === "inward" ? ArrowDownToLine : ArrowUpFromLine;

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, type]);

  const totalPages = Math.ceil(data.length / recordsPerPage) || 1;
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden shrink-0 flex flex-col">
      {/* Table Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${type === "inward" ? "bg-emerald-50 border border-emerald-100" : "bg-indigo-50 border border-indigo-100"}`}>
            <Icon className={`w-4 h-4 ${accentColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {type === "inward" ? "Inward Stock Entries" : "Outward Dispatch Entries"}
            </h3>
            <p className="text-[10px] font-semibold text-slate-400">{data.length} records</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer font-bold text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{emptyLabel}</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {type === "inward" ? (
                  ["Inward ID", "Invoice ID", "Vendor / Supplier", "Destination", "Date Received", "Images", "Remarks", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))
                ) : (
                  ["Destination School", "Warehouse", "DC Number", "Driver & Vehicle", "Dispatched Qty", "Images", "Remarks", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((row, i) => {
                if (type === "inward") {
                  const displayDate = row.created_at 
                    ? new Date(row.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) 
                    : "N/A";
                  const images = Array.isArray(row.inward_images) ? row.inward_images : [];
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 font-mono">
                          <Hash className="w-3 h-3 text-slate-300" />
                          {row.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-black text-slate-700 font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                          {row.invoice_id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[12px] font-bold text-slate-600 whitespace-nowrap">{row.vendor_name}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                          {row.warehouseName || "Main Center"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-semibold text-slate-500 whitespace-nowrap flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          {displayDate}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {images.length > 0 ? (
                          <button 
                            onClick={() => {
                              if (window && (window as any).showLightbox) {
                                (window as any).showLightbox(images);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition-all shadow-sm cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3 text-emerald-600 group-hover:text-white" />
                            {images.length}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold font-['DM_Sans']">No images</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[11px] font-semibold text-slate-400 max-w-[180px] truncate" title={row.remarks || ""}>
                          {row.remarks || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/85 border border-emerald-200/50 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                } else {
                  const displayDate = row.created_at 
                    ? new Date(row.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) 
                    : "N/A";
                  const images = Array.isArray(row.outward_images) ? row.outward_images : [];
                  
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800 text-[12px] uppercase leading-tight">{row.schoolName || "—"}</span>
                          {row.district && (
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">{row.district}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                          {row.warehouseName || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-black text-slate-700 font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                          {row.dc_number || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-slate-600">{row.driver_name || "—"}</span>
                          {(row.driver_phone || row.vehicle_number) && (
                            <span className="text-[10px] font-medium text-slate-400 font-mono">
                              {[row.driver_phone, row.vehicle_number].filter(Boolean).join(" | ")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 rounded text-[10px] font-extrabold">
                            Tank: {row.tank !== undefined && row.tank !== null ? Math.round(row.tank) : "—"}
                          </span>
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-extrabold">
                            MMS: {row.mms !== undefined && row.mms !== null ? Math.round(row.mms) : "—"}
                          </span>
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-extrabold">
                            Coll: {row.collectors !== undefined && row.collectors !== null ? Math.round(row.collectors) : "—"}
                          </span>
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[10px] font-extrabold">
                            Plumb: {row.plumbing !== undefined && row.plumbing !== null ? Math.round(row.plumbing) : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {images.length > 0 ? (
                          <button 
                            onClick={() => {
                              if (window && (window as any).showLightbox) {
                                (window as any).showLightbox(images);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            <ImageIcon className="w-3 h-3 text-emerald-600 group-hover:text-white" />
                            {images.length}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold font-['DM_Sans']">No images</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[11px] font-semibold text-slate-400 max-w-[150px] truncate" title={row.remarks || ""}>
                          {row.remarks || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/85 border border-emerald-200/50 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Pagination Controls */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {startIndex + 1} - {Math.min(endIndex, data.length)} of {data.length} records
          </p>
          <span className="text-[9px] font-bold text-slate-300">Warehouse Module v1.0 • 50 records per page</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all cursor-pointer"
            >
              Prev
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isSelected = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    isSelected
                      ? type === "inward"
                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                        : "bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
