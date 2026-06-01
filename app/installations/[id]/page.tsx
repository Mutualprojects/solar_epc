"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";
import { DM_Sans } from "next/font/google";
import {
  Wrench, ChevronLeft, Loader2, MapPin, Phone,
  Camera, Eye, X, CheckCircle, Clock, Save, Lock, Sparkles, Check,
  ChevronDown, Grid3x3, List, ZoomIn, Download, Share2, AlertCircle, Edit3
} from "lucide-react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

// ─────────────────── INTERFACES ───────────────────
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

interface SystemState {
  system_no: number;
  status: string;
  remarks: string;
  images: string[];
}

interface Material {
  id: string;
  material_code: string;
  capacity?: string;
  tank?: number;
  mms?: number;
  collectors?: number;
  plumbing?: number;
}

interface Installation {
  id: string;
  created_at: string;
  school_id: string;
  material_id: string;
  installation_code: string;
  started_at: string | null;
  completed_at: string | null;
  tank_status: string;
  tank_percentage: number;
  tank_remarks: string;
  tank_images: string[];
  tank_updated_at: string | null;
  mms_status: string;
  mms_percentage: number;
  mms_remarks: string;
  mms_images: string[];
  mms_updated_at: string | null;
  collectors_status: string;
  collectors_percentage: number;
  collectors_remarks: string;
  collectors_images: string[];
  collectors_updated_at: string | null;
  plumbing_status: string;
  plumbing_percentage: number;
  plumbing_remarks: string;
  plumbing_images: string[];
  plumbing_updated_at: string | null;
  overall_percentage: number;
  overall_status: string;
  remarks: string;
  schools?: School;
  materials?: Material;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PendingFile {
  file: File;
  previewUrl: string;
}

interface ImageModalState {
  isOpen: boolean;
  imageUrl: string | null;
  imageIndex: number;
}

// ─────────────────── MAIN COMPONENT ───────────────────
export default function InstallationDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  // ──── Core States ────
  const [loading, setLoading] = useState(true);
  const [inst, setInst] = useState<Installation | null>(null);
  const [activeSystem, setActiveSystem] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [imageModal, setImageModal] = useState<ImageModalState>({ isOpen: false, imageUrl: null, imageIndex: 0 });

  // ──── System States ────
  const [tankSystems, setTankSystems] = useState<SystemState[]>([]);
  const [mmsSystems, setMmsSystems] = useState<SystemState[]>([]);
  const [collSystems, setCollSystems] = useState<SystemState[]>([]);
  const [plumbSystems, setPlumbSystems] = useState<SystemState[]>([]);

  // ──── Tank States ────
  const [tankStatus, setTankStatus] = useState("Pending");
  const [tankPct, setTankPct] = useState(0);
  const [tankRemarks, setTankRemarks] = useState("");
  const [tankImages, setTankImages] = useState<string[]>([]);

  // ──── MMS States ────
  const [mmsStatus, setMmsStatus] = useState("Pending");
  const [mmsPct, setMmsPct] = useState(0);
  const [mmsRemarks, setMmsRemarks] = useState("");
  const [mmsImages, setMmsImages] = useState<string[]>([]);

  // ──── Collectors States ────
  const [collStatus, setCollStatus] = useState("Pending");
  const [collPct, setCollPct] = useState(0);
  const [collRemarks, setCollRemarks] = useState("");
  const [collImages, setCollImages] = useState<string[]>([]);

  // ──── Plumbing States ────
  const [plumbStatus, setPlumbStatus] = useState("Pending");
  const [plumbPct, setPlumbPct] = useState(0);
  const [plumbRemarks, setPlumbRemarks] = useState("");
  const [plumbImages, setPlumbImages] = useState<string[]>([]);

  // ──── Pending Files ────
  const [pendingTankFiles, setPendingTankFiles] = useState<PendingFile[]>([]);
  const [pendingMmsFiles, setPendingMmsFiles] = useState<PendingFile[]>([]);
  const [pendingCollFiles, setPendingCollFiles] = useState<PendingFile[]>([]);
  const [pendingPlumbFiles, setPendingPlumbFiles] = useState<PendingFile[]>([]);

  // ──── UI States ────
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    tank: true,
    mms: false,
    collectors: false,
    plumbing: false,
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ──── File References ────
  const tankFileRef = useRef<HTMLInputElement>(null);
  const mmsFileRef = useRef<HTMLInputElement>(null);
  const collFileRef = useRef<HTMLInputElement>(null);
  const plumbFileRef = useRef<HTMLInputElement>(null);

