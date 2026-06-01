"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import { 
  Package, Search, Plus, UploadCloud, CheckCircle, AlertTriangle, 
  Trash2, Image as ImageIcon, FileSpreadsheet, Eye, X, 
  ChevronLeft, ChevronRight, Loader2, ArrowRight, Check, SlidersHorizontal, Info,
  User as UserIcon, LogOut
} from "lucide-react";
import Image from "next/image";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface School {
  id: string;
  school_id: string;
  kgbv_name: string;
  district: string;
  pin_code?: string;
}

interface MaterialRecord {
  id: string;
  created_at: string;
  school_code: string;
  tank: number;
  mms: number;
  collectors: number;
  plumbing: number;
  schools?: School;
  material_images?: {
    material_images: string[];
  }[];
  warehouse_id?: string | null;
  dc_number?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  vehicle_number?: string | null;
  outward_images?: string[] | null;
  remarks?: string | null;
  warehouses?: {
    id: string;
    warehouse_name: string;
    location: string;
  } | null;
}

interface CSVRow {
  rowNum: number;
  school_id: string;
  tank: string;
  mms: string;
  collectors: string;
  plumbing: string;
  isValid: boolean;
  error?: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"list" | "entry" | "bulk">("list");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Data States
  const [schools, setSchools] = useState<School[]>([]);
  const [materials, setMaterials] = useState<MaterialRecord[]>([]);