  // ─────────────────── UTILITIES ───────────────────
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const parseSystems = (
    dbImagesField: any,
    overallStatus: string,
    overallRemarks: string,
    requiredCount: number
  ): SystemState[] => {
    let loadedSystems: SystemState[] = [];
    const isMultiSystemFormat =
      Array.isArray(dbImagesField) &&
      dbImagesField.length > 0 &&
      typeof dbImagesField[0] === "object" &&
      dbImagesField[0] !== null &&
      "system_no" in dbImagesField[0];

    if (isMultiSystemFormat) {
      loadedSystems = [...dbImagesField];
    } else {
      loadedSystems = [
        {
          system_no: 1,
          status: overallStatus || "Pending",
          remarks: overallRemarks || "",
          images: Array.isArray(dbImagesField) ? dbImagesField : [],
        },
      ];
    }

    while (loadedSystems.length < requiredCount) {
      loadedSystems.push({
        system_no: loadedSystems.length + 1,
        status: "Pending",
        remarks: "",
        images: [],
      });
    }

    return loadedSystems.slice(0, requiredCount);
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm";
      case "in progress":
        return "bg-amber-50 text-amber-700 border-amber-200 shadow-sm";
      case "suspended":
        return "bg-rose-50 text-rose-700 border-rose-200 shadow-sm";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  const getModuleOverallStatus = (systems: SystemState[]) => {
    if (systems.length === 0) return "Pending";
    if (systems.every((s) => s.status === "Completed")) return "Completed";
    if (systems.every((s) => s.status === "Pending")) return "Pending";
    if (systems.some((s) => s.status === "Suspended")) return "Suspended";
    return "In Progress";
  };

  const getLatestSystemsWithImages = (
    section: "tank" | "mms" | "collectors" | "plumbing",
    images: string[]
  ): SystemState[] => {
    const sectionMap = {
      tank: { systems: tankSystems, status: tankStatus, remarks: tankRemarks },
      mms: { systems: mmsSystems, status: mmsStatus, remarks: mmsRemarks },
      collectors: { systems: collSystems, status: collStatus, remarks: collRemarks },
      plumbing: { systems: plumbSystems, status: plumbStatus, remarks: plumbRemarks },
    };

    const { systems, status, remarks } = sectionMap[section];
    const arr = [...systems];

    if (activeSystem <= arr.length) {
      arr[activeSystem - 1] = {
        system_no: activeSystem,
        status,
        remarks,
        images,
      };
    }
    return arr;
  };

  // ─────────────────── API CALLS ───────────────────
  const fetchInstallationDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/installations?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        let found = (data.data || []).find((x: Installation) => x.id === id);
        if (!found) {
          found = (data.data || []).find((x: Installation) => x.school_id === id);
        }

        if (found) {
          setInst(found);

          const systemCount = Math.max(1, found.schools?.no_of_systems || 1);

          const parsedT = parseSystems(found.tank_images, found.tank_status, found.tank_remarks, systemCount);
          const parsedM = parseSystems(found.mms_images, found.mms_status, found.mms_remarks, systemCount);
          const parsedC = parseSystems(found.collectors_images, found.collectors_status, found.collectors_remarks, systemCount);
          const parsedP = parseSystems(found.plumbing_images, found.plumbing_status, found.plumbing_remarks, systemCount);

          setTankSystems(parsedT);
          setMmsSystems(parsedM);
          setCollSystems(parsedC);
          setPlumbSystems(parsedP);

          setTankStatus(parsedT[0].status);
          setTankRemarks(parsedT[0].remarks);
          setTankImages(parsedT[0].images);

          setMmsStatus(parsedM[0].status);
          setMmsRemarks(parsedM[0].remarks);
          setMmsImages(parsedM[0].images);

          setCollStatus(parsedC[0].status);
          setCollRemarks(parsedC[0].remarks);
          setCollImages(parsedC[0].images);

          setPlumbStatus(parsedP[0].status);
          setPlumbRemarks(parsedP[0].remarks);
          setPlumbImages(parsedP[0].images);
        } else {
          showToast("error", "Installation record was not found.");
        }
      } else {
        showToast("error", data.error || "Failed to retrieve installation details.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred fetching installations.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSystem = (newSystemNo: number) => {
    const updatedTank = [...tankSystems];
    if (activeSystem <= updatedTank.length) {
      updatedTank[activeSystem - 1] = {
        system_no: activeSystem,
        status: tankStatus,
        remarks: tankRemarks,
        images: tankImages,
      };
      setTankSystems(updatedTank);
    }

    const updatedMms = [...mmsSystems];
    if (activeSystem <= updatedMms.length) {
      updatedMms[activeSystem - 1] = {
        system_no: activeSystem,
        status: mmsStatus,
        remarks: mmsRemarks,
        images: mmsImages,
      };
      setMmsSystems(updatedMms);
    }

    const updatedColl = [...collSystems];
    if (activeSystem <= updatedColl.length) {
      updatedColl[activeSystem - 1] = {
        system_no: activeSystem,
        status: collStatus,
        remarks: collRemarks,
        images: collImages,
      };
      setCollSystems(updatedColl);
    }

    const updatedPlumb = [...plumbSystems];
    if (activeSystem <= updatedPlumb.length) {
      updatedPlumb[activeSystem - 1] = {
        system_no: activeSystem,
        status: plumbStatus,
        remarks: plumbRemarks,
        images: plumbImages,
      };
      setPlumbSystems(updatedPlumb);
    }

    if (newSystemNo <= updatedTank.length) {
      const sys = updatedTank[newSystemNo - 1];
      setTankStatus(sys.status);
      setTankRemarks(sys.remarks);
      setTankImages(sys.images);
    }
    if (newSystemNo <= updatedMms.length) {
      const sys = updatedMms[newSystemNo - 1];
      setMmsStatus(sys.status);
      setMmsRemarks(sys.remarks);
      setMmsImages(sys.images);
    }
    if (newSystemNo <= updatedColl.length) {
      const sys = updatedColl[newSystemNo - 1];
      setCollStatus(sys.status);
      setCollRemarks(sys.remarks);
      setCollImages(sys.images);
    }
    if (newSystemNo <= updatedPlumb.length) {
      const sys = updatedPlumb[newSystemNo - 1];
      setPlumbStatus(sys.status);
      setPlumbRemarks(sys.remarks);
      setPlumbImages(sys.images);
    }

    setActiveSystem(newSystemNo);
    setPendingTankFiles([]);
    setPendingMmsFiles([]);
    setPendingCollFiles([]);
    setPendingPlumbFiles([]);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: "tank" | "mms" | "collectors" | "plumbing"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!inst) return;

    try {
      setUploadingSection(section);

      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp" as const,
      };

      const compressedFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          try {
            const compressedBlob = await imageCompression(file, compressionOptions);
            const newFileName = file.name.replace(/\.[^/.]+$/, ".webp");
            return new File([compressedBlob], newFileName, { type: "image/webp" });
          } catch (compressErr) {
            console.error("Image compression failed, using original:", compressErr);
            return file;
          }
        })
      );

      const newPending = compressedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      if (section === "tank") setPendingTankFiles((prev) => [...prev, ...newPending]);
      if (section === "mms") setPendingMmsFiles((prev) => [...prev, ...newPending]);
      if (section === "collectors") setPendingCollFiles((prev) => [...prev, ...newPending]);
      if (section === "plumbing") setPendingPlumbFiles((prev) => [...prev, ...newPending]);

      showToast("success", `Added ${compressedFiles.length} images to pending list.`);
    } catch (err: any) {
      showToast("error", err.message || "Failed to process images.");
    } finally {
      setUploadingSection(null);
      e.target.value = "";
    }
  };

  const handleDeleteImage = (
    indexToDelete: number,
    section: "tank" | "mms" | "collectors" | "plumbing",
    isPending: boolean = false
  ) => {
    if (isPending) {
      if (section === "tank") setPendingTankFiles((prev) => prev.filter((_, i) => i !== indexToDelete));
      else if (section === "mms") setPendingMmsFiles((prev) => prev.filter((_, i) => i !== indexToDelete));
      else if (section === "collectors") setPendingCollFiles((prev) => prev.filter((_, i) => i !== indexToDelete));
      else if (section === "plumbing") setPendingPlumbFiles((prev) => prev.filter((_, i) => i !== indexToDelete));
    } else {
      if (section === "tank") setTankImages((prev) => prev.filter((_, idx) => idx !== indexToDelete));
      else if (section === "mms") setMmsImages((prev) => prev.filter((_, idx) => idx !== indexToDelete));
      else if (section === "collectors") setCollImages((prev) => prev.filter((_, idx) => idx !== indexToDelete));
      else if (section === "plumbing") setPlumbImages((prev) => prev.filter((_, idx) => idx !== indexToDelete));
    }
  };

  const saveStageProgress = async (section: "tank" | "mms" | "collectors" | "plumbing") => {
    if (!inst) return;

    try {
      setSavingSection(section);

      // ── 1. Upload any pending image files ──
      let pending: PendingFile[] = [];
      if (section === "tank") pending = pendingTankFiles;
      else if (section === "mms") pending = pendingMmsFiles;
      else if (section === "collectors") pending = pendingCollFiles;
      else if (section === "plumbing") pending = pendingPlumbFiles;

      let newlyUploadedUrls: string[] = [];
      if (pending.length > 0) {
        const formData = new FormData();
        formData.append("schoolId", inst.school_id);
        formData.append("section", section);
        for (const pf of pending) formData.append("files", pf.file);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw new Error(uploadData.error || "Image upload failed.");
        newlyUploadedUrls = uploadData.urls || [];
      }

      // ── 2. Get the current status explicitly selected by the user ──
      let selectedStatus = "Pending";
      let currentImages: string[] = [];
      let currentRemarks = "";

      if (section === "tank") {
        selectedStatus = tankStatus;
        currentImages = [...tankImages, ...newlyUploadedUrls];
        currentRemarks = tankRemarks;
        setTankImages(currentImages);
      } else if (section === "mms") {
        selectedStatus = mmsStatus;
        currentImages = [...mmsImages, ...newlyUploadedUrls];
        currentRemarks = mmsRemarks;
        setMmsImages(currentImages);
      } else if (section === "collectors") {
        selectedStatus = collStatus;
        currentImages = [...collImages, ...newlyUploadedUrls];
        currentRemarks = collRemarks;
        setCollImages(currentImages);
      } else if (section === "plumbing") {
        selectedStatus = plumbStatus;
        currentImages = [...plumbImages, ...newlyUploadedUrls];
        currentRemarks = plumbRemarks;
        setPlumbImages(currentImages);
      }

      // ── 3. Build updated system state array for this section ──
      const getSystemsForSection = (sec: string) => {
        if (sec === "tank") return tankSystems;
        if (sec === "mms") return mmsSystems;
        if (sec === "collectors") return collSystems;
        return plumbSystems;
      };
      const currentSystems = [...getSystemsForSection(section)];
      if (activeSystem <= currentSystems.length) {
        currentSystems[activeSystem - 1] = {
          system_no: activeSystem,
          status: selectedStatus,
          remarks: currentRemarks,
          images: currentImages,
        };
      }

      // Update local system state arrays
      if (section === "tank") setTankSystems(currentSystems);
      else if (section === "mms") setMmsSystems(currentSystems);
      else if (section === "collectors") setCollSystems(currentSystems);
      else if (section === "plumbing") setPlumbSystems(currentSystems);

      // ── 4. Compute stage-level overall status from all systems in this section ──
      const stageStatus = currentSystems.every(s => s.status === "Completed")
        ? "Completed"
        : currentSystems.some(s => s.status === "In Progress" || s.status === "Completed")
        ? "In Progress"
        : currentSystems.some(s => s.status === "Suspended")
        ? "Suspended"
        : "Pending";

      // ── 5. Simple, predictable percentage per stage ──
      const statusToPct = (s: string) => {
        if (s === "Completed") return 100;
        if (s === "In Progress") return 50;
        if (s === "Suspended") return 0;
        return 0; // Pending
      };

      const stagePct = statusToPct(stageStatus);

      // Get the other sections' current saved status from inst (DB truth)
      const savedTankStatus  = section === "tank" ? stageStatus : (inst.tank_status || "Pending");
      const savedMmsStatus   = section === "mms" ? stageStatus : (inst.mms_status || "Pending");
      const savedCollStatus  = section === "collectors" ? stageStatus : (inst.collectors_status || "Pending");
      const savedPlumbStatus = section === "plumbing" ? stageStatus : (inst.plumbing_status || "Pending");

      const overallPct = Math.round(
        (statusToPct(savedTankStatus) + statusToPct(savedMmsStatus) + statusToPct(savedCollStatus) + statusToPct(savedPlumbStatus)) / 4
      );

      const overallStatus =
        overallPct === 100 ? "Completed"
        : overallPct > 0 ? "In Progress"
        : "Pending";

      // ── 6. Build the patch payload ──
      const stageUpdates: any = { id: inst.id };

      if (section === "tank") {
        stageUpdates.tank_status     = stageStatus;
        stageUpdates.tank_percentage = stagePct;
        stageUpdates.tank_remarks    = currentRemarks;
        stageUpdates.tank_images     = currentSystems;
        stageUpdates.tank_updated_at = new Date().toISOString();
      } else if (section === "mms") {
        stageUpdates.mms_status     = stageStatus;
        stageUpdates.mms_percentage = stagePct;
        stageUpdates.mms_remarks    = currentRemarks;
        stageUpdates.mms_images     = currentSystems;
        stageUpdates.mms_updated_at = new Date().toISOString();
      } else if (section === "collectors") {
        stageUpdates.collectors_status     = stageStatus;
        stageUpdates.collectors_percentage = stagePct;
        stageUpdates.collectors_remarks    = currentRemarks;
        stageUpdates.collectors_images     = currentSystems;
        stageUpdates.collectors_updated_at = new Date().toISOString();
      } else if (section === "plumbing") {
        stageUpdates.plumbing_status     = stageStatus;
        stageUpdates.plumbing_percentage = stagePct;
        stageUpdates.plumbing_remarks    = currentRemarks;
        stageUpdates.plumbing_images     = currentSystems;
        stageUpdates.plumbing_updated_at = new Date().toISOString();
      }

      stageUpdates.overall_percentage = overallPct;
      stageUpdates.overall_status     = overallStatus;

      if (overallStatus === "Completed") {
        stageUpdates.completed_at = new Date().toISOString();
      } else if (overallStatus === "In Progress") {
        stageUpdates.started_at = inst.started_at || new Date().toISOString();
      }

      // ── 7. Send PATCH to API ──
      const res = await fetch("/api/installations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stageUpdates),
      });
      const data = await res.json();

      if (data.success) {
        if (section === "tank") setPendingTankFiles([]);
        else if (section === "mms") setPendingMmsFiles([]);
        else if (section === "collectors") setPendingCollFiles([]);
        else if (section === "plumbing") setPendingPlumbFiles([]);

        showToast("success", `${section.toUpperCase()} stage saved successfully!`);

        // Update inst state with fresh DB data
        if (inst.id.startsWith("virtual_inst_") && data.data?.id) {
          router.replace(`/installations/${data.data.id}`);
        } else {
          setInst((prev) => (prev ? { ...prev, ...data.data } : null));
        }
      } else {
        showToast("error", data.error || `Failed to save ${section} status.`);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to update record.");
    } finally {
      setSavingSection(null);
    }
  };


  // ─────────────────── RENDER COMPONENTS ───────────────────
  const renderStageCard = (
    stageNum: number,
    stageName: string,
    sectionKey: "tank" | "mms" | "collectors" | "plumbing",
    status: string,
    savedStatus: string,
    percentage: number,
    remarks: string,
    images: string[],
    pendingFiles: PendingFile[],
    fileRef: React.RefObject<HTMLInputElement | null>,
    onRemarkChange: (value: string) => void,
    onStatusChange: (value: string) => void,
    onUpload: (section: "tank" | "mms" | "collectors" | "plumbing") => void,
    onSave: (section: "tank" | "mms" | "collectors" | "plumbing") => void
  ) => {
    // isLocked = based on what's SAVED in DB, not the local dropdown value
    const isLocked = savedStatus === "Completed";
    const isInProgress = status === "In Progress";
    const isBeyondApplicable = activeSystem > systemCount;

    const badgeConfig: Record<string, { label: string; cls: string }> = {
      "Completed":   { label: "✓ Completed",   cls: "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm" },
      "In Progress": { label: "In Progress",  cls: "bg-amber-50 border-amber-300 text-amber-700 shadow-sm" },
      "Suspended":   { label: "Suspended",     cls: "bg-rose-50 border-rose-300 text-rose-700 shadow-sm" },
      "Pending":     { label: "Pending",       cls: "bg-slate-50 border-slate-200 text-slate-500" },
    };
    const badge = badgeConfig[status] ?? badgeConfig["Pending"];

    return (
      <div
        key={sectionKey}
        className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${isLocked ? "border-emerald-250 bg-gradient-to-br from-emerald-50/30 to-teal-50/20" : "border-slate-200 hover:border-slate-300"
          }`}
      >
        {/* Card Header */}
        <div
          className={`p-4 md:p-5 border-b cursor-pointer transition-all ${isLocked ? "border-emerald-200/50 bg-emerald-50/50" : "border-slate-100 hover:bg-slate-50/50"
            }`}
          onClick={() =>
            !isBeyondApplicable &&
            setExpandedSections((prev) => ({
              ...prev,
              [sectionKey]: !prev[sectionKey],
            }))
          }
        >
          <div className="flex items-start justify-between gap-3 md:gap-4 flex-wrap">
            {/* Left: Stage Number & Title */}
            <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
              <div
                className={`w-8 h-8 md:w-9 md:h-9 rounded-lg border flex items-center justify-center text-xs md:text-sm font-black shrink-0 flex-none ${isLocked
                  ? "bg-emerald-100 border-emerald-300 text-emerald-700 shadow-sm"
                  : isInProgress
                  ? "bg-amber-100 border-amber-300 text-amber-700"
                  : "bg-slate-100 border-slate-300 text-slate-700"
                  }`}
              >
                {stageNum}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-tight leading-tight">
                  {stageName} {systemCount > 1 && `(System ${activeSystem}/${systemCount})`}
                </h3>
                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Execution Stage {stageNum}
                </p>
              </div>
            </div>

            {/* Right: Status Badge & Lock */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
              {!isBeyondApplicable && (
                <>
                  {/* Status Badge */}
                  <span className={`inline-flex items-center px-2 md:px-2.5 py-1 rounded-full text-[8px] md:text-[9px] font-black border uppercase tracking-wider transition-all ${badge.cls}`}>
                    {badge.label}
                  </span>

                  {/* Lock Indicator */}
                  {isLocked && <Lock className="w-4 h-4 text-emerald-600 shrink-0" />}
                </>
              )}

              {/* Expand Toggle */}
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform ${expandedSections[sectionKey] ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </div>

        {/* Card Body */}
        {expandedSections[sectionKey] && (
          <div className="p-4 md:p-5 space-y-4">
            {isBeyondApplicable ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-6 text-center flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">System Not Applicable</h4>
                <p className="text-[9px] md:text-[10px] text-amber-700 uppercase font-bold max-w-sm leading-relaxed">
                  This site only has {systemCount} system(s). System {activeSystem} is not required.
                </p>
              </div>
            ) : (
              <>
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Remarks - always editable */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      Stage Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => onRemarkChange(e.target.value)}
                      placeholder={`Enter ${stageName.toLowerCase()} remarks...`}
                      className="bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl p-2.5 md:p-3 text-xs md:text-sm font-medium text-slate-700 outline-none min-h-[90px] md:min-h-[100px] placeholder:text-slate-400 transition-all resize-none"
                    />
                  </div>

                  {/* Images - always allow upload */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        Verification Images ({images.length + pendingFiles.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploadingSection === sectionKey}
                        className="px-2 md:px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 border border-emerald-700 text-white text-[8px] md:text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {uploadingSection === sectionKey ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Camera className="w-3 h-3" />
                        )}
                        <span className="hidden xs:inline">Upload</span>
                      </button>
                      <input
                        type="file"
                        ref={fileRef}
                        onChange={(e) => handleImageUpload(e, sectionKey)}
                        className="hidden"
                        multiple
                        accept="image/*"
                      />
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 md:p-3 min-h-[90px] md:min-h-[100px] flex flex-wrap gap-2 items-start content-start overflow-y-auto">
                      {renderImageGallery(images, pendingFiles, false, sectionKey)}
                    </div>
                  </div>
                </div>

                {/* Status & Save Row — ALWAYS VISIBLE */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Status:
                    </label>
                    <select
                      value={status}
                      onChange={(e) => onStatusChange(e.target.value)}
                      className={`border hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-lg py-1.5 md:py-2 px-2.5 md:px-3 text-xs md:text-sm font-bold outline-none uppercase transition-all cursor-pointer ${
                        isLocked
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : isInProgress
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-slate-50 border-slate-300 text-slate-700"
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSave(sectionKey)}
                    disabled={savingSection === sectionKey || isLocked}
                    title={isLocked ? "Stage already completed and saved. Change status to re-save." : ""}
                    className={`px-4 py-2 md:py-2.5 text-white font-black text-[9px] md:text-[10px] uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${
                      isLocked
                        ? "bg-emerald-300 cursor-not-allowed opacity-60"
                        : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg cursor-pointer"
                    } disabled:opacity-60`}
                  >
                    {savingSection === sectionKey ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isLocked ? "Saved ✓" : `Save Stage ${stageNum}`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderImageGallery = (
    savedImages: string[],
    pendingFiles: PendingFile[],
    isLocked: boolean,
    section: "tank" | "mms" | "collectors" | "plumbing"
  ) => {
    const allImages = [
      ...savedImages.map((url, idx) => ({ url, isPending: false, index: idx })),
      ...pendingFiles.map((pf, idx) => ({ url: pf.previewUrl, isPending: true, index: idx })),
    ];

    if (allImages.length === 0) {
      return (
        <div className="w-full flex items-center justify-center h-full">
          <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wide text-center">
            No images yet
          </span>
        </div>
      );
    }

    return allImages.map((item, idx) => (
      <div
        key={idx}
        className="relative group/img w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border border-slate-300 shadow-sm shrink-0 hover:shadow-md transition-all"
      >
        <img src={item.url} alt={`${section}-${idx}`} className="w-full h-full object-cover" />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setImageModal({ isOpen: true, imageUrl: item.url, imageIndex: idx })}
            className="p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-md transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {!isLocked && (
            <button
              type="button"
              onClick={() => handleDeleteImage(item.index, section, item.isPending)}
              className="p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-md transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pending Badge */}
        {item.isPending && (
          <div className="absolute top-1 right-1 bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded">
            PENDING
          </div>
        )}
      </div>
    ));
  };

  // ─────────────────── LOCK/COMPLETION CHECKS ───────────────────
  const isTankLocked = tankStatus === "Completed";
  const isMmsLocked = mmsStatus === "Completed";
  const isCollLocked = collStatus === "Completed";
  const isPlumbLocked = plumbStatus === "Completed";

  const isTankStageCompleted = inst?.tank_status === "Completed";
  const isMmsStageCompleted = inst?.mms_status === "Completed";
  const isCollStageCompleted = inst?.collectors_status === "Completed";
  const isPlumbStageCompleted = inst?.plumbing_status === "Completed";

  // ── Live progress reads directly from current status state (not system arrays) ──
  const systemCount = inst ? Math.max(1, inst.schools?.no_of_systems || 1) : 1;
  const statusToPctUI = (s: string) => {
    if (s === "Completed") return 100;
    if (s === "In Progress") return 50;
    return 0;
  };
  const calculatedProgress = Math.round(
    (statusToPctUI(tankStatus) + statusToPctUI(mmsStatus) + statusToPctUI(collStatus) + statusToPctUI(plumbStatus)) / 4
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchInstallationDetails();
  }, [id, router]);

  // ─────────────────── MAIN RENDER ───────────────────
  return (
    <div className={`h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 flex overflow-hidden ${dmSans.className}`}>
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col">
        <SessionNavBar />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <SharedHeader />

        {/* Toast Notifications */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-[99999] px-4 py-3 rounded-xl border shadow-lg flex items-center gap-2 animate-in slide-in-from-right ${toast.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-red-50 border-red-300 text-red-800"
              }`}
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="text-xs font-bold uppercase tracking-wide">{toast.message}</span>
          </div>
        )}

        {/* Image Modal */}
        {imageModal.isOpen && imageModal.imageUrl && (
          <div
            className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4"
            onClick={() => setImageModal({ isOpen: false, imageUrl: null, imageIndex: 0 })}
          >
            <div
              className="relative max-w-2xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageModal.imageUrl}
                alt="Expanded view"
                className="w-full h-full object-contain rounded-lg shadow-2xl"
              />
              <button
                onClick={() => setImageModal({ isOpen: false, imageUrl: null, imageIndex: 0 })}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-700 p-2 rounded-full shadow-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <a
                href={imageModal.imageUrl}
                download
                className="absolute bottom-4 right-4 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg transition-all"
              >
                <Download className="w-6 h-6" />
              </a>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation Bar */}
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
            <button
              onClick={() => {
                router.refresh();
                router.push("/installations");
              }}
              className="inline-flex items-center gap-2 text-[10px] md:text-xs font-black text-slate-600 hover:text-emerald-700 uppercase tracking-widest transition-colors cursor-pointer group"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 transform group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden xs:inline">Back to Installations</span>
            </button>

            {/* System Switcher */}
            {!loading && inst && systemCount > 1 && (
              <div className="flex items-center gap-2 bg-slate-100/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/60 shadow-sm">
                {Array.from({ length: systemCount }).map((_, idx) => {
                  const sysNo = idx + 1;
                  const isActive = activeSystem === sysNo;
                  return (
                    <button
                      key={sysNo}
                      onClick={() => handleSwitchSystem(sysNo)}
                      className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-wider transition-all ${isActive
                        ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80 font-extrabold"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/30"
                        }`}
                    >
                      System {sysNo}
                    </button>
                  );
                })}
              </div>
            )}

            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
              ID: {inst?.id?.slice(0, 8) || "LOADING"}...
            </span>
          </div>

          {/* Main Content Area */}
          <div className="px-4 md:px-6 py-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 h-96">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Loading site details...</p>
              </div>
            ) : !inst ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center max-w-md mx-auto shadow-sm">
                <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-full flex items-center justify-center text-red-500 font-bold mx-auto mb-4">
                  !
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Not Found</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold leading-relaxed">
                  Installation record could not be loaded.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Sidebar - Dashboard */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Header Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200/50 px-2.5 py-1 rounded-lg">
                            {inst.installation_code}
                          </span>
                          <span className={`inline-flex px-2.5 py-1 border rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider ${getStatusBadgeStyles(inst.overall_status)}`}>
                            {inst.overall_status}
                          </span>
                        </div>

                        <h2 className="text-sm md:text-base font-black text-slate-850 uppercase tracking-tight leading-tight mb-1">
                          {inst.schools?.kgbv_name || "UNKNOWN"}
                        </h2>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {inst.schools?.district || "N/A"}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase leading-relaxed">
                          {inst.schools?.address || "No address"}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-[8px] md:text-[9px] font-bold text-slate-500 uppercase">
                          <Phone className="w-3 h-3" /> {inst.schools?.contact_number || "N/A"}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Dispatch Ref</span>
                          <span className="text-[10px] font-black text-slate-800 uppercase">{inst.materials?.material_code || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Capacity</span>
                          <span className="text-[10px] font-black text-emerald-700 uppercase">{inst.materials?.capacity || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-3">
                      Site Execution Level
                    </span>

                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="52" className="stroke-slate-100" strokeWidth="10" fill="transparent" />
                        <circle
                          cx="64"
                          cy="64"
                          r="52"
                          className="stroke-emerald-600 transition-all duration-1000"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 52}
                          strokeDashoffset={2 * Math.PI * 52 * (1 - calculatedProgress / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl md:text-3xl font-black text-slate-800">{calculatedProgress}%</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-1">Overall</span>
                      </div>
                    </div>

                    {calculatedProgress === 100 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-black text-[9px] uppercase tracking-wide">
                          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                          Fully Completed
                        </div>
                        <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wide block">
                          {inst.completed_at ? new Date(inst.completed_at).toLocaleDateString() : "Today"}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-slate-100 mt-4 pt-4 space-y-2 text-[9px] font-black text-slate-500 uppercase tracking-wide">
                      <div className="flex justify-between">
                        <span>Started:</span>
                        <span className="text-slate-700 font-bold">{inst.started_at ? new Date(inst.started_at).toLocaleDateString() : "Pending"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Closed:</span>
                        <span className="text-slate-700 font-bold">{inst.completed_at ? new Date(inst.completed_at).toLocaleDateString() : "Pending"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2 mb-3">
                      Milestones
                    </span>

                    <div className="space-y-2.5">
                      {[
                        { completed: isTankStageCompleted, label: "Tank Installation" },
                        { completed: isMmsStageCompleted, label: "MMS Structure" },
                        { completed: isCollStageCompleted, label: "Solar Collectors" },
                        { completed: isPlumbStageCompleted, label: "Plumbing & Electrical" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${item.completed
                              ? "bg-emerald-500 border-emerald-600"
                              : "border-slate-300 bg-slate-50"
                              }`}
                          >
                            {item.completed && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider ${item.completed
                              ? "text-slate-400 line-through"
                              : "text-slate-700"
                              }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Stages */}
                <div className="lg:col-span-8 space-y-5">
                  {renderStageCard(
                    1,
                    "Tank Installation",
                    "tank",
                    tankStatus,
                    inst?.tank_status || "Pending",
                    tankPct,
                    tankRemarks,
                    tankImages,
                    pendingTankFiles,
                    tankFileRef,
                    setTankRemarks,
                    (val) => {
                      setTankStatus(val);
                      setTankPct(val === "Completed" ? 25 : 0);
                    },
                    () => handleImageUpload({ target: { files: null } } as any, "tank"),
                    () => saveStageProgress("tank")
                  )}

                  {renderStageCard(
                    2,
                    "MMS Structure Installation",
                    "mms",
                    mmsStatus,
                    inst?.mms_status || "Pending",
                    mmsPct,
                    mmsRemarks,
                    mmsImages,
                    pendingMmsFiles,
                    mmsFileRef,
                    setMmsRemarks,
                    (val) => {
                      setMmsStatus(val);
                      setMmsPct(val === "Completed" ? 50 : 0);
                    },
                    () => handleImageUpload({ target: { files: null } } as any, "mms"),
                    () => saveStageProgress("mms")
                  )}

                  {renderStageCard(
                    3,
                    "Solar Collectors Installation",
                    "collectors",
                    collStatus,
                    inst?.collectors_status || "Pending",
                    collPct,
                    collRemarks,
                    collImages,
                    pendingCollFiles,
                    collFileRef,
                    setCollRemarks,
                    (val) => {
                      setCollStatus(val);
                      setCollPct(val === "Completed" ? 75 : 0);
                    },
                    () => handleImageUpload({ target: { files: null } } as any, "collectors"),
                    () => saveStageProgress("collectors")
                  )}

                  {renderStageCard(
                    4,
                    "Plumbing & Electrical Routing",
                    "plumbing",
                    plumbStatus,
                    inst?.plumbing_status || "Pending",
                    plumbPct,
                    plumbRemarks,
                    plumbImages,
                    pendingPlumbFiles,
                    plumbFileRef,
                    setPlumbRemarks,
                    (val) => {
                      setPlumbStatus(val);
                      setPlumbPct(val === "Completed" ? 100 : 0);
                    },
                    () => handleImageUpload({ target: { files: null } } as any, "plumbing"),
                    () => saveStageProgress("plumbing")
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}