  // Toast / Messages
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search, Filters & Pagination for List Tab
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Entry Form States
  const [selectedFormDistrict, setSelectedFormDistrict] = useState("");
  const [formSchoolSearch, setFormSchoolSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [formTank, setFormTank] = useState("");
  const [formMms, setFormMms] = useState("");
  const [formCollectors, setFormCollectors] = useState("");
  const [formPlumbing, setFormPlumbing] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Lightbox Gallery
  const [lightboxImages, setLightboxImages] = useState<any[] | null>(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(0);

  // Active Warehouses State
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Edit Modal & Form States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaterialRecord | null>(null);
  const [editWarehouseId, setEditWarehouseId] = useState("");
  const [editTank, setEditTank] = useState("");
  const [editMms, setEditMms] = useState("");
  const [editCollectors, setEditCollectors] = useState("");
  const [editPlumbing, setEditPlumbing] = useState("");
  const [editDcNumber, setEditDcNumber] = useState("");
  const [editDriverName, setEditDriverName] = useState("");
  const [editDriverPhone, setEditDriverPhone] = useState("");
  const [editVehicleNumber, setEditVehicleNumber] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editOutwardImages, setEditOutwardImages] = useState<string[]>([]);
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editUploadProgress, setEditUploadProgress] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Bulk Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkRows, setBulkRows] = useState<CSVRow[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [bulkResult, setBulkResult] = useState<{
    insertedCount: number;
    failedCount: number;
    failures: any[];
  } | null>(null);

  // Auto-clear toast helper
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // 1. Initial Auth & Data Fetching
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    fetchInitialData();
  }, [router]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch schools, materials, and warehouses in parallel
      const [schoolsRes, materialsRes, warehousesRes] = await Promise.all([
        fetch("/api/schools"),
        fetch("/api/materials"),
        fetch("/api/warehouses")
      ]);

      const schoolsData = await schoolsRes.json();
      const materialsData = await materialsRes.json();
      const warehousesData = await warehousesRes.json();

      if (schoolsData.success) {
        setSchools(schoolsData.data || []);
        // Extract unique districts for filtering
        const uniqueDistricts: string[] = Array.from(
          new Set((schoolsData.data || []).map((s: School) => s.district).filter(Boolean))
        );
        setDistricts(uniqueDistricts);
      }

      if (materialsData.success) {
        setMaterials(materialsData.data || []);
      }

      if (warehousesData.success) {
        setWarehouses(warehousesData.data || []);
      }
    } catch (err: any) {
      showToast("error", "Failed to fetch inventory data.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Materials Entry Form Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const uniqueNewFiles = filesArray.filter(
        (newFile) =>
          !selectedFiles.some(
            (existing) =>
              existing.name === newFile.name && existing.size === newFile.size
          )
      );

      if (uniqueNewFiles.length < filesArray.length) {
        showToast("error", "Duplicate files were ignored.");
      }

      if (uniqueNewFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...uniqueNewFiles]);
        setFileDescriptions((prev) => [...prev, ...uniqueNewFiles.map(() => "")]);
      }
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileDescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileDescription = (index: number, desc: string) => {
    setFileDescriptions((prev) => {
      const copy = [...prev];
      copy[index] = desc;
      return copy;
    });
  };

  /**
   * Compresses an image and uploads it to the Supabase solar_modules bucket.
   */
  const uploadAndCompressImage = async (file: File, schoolId: string): Promise<string> => {
    // 1. Compression Settings (Max 1MB, Max Width/Height 1920px)
    const options = {
      maxSizeMB: 1, // Compress file to be under 1 Megabyte
      maxWidthOrHeight: 1920, // Downscale ultra-high-res photos
      useWebWorker: true,
      fileType: 'image/webp' // Converts to WebP for massive size reduction while keeping quality
    };

    // 2. Compress the Image
    const compressedBlob = await imageCompression(file, options);
    
    // Convert Blob back to File
    const newFileName = file.name.replace(/\.[^/.]+$/, ".webp"); // change extension to .webp
    const compressedFile = new File([compressedBlob], newFileName, {
      type: 'image/webp',
    });

    // 3. Generate a unique, safe filename to prevent overwriting
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const filePath = `materials/${schoolId}/${uniqueSuffix}-${compressedFile.name}`;

    // 4. Upload to Supabase 'solar_modules' bucket
    const { data, error } = await supabase.storage
      .from('solar_modules')
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // 5. Retrieve the highly-optimized Public URL
    const { data: urlData } = supabase.storage
      .from('solar_modules')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) {
      showToast("error", "Please select a valid school.");
      return;
    }

    setFormLoading(true);
    setUploadProgress(10); // Start progress indication

    try {
      let finalImages: { image: string; description: string }[] = [];

      // A. Upload files in parallel with browser-image-compression if selected
      if (selectedFiles.length > 0) {
        setUploadProgress(30);

        const uploadPromises = selectedFiles.map(async (file, idx) => {
          const publicUrl = await uploadAndCompressImage(file, selectedSchool.school_id || selectedSchool.id);
          
          const customDesc = fileDescriptions[idx]?.trim();
          const cleanName = file.name.replace(/\.[^/.]+$/, "");
          const defaultDesc = `Site verification photo of ${cleanName}`;
          const description = customDesc || defaultDesc;

          return {
            image: publicUrl,
            description
          };
        });

        finalImages = await Promise.all(uploadPromises);
        setUploadProgress(70);
      }

      // B. Save Material Entry
      const materialPayload = {
        school_code: selectedSchool.id,
        tank: formTank ? parseFloat(formTank) : 0,
        mms: formMms ? parseFloat(formMms) : 0,
        collectors: formCollectors ? parseFloat(formCollectors) : 0,
        plumbing: formPlumbing ? parseFloat(formPlumbing) : 0,
        material_images: finalImages,
      };

      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialPayload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save materials entry.");
      }

      setUploadProgress(100);
      showToast("success", "Successfully added material entry!");

      // C. Reset Form
      setSelectedSchool(null);
      setSelectedFormDistrict("");
      setFormSchoolSearch("");
      setFormTank("");
      setFormMms("");
      setFormCollectors("");
      setFormPlumbing("");
      setSelectedFiles([]);
      setFileDescriptions([]);
      setUploadProgress(null);
      
      // Refresh list
      fetchInitialData();
      setActiveTab("list");
    } catch (err: any) {
      showToast("error", err.message || "An unexpected error occurred during image upload/save.");
      setUploadProgress(null);
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Material/Outward Form Handlers
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setEditFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeEditFile = (idx: number) => {
    setEditFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const removeUploadedImage = (url: string) => {
    setEditOutwardImages(prev => prev.filter(item => item !== url));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setEditLoading(true);
    setEditUploadProgress(10);
    try {
      let uploadedUrls: string[] = [...editOutwardImages];

      // Compress and upload new outward proof images if selected
      if (editFiles.length > 0) {
        setEditUploadProgress(30);
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/webp'
        };

        const uploadPromises = editFiles.map(async (file) => {
          // Compress
          const compressedBlob = await imageCompression(file, options);
          const newFileName = file.name.replace(/\.[^/.]+$/, ".webp");
          const compressedFile = new File([compressedBlob], newFileName, {
            type: 'image/webp',
          });
          const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const filePath = `outward/${uniqueSuffix}-${compressedFile.name}`;

          // Upload to solar_modules bucket
          const { error: uploadError } = await supabase.storage
            .from("solar_modules")
            .upload(filePath, compressedFile, {
              cacheControl: "3600",
              upsert: true,
            });

          if (uploadError) throw uploadError;

          // Get Public URL
          const { data: { publicUrl } } = supabase.storage
            .from("solar_modules")
            .getPublicUrl(filePath);

          return publicUrl;
        });

        const newUrls = await Promise.all(uploadPromises);
        uploadedUrls = [...uploadedUrls, ...newUrls];
        setEditUploadProgress(70);
      }

      // Payload matching PATCH /api/materials endpoint
      const payload = {
        id: editingRecord.id,
        school_code: editingRecord.school_code,
        warehouse_id: editWarehouseId || null,
        dc_number: editDcNumber || null,
        driver_name: editDriverName || null,
        driver_phone: editDriverPhone || null,
        vehicle_number: editVehicleNumber || null,
        tank: editTank ? parseFloat(editTank) : 0,
        mms: editMms ? parseFloat(editMms) : 0,
        collectors: editCollectors ? parseFloat(editCollectors) : 0,
        plumbing: editPlumbing ? parseFloat(editPlumbing) : 0,
        remarks: editRemarks || null,
        outward_images: uploadedUrls
      };

      const res = await fetch("/api/materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || "Failed to update record.");
      }

      setEditUploadProgress(100);
      showToast("success", "Successfully updated inventory record!");
      setIsEditOpen(false);
      setEditFiles([]);
      fetchInitialData();
    } catch (err: any) {
      showToast("error", err.message || "An unexpected error occurred during edit.");
    } finally {
      setEditLoading(false);
      setEditUploadProgress(null);
    }
  };

  // 3. Bulk Upload CSV Parsing and Handlers
  const handleCSVDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCSVDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseCSVFile(e.target.files[0]);
    }
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const parsedRows: CSVRow[] = [];
      const schoolIdsInDb = new Set(schools.map(s => s.school_id.toLowerCase().trim()));
      const schoolNamesInDb = new Set(schools.map(s => s.kgbv_name.toLowerCase().trim()));

      // Assume CSV has header: school_id, tank, mms, collectors, plumbing
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(",").map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (columns.length < 5) continue;

        const school_id = columns[0];
        const tank = columns[1];
        const mms = columns[2];
        const collectors = columns[3];
        const plumbing = columns[4];

        let error = "";
        let isValid = true;

        if (!school_id) {
          error = "Missing School ID or Name";
          isValid = false;
        } else if (
          !schoolIdsInDb.has(school_id.toLowerCase()) && 
          !schoolNamesInDb.has(school_id.toLowerCase())
        ) {
          error = `School with ID or name "${school_id}" not found in database`;
          isValid = false;
        } else if (
          isNaN(Number(tank)) || 
          isNaN(Number(mms)) || 
          isNaN(Number(collectors)) || 
          isNaN(Number(plumbing))
        ) {
          error = "Material count fields must be numeric";
          isValid = false;
        }

        parsedRows.push({
          rowNum: i,
          school_id,
          tank,
          mms,
          collectors,
          plumbing,
          isValid,
          error
        });
      }

      setBulkRows(parsedRows);
      setBulkResult(null);
      showToast("success", `Parsed ${parsedRows.length} rows successfully.`);
    };
    reader.readAsText(file);
  };

  // Load sample data for demonstration
  const loadDemoBulkData = () => {
    if (schools.length < 2) {
      showToast("error", "Not enough school records to create demo data.");
      return;
    }

    const demo: CSVRow[] = [
      {
        rowNum: 1,
        school_id: schools[0]?.school_id || "1",
        tank: "11",
        mms: "12",
        collectors: "8",
        plumbing: "5",
        isValid: true
      },
      {
        rowNum: 2,
        school_id: schools[1]?.school_id || "2",
        tank: "15",
        mms: "9",
        collectors: "16",
        plumbing: "10",
        isValid: true
      },
      {
        rowNum: 3,
        school_id: "999999",
        tank: "8",
        mms: "5",
        collectors: "4",
        plumbing: "2.5",
        isValid: false,
        error: "School with ID or name \"999999\" not found in database"
      }
    ];

    setBulkRows(demo);
    setBulkResult(null);
    showToast("success", "Loaded demo inventory import data.");
  };

  const handleBulkUploadSubmit = async () => {
    if (bulkRows.length === 0) {
      showToast("error", "No rows available to upload.");
      return;
    }

    setBulkLoading(true);
    setBulkProgress(20);

    try {
      const payload = bulkRows.map(r => ({
        school_id: r.school_id,
        tank: r.tank,
        mms: r.mms,
        collectors: r.collectors,
        plumbing: r.plumbing
      }));

      setBulkProgress(60);

      const res = await fetch("/api/materials/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setBulkProgress(100);

      if (data.success) {
        setBulkResult({
          insertedCount: data.insertedCount,
          failedCount: data.failedCount,
          failures: data.failures
        });

        if (data.insertedCount > 0) {
          showToast("success", `Successfully imported ${data.insertedCount} records!`);
        } else {
          showToast("error", "No records were imported (all skipped).");
        }
        fetchInitialData();
      } else {
        throw new Error(data.error || "Bulk import failed.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An unexpected error occurred during bulk import.");
    } finally {
      setBulkLoading(false);
      setBulkProgress(null);
    }
  };

  // 4. Filters & Pagination Logic
  const filteredMaterials = materials.filter((m) => {
    const schoolName = m.schools?.kgbv_name || "";
    const schoolId = m.schools?.school_id || "";
    const matchesSearch = 
      schoolName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      schoolId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDistrict = selectedDistrict === "" || 
      (m.schools?.district || "").toLowerCase() === selectedDistrict.toLowerCase();

    const matchesSchool = selectedSchoolFilter === "" || 
      m.schools?.id === selectedSchoolFilter;

    return matchesSearch && matchesDistrict && matchesSchool;
  });

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDistrict, selectedSchoolFilter]);

  // Reset school filter on district change to maintain alignment
  useEffect(() => {
    setSelectedSchoolFilter("");
  }, [selectedDistrict]);

  // Form Filtered Schools list for combobox
  const formFilteredSchools = schools.filter(s => {
    // 1. Matches selected district in the form (if any is selected)
    const matchesDistrict = !selectedFormDistrict || s.district === selectedFormDistrict;

    // 2. Matches search query
    const name = s.kgbv_name.toLowerCase();
    const sid = s.school_id.toLowerCase();
    const search = formSchoolSearch.toLowerCase();
    const matchesSearch = name.includes(search) || sid.includes(search);

    // 3. Show only schools without existing inventory entries
    const noExistingInventory = !materials.some(m => m.school_code === s.id);

    return matchesDistrict && matchesSearch && noExistingInventory;
  });

  // KPIs & Chart Data
  const getDispatchStats = () => {
    let fullyDispatched = 0;
    let partialDispatched = 0;
    let pending = 0;

    schools.forEach(school => {
      const mat = materials.find(m => m.school_code === school.id);
      if (!mat) {
        pending++;
        return;
      }

      // Heuristic: check if materials are dispatched
      const hasTank = mat.tank && mat.tank > 0;
      const hasMms = mat.mms && mat.mms > 0;
      const hasColl = mat.collectors && mat.collectors > 0;
      const hasPlumb = mat.plumbing && mat.plumbing > 0;

      if (hasTank && hasMms && hasColl && hasPlumb) {
        fullyDispatched++;
      } else if (hasTank || hasMms || hasColl || hasPlumb) {
        partialDispatched++;
      } else {
        pending++;
      }
    });

    return [
      { name: "Fully Dispatched", value: fullyDispatched, color: "#10b981" }, // emerald-500
      { name: "Partial Dispatched", value: partialDispatched, color: "#f59e0b" }, // amber-500
      { name: "Pending Materials", value: pending, color: "#f43f5e" } // rose-500
    ];
  };

  const dispatchStats = getDispatchStats();

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex font-['DM_Sans'] overflow-hidden">
      {/* ── SIDEBAR ── */}
      <SessionNavBar />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <SharedHeader 
          placeholder="SEARCH SCHOOL NAME OR ID..."
          showSearch={activeTab === "list"}
          searchTerm={searchTerm}
          setSearchTerm={(val) => setSearchTerm(val)}
        />

        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-6 shrink-0 overflow-x-auto scrollbar-none">
          {/* Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0">
              <Package className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight uppercase leading-tight">Inventory Hub</h2>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Track and manage site solar installation materials.</p>
            </div>
          </div>

          {/* Right: Tabs + Filter + Count */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Tab Toggle */}
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner shrink-0">
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  activeTab === "list"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Inventory List</span>
                <span className="sm:hidden">List</span>
              </button>
              <button
                onClick={() => setActiveTab("entry")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  activeTab === "entry"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Entry</span>
                <span className="sm:hidden">New</span>
              </button>
              <button
                onClick={() => setActiveTab("bulk")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  activeTab === "bulk"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bulk Import</span>
                <span className="sm:hidden">Bulk</span>
              </button>
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block shrink-0"></div>

            {/* District & School Filter — only on list tab */}
            {activeTab === "list" && (
              <>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 gap-1.5 shadow-sm w-44 shrink-0">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0">District:</span>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none pr-6 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none w-full truncate"
                  >
                    <option value="">ALL DISTRICTS</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 gap-1.5 shadow-sm w-60 shrink-0">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0">School Name:</span>
                  <select
                    value={selectedSchoolFilter}
                    onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                    className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none pr-6 cursor-pointer uppercase font-['DM_Sans'] focus:ring-0 focus:outline-none w-full truncate"
                  >
                    <option value="">ALL SCHOOLS</option>
                    {schools
                      .filter(s => !selectedDistrict || s.district.toLowerCase() === selectedDistrict.toLowerCase())
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.kgbv_name.toUpperCase()}</option>
                      ))}
                  </select>
                </div>
              </>
            )}

            <div className="w-px h-5 bg-slate-200 hidden sm:block shrink-0"></div>

            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider shrink-0">
              Schools: <span className="font-extrabold text-emerald-600 text-sm ml-1.5 font-sans normal-case">{materials.length}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Toast Notifications */}
        {toast && (
          <div className="absolute top-20 right-6 z-50 animate-bounce">
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-xl ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              {toast.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Scrollable Dashboard View */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="font-bold text-slate-500 animate-pulse">Loading modules...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: INVENTORY LIST VIEW */}
              {activeTab === "list" && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  
                  {/* KPI DASHBOARD */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Pie Chart Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm col-span-1 md:col-span-1 flex flex-col justify-between items-center min-h-[220px]">
                      <h3 className="text-[10px] font-black uppercase text-slate-500 w-full text-left tracking-widest mb-1">Dispatch Overview</h3>
                      <div className="w-full h-full flex-1 min-h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dispatchStats}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {dispatchStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={28} 
                              iconType="circle"
                              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {dispatchStats.map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-center min-h-[220px] relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300" 
                            style={{ backgroundColor: stat.color }}
                          ></div>
                          <div className="flex flex-col gap-2 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.name}</span>
                            <span className="text-5xl font-black text-slate-800">{stat.value}</span>
                            <span className="text-xs font-bold mt-2" style={{ color: stat.color }}>
                              {schools.length > 0 ? Math.round((stat.value / schools.length) * 100) : 0}% of Total Network
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Materials Grid / Table */}
                  {filteredMaterials.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
                        <Package className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">No inventory entries found</h3>
                      <p className="text-sm text-slate-500 max-w-sm">Try tweaking your search or filter keywords, or add a new materials entry.</p>
                      <button 
                        onClick={() => setActiveTab("entry")}
                        className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Create First Entry
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                              <th className="py-3 px-4 pl-6 border-b border-slate-100">District</th>
                              <th className="py-3 px-4 border-b border-slate-100">School Name</th>
                              <th className="py-3 px-4 border-b border-slate-100">Dispatched Qty</th>
                              <th className="py-3 px-4 border-b border-slate-100">Warehouse</th>
                              <th className="py-3 px-4 border-b border-slate-100">DC Number</th>
                              <th className="py-3 px-4 border-b border-slate-100">Driver & Vehicle</th>
                              <th className="py-3 px-4 border-b border-slate-100">Images</th>
                              <th className="py-3 px-4 border-b border-slate-100">Remarks</th>
                              <th className="py-3 px-4 pr-6 border-b border-slate-100 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm font-semibold text-slate-700 divide-y divide-slate-100">
                            {paginatedMaterials.map((m) => {
                              const outwardImages = Array.isArray(m.outward_images) ? m.outward_images : [];
                              const warehouseName = m.warehouses?.warehouse_name || "—";
                              return (
                                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-3.5 px-4 pl-6">
                                    <span className="font-extrabold text-slate-800">
                                      {m.schools?.district?.toUpperCase()} {m.schools?.pin_code ? `(${m.schools.pin_code})` : ""}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="text-slate-755 font-bold uppercase text-xs">
                                      {m.schools?.kgbv_name?.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                      <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 rounded text-[10px] font-extrabold">
                                        Tank: {m.tank !== undefined && m.tank !== null ? Math.round(m.tank) : "—"}
                                      </span>
                                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-extrabold">
                                        MMS: {m.mms !== undefined && m.mms !== null ? Math.round(m.mms) : "—"}
                                      </span>
                                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-extrabold">
                                        Coll: {m.collectors !== undefined && m.collectors !== null ? Math.round(m.collectors) : "—"}
                                      </span>
                                      <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[10px] font-extrabold">
                                        Plumb: {m.plumbing !== undefined && m.plumbing !== null ? Math.round(m.plumbing) : "—"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                      {warehouseName}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="text-[11px] font-black text-slate-700 font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                                      {m.dc_number || "—"}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[11px] font-bold text-slate-600">{m.driver_name || "—"}</span>
                                      {(m.driver_phone || m.vehicle_number) && (
                                        <span className="text-[10px] font-medium text-slate-400 font-mono">
                                          {[m.driver_phone, m.vehicle_number].filter(Boolean).join(" | ")}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    {outwardImages.length > 0 ? (
                                      <button 
                                        onClick={() => {
                                          setLightboxImages(outwardImages);
                                          setActiveLightboxIndex(0);
                                        }}
                                        className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded hover:bg-indigo-600 hover:text-white transition-all shadow-sm group"
                                      >
                                        <ImageIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                        {outwardImages.length}
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-bold">No images</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <p className="text-[11px] font-semibold text-slate-400 max-w-[150px] truncate" title={m.remarks || ""}>
                                      {m.remarks || "—"}
                                    </p>
                                  </td>
                                  <td className="py-3.5 px-4 pr-6 text-right">
                                    <button
                                      onClick={() => {
                                        setEditingRecord(m);
                                        setEditWarehouseId(m.warehouse_id || "");
                                        setEditTank(m.tank !== undefined && m.tank !== null ? m.tank.toString() : "");
                                        setEditMms(m.mms !== undefined && m.mms !== null ? m.mms.toString() : "");
                                        setEditCollectors(m.collectors !== undefined && m.collectors !== null ? m.collectors.toString() : "");
                                        setEditPlumbing(m.plumbing !== undefined && m.plumbing !== null ? m.plumbing.toString() : "");
                                        setEditDcNumber(m.dc_number || "");
                                        setEditDriverName(m.driver_name || "");
                                        setEditDriverPhone(m.driver_phone || "");
                                        setEditVehicleNumber(m.vehicle_number || "");
                                        setEditRemarks(m.remarks || "");
                                        setEditOutwardImages(Array.isArray(m.outward_images) ? m.outward_images : []);
                                        setEditFiles([]);
                                        setIsEditOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/85 border border-emerald-200/50 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                                    >
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Bar */}
                      {totalPages > 1 && (
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">
                            Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredMaterials.length)}</span> of <span className="text-slate-800">{filteredMaterials.length}</span> schools
                          </span>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button 
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3.5 py-1.5 rounded-lg border font-bold text-xs transition-all ${
                                  currentPage === page 
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                            <button 
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: NEW MATERIAL ENTRY FORM */}
              {activeTab === "entry" && (
                <div className="w-full bg-white rounded-xl border border-slate-150 shadow-sm overflow-hidden animate-fadeIn">
                  
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-3 px-5 text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-black tracking-tight uppercase">Create Material Record</h3>
                      <p className="text-[10px] text-white/80 font-bold mt-0.5">Associate inventory counts and upload verification photos.</p>
                    </div>
                    <Package className="w-6.5 h-6.5 opacity-25" />
                  </div>

                  <form onSubmit={handleFormSubmit} className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    
                    {/* Columns 1 & 2: School Details & Inputs */}
                    <div className="lg:col-span-2 flex flex-col gap-3">
                      
                      {/* Location Selection Subcard */}
                      <div className="bg-slate-50/50 border border-slate-200/60 p-3 px-4 rounded-xl flex flex-col gap-3">
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">School Location Details</h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Filter by district first, then choose the school record.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* District Selection */}
                          <div>
                            <label className="block text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Select District <span className="text-red-500">*</span></label>
                            <select 
                              value={selectedFormDistrict}
                              onChange={(e) => {
                                setSelectedFormDistrict(e.target.value);
                                setSelectedSchool(null);
                                setFormSchoolSearch("");
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all cursor-pointer shadow-sm uppercase"
                            >
                              <option value="" className="normal-case">-- CHOOSE A DISTRICT --</option>
                              {districts.map((d) => (
                                <option key={d} value={d}>{d.toUpperCase()}</option>
                              ))}
                            </select>
                          </div>

                          {/* Searchable School Dropdown */}
                          <div className="relative">
                            <label className="block text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">School <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                type="text" 
                                disabled={!selectedFormDistrict}
                                placeholder={
                                  !selectedFormDistrict 
                                    ? "SELECT A DISTRICT FIRST..." 
                                    : selectedSchool 
                                      ? `${selectedSchool.kgbv_name.toUpperCase()} (${selectedSchool.school_id.toUpperCase()})` 
                                      : "TYPE TO SEARCH SCHOOL..."
                                }
                                value={formSchoolSearch}
                                onChange={(e) => {
                                  setFormSchoolSearch(e.target.value);
                                  setShowSchoolDropdown(true);
                                  if (selectedSchool) setSelectedSchool(null);
                                }}
                                onFocus={() => setShowSchoolDropdown(true)}
                                className={`w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-9 pr-9 text-xs font-bold transition-all outline-none shadow-sm uppercase ${
                                  !selectedFormDistrict
                                    ? "opacity-50 cursor-not-allowed bg-slate-105/50"
                                    : selectedSchool 
                                      ? "bg-emerald-50/50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/10 font-bold" 
                                      : "focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                                }`}
                              />
                              {selectedSchool && (
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setSelectedSchool(null);
                                    setFormSchoolSearch("");
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {showSchoolDropdown && !selectedSchool && selectedFormDistrict && (
                              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-30 divide-y divide-slate-100">
                                {formFilteredSchools.length === 0 ? (
                                  <div className="p-3.5 text-xs font-bold text-slate-400 text-center uppercase">
                                    {formSchoolSearch ? "No matching schools found" : "No schools available for this district"}
                                  </div>
                                ) : (
                                  formFilteredSchools.map((s) => (
                                    <button 
                                      key={s.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSchool(s);
                                        setFormSchoolSearch("");
                                        setShowSchoolDropdown(false);
                                      }}
                                      className="w-full text-left py-2 px-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                                    >
                                      <div>
                                        <p className="text-xs font-extrabold text-slate-800 uppercase">{s.kgbv_name.toUpperCase()}</p>
                                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase">{s.district.toUpperCase()} DISTRICT</p>
                                      </div>
                                      <span className="px-2 py-0.5 bg-slate-105 text-slate-600 border border-slate-200 rounded-md text-[9px] font-black uppercase">
                                        {s.school_id.toUpperCase()}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Material Configuration Subcard */}
                      <div className="bg-slate-50/50 border border-slate-200/60 p-3 px-4 rounded-xl flex flex-col gap-3">
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Solar Installation Materials Config</h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Specify active counts/capacity for site construction.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Tank capacity (Ltrs)</label>
                            <input 
                              type="number" 
                              min="0" 
                              step="any" 
                              placeholder="e.g. 500"
                              value={formTank}
                              onChange={(e) => setFormTank(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">MMS (Structure kW)</label>
                            <input 
                              type="number" 
                              min="0" 
                              step="any" 
                              placeholder="e.g. 15"
                              value={formMms}
                              onChange={(e) => setFormMms(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Collectors (Units)</label>
                            <input 
                              type="number" 
                              min="0" 
                              step="any" 
                              placeholder="e.g. 10"
                              value={formCollectors}
                              onChange={(e) => setFormCollectors(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Plumbing (Units)</label>
                            <input 
                              type="number" 
                              min="0" 
                              step="any" 
                              placeholder="e.g. 5"
                              value={formPlumbing}
                              onChange={(e) => setFormPlumbing(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all shadow-sm"
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Column 3: Multiple File Upload Dropzone */}
                    <div className="lg:col-span-1 flex flex-col gap-3">
                      <div className="bg-slate-50/50 border border-slate-200/60 p-3 rounded-xl flex flex-col gap-3 h-full">
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Site Verification Photos</h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Attach verification photos for site auditing.</p>
                        </div>
                        
                        <div 
                          onClick={() => document.getElementById("form-file-input")?.click()}
                          className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-5 bg-white hover:bg-slate-50/50 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 group shadow-sm flex-1 min-h-[110px]"
                        >
                          <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                          <span className="text-xs font-bold text-slate-700">Drag verification images or <span className="text-emerald-600 hover:underline">browse</span></span>
                          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Supports multiple JPG, PNG images</span>
                          <input 
                            type="file" 
                            id="form-file-input" 
                            multiple 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden" 
                          />
                        </div>

                        {/* Upload Progress Bar */}
                        {uploadProgress !== null && (
                          <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1.5 shadow-sm">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                              <span>Saving files...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                          </div>
                        )}

                        {/* Selected Previews List */}
                        {selectedFiles.length > 0 && (
                          <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-slate-200 max-h-56 overflow-y-auto shadow-sm">
                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider mb-0.5">Attached Files ({selectedFiles.length})</span>
                            {selectedFiles.map((file, i) => (
                              <div key={i} className="flex flex-col gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/50 text-[11px] font-bold text-slate-700">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="truncate w-28 text-slate-800">{file.name}</span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[9px] text-slate-400 font-bold">{(file.size / 1024).toFixed(0)} KB</span>
                                    <button 
                                      type="button" 
                                      onClick={() => removeSelectedFile(i)}
                                      className="text-slate-400 hover:text-red-500 p-0.5 rounded-full hover:bg-white border border-transparent hover:border-slate-250 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  placeholder="e.g. Tank Front View, Collector Installation"
                                  value={fileDescriptions[i] || ""}
                                  onChange={(e) => updateFileDescription(i, e.target.value)}
                                  className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2.5 text-[9px] font-bold text-slate-750 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                  </form>

                  {/* Form Actions Footer */}
                  <div className="bg-slate-50 py-3 px-5 border-t border-slate-150 flex justify-end gap-2.5">
                    <button 
                      type="button"
                      onClick={() => setActiveTab("list")}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 bg-white font-bold text-xs hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={formLoading}
                      onClick={handleFormSubmit}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Submit Material Record
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

              {/* TAB 3: BULK IMPORT */}
              {activeTab === "bulk" && (
                <div className="w-full flex flex-col gap-4 animate-fadeIn">
                  
                  {/* Dropzone Card */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col lg:flex-row gap-5 items-center justify-between">
                    
                    <div className="flex-1 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        Bulk Upload Inventory Records
                      </div>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Import materials inventory data in bulk using a CSV file. The file should contain headers for: <code className="bg-slate-100 text-emerald-700 px-1.5 py-0.5 rounded font-black text-[10px]">school_id, tank, mms, collectors, plumbing</code>.
                        Note: The <code className="bg-slate-100 text-emerald-700 px-1.5 py-0.5 rounded font-black text-[10px]">school_id</code> column accepts **School Pincode**, human-readable **School ID**, or **School Name** for automatic matching.
                      </p>
                      
                      <div className="flex items-center gap-4 mt-1">
                        <button 
                          onClick={loadDemoBulkData}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all shadow-sm"
                        >
                          <Info className="w-3.5 h-3.5" />
                          Load Example Data
                        </button>
                      </div>
                    </div>

                    <div 
                      onDragOver={handleCSVDragOver}
                      onDrop={handleCSVDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full lg:w-96 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-5 bg-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1.5 group shrink-0"
                    >
                      <UploadCloud className="w-9 h-9 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      <span className="text-xs font-bold text-slate-700">Drag CSV here or <span className="text-emerald-600 hover:underline">browse</span></span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Supports standard CSV file formats</span>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleCSVFileSelect}
                        accept=".csv"
                        className="hidden" 
                      />
                    </div>

                  </div>

                  {/* Bulk Process Loading Indicator */}
                  {bulkProgress !== null && (
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-700">
                        <span>Uploading validated rows in bulk...</span>
                        <span>{bulkProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  {/* Bulk Preview Validation Grid */}
                  {bulkRows.length > 0 && !bulkResult && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                      <div className="py-3 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800">Import File Preview & Pre-validation</h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Please review valid rows (green check) and resolve errors (red warning) before committing.</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-xs font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {bulkRows.filter(r => r.isValid).length} Valid
                          </span>
                          {bulkRows.filter(r => !r.isValid).length > 0 && (
                            <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-md text-xs font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {bulkRows.filter(r => !r.isValid).length} Invalid
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-slate-200">
                              <th className="p-4 pl-6">Row #</th>
                              <th className="p-4">School Reference (ID / Pincode)</th>
                              <th className="p-4 text-center">Tank</th>
                              <th className="p-4 text-center">MMS</th>
                              <th className="p-4 text-center">Collectors</th>
                              <th className="p-4 text-center">Plumbing</th>
                              <th className="p-4 pr-6 text-right">Validation Status</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                            {bulkRows.map((row) => (
                              <tr key={row.rowNum} className={row.isValid ? "hover:bg-slate-50/50" : "bg-red-50/30 hover:bg-red-50/50"}>
                                <td className="p-4 pl-6 text-slate-400">{row.rowNum}</td>
                                <td className="p-4">
                                  <span className="font-extrabold text-slate-800">{row.school_id}</span>
                                </td>
                                <td className="p-4 text-center">{Math.round(Number(row.tank) || 0)}</td>
                                <td className="p-4 text-center">{Math.round(Number(row.mms) || 0)}</td>
                                <td className="p-4 text-center">{Math.round(Number(row.collectors) || 0)}</td>
                                <td className="p-4 text-center">{Math.round(Number(row.plumbing) || 0)}</td>
                                <td className="p-4 pr-6 text-right">
                                  {row.isValid ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                                      <Check className="w-3 h-3" /> Ready
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider" title={row.error}>
                                      <AlertTriangle className="w-3 h-3" /> {row.error}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Confirm Actions bar */}
                      <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                        <button 
                          onClick={() => setBulkRows([])}
                          className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold bg-white text-xs hover:bg-slate-50 transition-colors"
                        >
                          Clear Upload
                        </button>
                        <button 
                          onClick={handleBulkUploadSubmit}
                          disabled={bulkLoading || bulkRows.filter(r => r.isValid).length === 0}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
                        >
                          {bulkLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Inserting Valid Records...
                            </>
                          ) : (
                            <>
                              Confirm Bulk Upload ({bulkRows.filter(r => r.isValid).length} Rows)
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  )}

                  {/* Bulk Result Summary Card */}
                  {bulkResult && (
                    <div className="bg-white rounded-xl border border-slate-150 shadow-sm p-5 flex flex-col gap-5 animate-fadeIn w-full">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
                        <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Bulk Import Summary</h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Real-time status report of the completed batch import transaction.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Uploaded</p>
                          <p className="text-2xl font-black text-slate-700 mt-1">
                            {bulkResult.insertedCount + bulkResult.failedCount}
                          </p>
                        </div>
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Successfully Inserted</p>
                          <p className="text-2xl font-black text-emerald-700 mt-1">{bulkResult.insertedCount}</p>
                        </div>
                        <div className={`p-4 rounded-xl border text-center ${bulkResult.failedCount > 0 ? "bg-amber-50/50 border-amber-200 text-amber-800" : "bg-slate-50 border-slate-200/50 text-slate-400"}`}>
                          <p className="text-[9px] font-black uppercase tracking-widest">Skipped Records</p>
                          <p className="text-2xl font-black mt-1">{bulkResult.failedCount}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-center flex flex-col justify-center">
                          <button 
                            onClick={() => {
                              setBulkRows([]);
                              setBulkResult(null);
                            }}
                            className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors shadow-sm uppercase tracking-wider"
                          >
                            Import Another File
                          </button>
                        </div>
                      </div>

                      {bulkResult.failures.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md uppercase tracking-wider">
                              Skipped Records ({bulkResult.failedCount})
                            </span>
                          </div>
                          
                          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200/50 rounded-xl bg-slate-50/40">
                            {bulkResult.failures.map((f, i) => (
                              <div key={i} className="p-3 px-4 text-xs font-bold text-slate-700 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-400 text-[10px]">Row {f.row}</span>
                                  <span className="font-extrabold text-slate-800 uppercase">{f.school_id}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-xs">
                                  <span>→</span>
                                  <span className="bg-amber-50 border border-amber-100/80 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide">
                                    {f.error || "School not found"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

            </>
          )}

        </div>
      </main>

      {/* ── LIGHTBOX GALERY COMPONENT ── */}
      {lightboxImages && (
        <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col justify-between items-center p-6 animate-fadeIn">
          
          {/* Header section of lightbox */}
          <div className="w-full max-w-5xl flex justify-between items-center text-white shrink-0">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
                Site Image View ({activeLightboxIndex + 1} of {lightboxImages.length})
              </span>
              {lightboxImages[activeLightboxIndex]?.description && (
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded w-fit">
                  {lightboxImages[activeLightboxIndex].description}
                </span>
              )}
            </div>
            <button 
              onClick={() => setLightboxImages(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Core Image Showcase */}
          <div className="w-full flex-1 flex items-center justify-center gap-6 select-none relative my-6">
            
            {lightboxImages.length > 1 && (
              <button 
                onClick={() => {
                  setActiveLightboxIndex((prev) => (prev === 0 ? lightboxImages.length - 1 : prev - 1));
                }}
                className="absolute left-4 p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative w-full h-[70vh] max-w-4xl">
              <Image 
                src={lightboxImages[activeLightboxIndex]?.image || lightboxImages[activeLightboxIndex]} 
                alt={lightboxImages[activeLightboxIndex]?.description || `Material Image ${activeLightboxIndex + 1}`}
                fill
                className="object-contain drop-shadow-2xl rounded-lg"
                unoptimized
              />
            </div>

            {lightboxImages.length > 1 && (
              <button 
                onClick={() => {
                  setActiveLightboxIndex((prev) => (prev === lightboxImages.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

          </div>

          {/* Carousel Indicator Thumbnails */}
          {lightboxImages.length > 1 && (
            <div className="flex gap-2 max-w-xl overflow-x-auto p-2 bg-white/5 rounded-2xl border border-white/10 shrink-0 select-none">
              {lightboxImages.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveLightboxIndex(i)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    activeLightboxIndex === i ? "border-emerald-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image 
                    src={img?.image || img} 
                    alt={`Thumbnail ${i + 1}`} 
                    fill 
                    className="object-cover"
                    unoptimized 
                  />
                </button>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ── EDIT MATERIAL MODAL ── */}
      {isEditOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-tight">
                  Edit Dispatch details • {editingRecord.schools?.kgbv_name?.toUpperCase()}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable form */}
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto flex flex-col gap-5">
              
              {/* Logistics & Warehouse Section */}
              <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-4">
                <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Logistics & Dispatched Warehouse</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Source Warehouse</label>
                    <select
                      value={editWarehouseId}
                      onChange={(e) => setEditWarehouseId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    >
                      <option value="">SELECT SOURCE WAREHOUSE</option>
                      {warehouses.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.warehouse_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">DC Number (Delivery Challan)</label>
                    <input
                      type="text"
                      placeholder="e.g. DC-10294"
                      value={editDcNumber}
                      onChange={(e) => setEditDcNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Driver Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={editDriverName}
                      onChange={(e) => setEditDriverName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Driver Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={editDriverPhone}
                      onChange={(e) => setEditDriverPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vehicle Number</label>
                    <input
                      type="text"
                      placeholder="e.g. TS 08 EA 1234"
                      value={editVehicleNumber}
                      onChange={(e) => setEditVehicleNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Solar Installation Materials Section */}
              <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-4">
                <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">solar installation materials counts</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Tank (Ltrs)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editTank}
                      onChange={(e) => setEditTank(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">MMS (kW)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editMms}
                      onChange={(e) => setEditMms(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Collectors (Units)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editCollectors}
                      onChange={(e) => setEditCollectors(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Plumbing (Units)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editPlumbing}
                      onChange={(e) => setEditPlumbing(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Remarks</label>
                <textarea
                  placeholder="Enter logistics remarks..."
                  rows={2}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm resize-none"
                />
              </div>

              {/* Upload Proof Images Section */}
              <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-3">
                <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">dispatch proof images</h4>
                
                <div 
                  onClick={() => document.getElementById("edit-file-input")?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 bg-white hover:bg-slate-50/50 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1 shadow-sm"
                >
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">Browse additional verification images</span>
                  <input 
                    type="file" 
                    id="edit-file-input" 
                    multiple 
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="hidden" 
                  />
                </div>

                {/* Edit Upload Progress */}
                {editUploadProgress !== null && (
                  <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1.5 shadow-sm">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                      <span>Saving updates & uploading images...</span>
                      <span>{editUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${editUploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {/* Uploaded Verification Photos list */}
                {editOutwardImages.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Active Proof Images ({editOutwardImages.length})</span>
                    <div className="grid grid-cols-5 gap-2 bg-white p-2 rounded-xl border border-slate-200">
                      {editOutwardImages.map((img, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-slate-150 group">
                          <Image src={img} alt="Outward image" fill className="object-cover" unoptimized />
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(img)}
                            className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow animate-fadeIn"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Newly selected files previews */}
                {editFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Newly Selected Files ({editFiles.length})</span>
                    <div className="flex flex-wrap gap-2">
                      {editFiles.map((file, i) => (
                        <div key={i} className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 text-[10px] font-bold text-slate-700 flex items-center gap-2">
                          <span className="truncate max-w-[120px]">{file.name}</span>
                          <button 
                            type="button"
                            onClick={() => removeEditFile(i)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 bg-white font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Changes
                      <Check className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
