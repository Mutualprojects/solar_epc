"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";
import { DM_Sans } from "next/font/google";
import {
  Wrench, ChevronLeft, Loader2, MapPin, Phone,
  Camera, Eye, X, CheckCircle, Clock, Save, Lock, Sparkles, Check
} from "lucide-react";

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InstallationDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [inst, setInst] = useState<Installation | null>(null);
  
  // Multi-system list states
  const [tankSystems, setTankSystems] = useState<SystemState[]>([]);
  const [mmsSystems, setMmsSystems] = useState<SystemState[]>([]);
  const [collSystems, setCollSystems] = useState<SystemState[]>([]);
  const [plumbSystems, setPlumbSystems] = useState<SystemState[]>([]);
  const [activeSystem, setActiveSystem] = useState(1);
  
  // Stages local states
  const [tankStatus, setTankStatus] = useState("Pending");
  const [tankPct, setTankPct] = useState(0);
  const [tankRemarks, setTankRemarks] = useState("");
  const [tankImages, setTankImages] = useState<string[]>([]);
  
  const [mmsStatus, setMmsStatus] = useState("Pending");
  const [mmsPct, setMmsPct] = useState(0);
  const [mmsRemarks, setMmsRemarks] = useState("");
  const [mmsImages, setMmsImages] = useState<string[]>([]);
  
  const [collStatus, setCollStatus] = useState("Pending");
  const [collPct, setCollPct] = useState(0);
  const [collRemarks, setCollRemarks] = useState("");
  const [collImages, setCollImages] = useState<string[]>([]);
  
  const [plumbStatus, setPlumbStatus] = useState("Pending");
  const [plumbPct, setPlumbPct] = useState(0);
  const [plumbRemarks, setPlumbRemarks] = useState("");
  const [plumbImages, setPlumbImages] = useState<string[]>([]);

  interface PendingFile {
    file: File;
    previewUrl: string;
  }

  const [pendingTankFiles, setPendingTankFiles] = useState<PendingFile[]>([]);
  const [pendingMmsFiles, setPendingMmsFiles] = useState<PendingFile[]>([]);
  const [pendingCollFiles, setPendingCollFiles] = useState<PendingFile[]>([]);
  const [pendingPlumbFiles, setPendingPlumbFiles] = useState<PendingFile[]>([]);

  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // File dropzone references
  const tankFileRef = useRef<HTMLInputElement>(null);
  const mmsFileRef = useRef<HTMLInputElement>(null);
  const collFileRef = useRef<HTMLInputElement>(null);
  const plumbFileRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchInstallationDetails();
  }, [id, router]);

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
      typeof dbImagesField[0] === 'object' && 
      dbImagesField[0] !== null &&
      'system_no' in dbImagesField[0];

    if (isMultiSystemFormat) {
      loadedSystems = [...dbImagesField];
    } else {
      // Legacy format: array of string URLs
      loadedSystems = [
        {
          system_no: 1,
          status: overallStatus || "Pending",
          remarks: overallRemarks || "",
          images: Array.isArray(dbImagesField) ? dbImagesField : []
        }
      ];
    }

    // Pad if less
    while (loadedSystems.length < requiredCount) {
      loadedSystems.push({
        system_no: loadedSystems.length + 1,
        status: "Pending",
        remarks: "",
        images: []
      });
    }

    return loadedSystems.slice(0, requiredCount);
  };

  const fetchInstallationDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/installations?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        // Find installation by ID (which handles virtual and real records seamlessly)
        let found = (data.data || []).find((x: Installation) => x.id === id);
        
        // If not found directly, it might be a virtual ID mapping or raw school ID
        if (!found) {
          found = (data.data || []).find((x: Installation) => x.school_id === id);
        }

        if (found) {
          setInst(found);
          
          const systemCount = Math.max(1, found.schools?.no_of_systems || 1);
          const tCount = systemCount;
          const mCount = systemCount;
          const cCount = systemCount;
          const pCount = systemCount;

          const parsedT = parseSystems(found.tank_images, found.tank_status, found.tank_remarks, tCount);
          const parsedM = parseSystems(found.mms_images, found.mms_status, found.mms_remarks, mCount);
          const parsedC = parseSystems(found.collectors_images, found.collectors_status, found.collectors_remarks, cCount);
          const parsedP = parseSystems(found.plumbing_images, found.plumbing_status, found.plumbing_remarks, pCount);

          setTankSystems(parsedT);
          setMmsSystems(parsedM);
          setCollSystems(parsedC);
          setPlumbSystems(parsedP);

          // We are starting at activeSystem = 1, so load System 1's values
          setTankStatus(parsedT[0].status);
          setTankPct(parsedT[0].status === "Completed" ? 25 : 0);
          setTankRemarks(parsedT[0].remarks);
          setTankImages(parsedT[0].images);

          setMmsStatus(parsedM[0].status);
          setMmsPct(parsedM[0].status === "Completed" ? 50 : 0);
          setMmsRemarks(parsedM[0].remarks);
          setMmsImages(parsedM[0].images);

          setCollStatus(parsedC[0].status);
          setCollPct(parsedC[0].status === "Completed" ? 75 : 0);
          setCollRemarks(parsedC[0].remarks);
          setCollImages(parsedC[0].images);

          setPlumbStatus(parsedP[0].status);
          setPlumbPct(parsedP[0].status === "Completed" ? 100 : 0);
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
    // 1. Sync current active system values to arrays
    const updatedTank = [...tankSystems];
    if (activeSystem <= updatedTank.length) {
      updatedTank[activeSystem - 1] = {
        system_no: activeSystem,
        status: tankStatus,
        remarks: tankRemarks,
        images: tankImages
      };
      setTankSystems(updatedTank);
    }

    const updatedMms = [...mmsSystems];
    if (activeSystem <= updatedMms.length) {
      updatedMms[activeSystem - 1] = {
        system_no: activeSystem,
        status: mmsStatus,
        remarks: mmsRemarks,
        images: mmsImages
      };
      setMmsSystems(updatedMms);
    }

    const updatedColl = [...collSystems];
    if (activeSystem <= updatedColl.length) {
      updatedColl[activeSystem - 1] = {
        system_no: activeSystem,
        status: collStatus,
        remarks: collRemarks,
        images: collImages
      };
      setCollSystems(updatedColl);
    }

    const updatedPlumb = [...plumbSystems];
    if (activeSystem <= updatedPlumb.length) {
      updatedPlumb[activeSystem - 1] = {
        system_no: activeSystem,
        status: plumbStatus,
        remarks: plumbRemarks,
        images: plumbImages
      };
      setPlumbSystems(updatedPlumb);
    }

    // 2. Load target system values into active state (if within bounds)
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

    // Clear pending files for all stages to prevent carryover
    setPendingTankFiles([]);
    setPendingMmsFiles([]);
    setPendingCollFiles([]);
    setPendingPlumbFiles([]);
  };

  // Helper check if a specific system is read-only locked
  const isTankLocked = tankStatus === "Completed" && tankImages.length > 0;
  const isMmsLocked = mmsStatus === "Completed" && mmsImages.length > 0;
  const isCollLocked = collStatus === "Completed" && collImages.length > 0;
  const isPlumbLocked = plumbStatus === "Completed" && plumbImages.length > 0;

  // Checklist milestones (overall stage is completed)
  const isTankStageCompleted = inst?.tank_status === "Completed";
  const isMmsStageCompleted = inst?.mms_status === "Completed";
  const isCollStageCompleted = inst?.collectors_status === "Completed";
  const isPlumbStageCompleted = inst?.plumbing_status === "Completed";

  let calculatedProgress = 0;
  if (inst?.plumbing_status === "Completed") calculatedProgress = 100;
  else if (inst?.collectors_status === "Completed") calculatedProgress = 75;
  else if (inst?.mms_status === "Completed") calculatedProgress = 50;
  else if (inst?.tank_status === "Completed") calculatedProgress = 25;

  const systemCount = inst ? Math.max(1, inst.schools?.no_of_systems || 1) : 1;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: "tank" | "mms" | "collectors" | "plumbing") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!inst) return;

    try {
      setUploadingSection(section);

      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp"
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

      const newPending = compressedFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));

      if (section === "tank") setPendingTankFiles(prev => [...prev, ...newPending]);
      if (section === "mms") setPendingMmsFiles(prev => [...prev, ...newPending]);
      if (section === "collectors") setPendingCollFiles(prev => [...prev, ...newPending]);
      if (section === "plumbing") setPendingPlumbFiles(prev => [...prev, ...newPending]);

      showToast("success", `Added ${compressedFiles.length} images to pending list (will be saved when you click Save Stage Progress).`);
    } catch (err: any) {
      showToast("error", err.message || "Failed to process images.");
    } finally {
      setUploadingSection(null);
      e.target.value = "";
    }
  };

  const handleDeleteImage = (indexToDelete: number, section: "tank" | "mms" | "collectors" | "plumbing") => {
    if (section === "tank") setTankImages(prev => prev.filter((_, idx) => idx !== indexToDelete));
    if (section === "mms") setMmsImages(prev => prev.filter((_, idx) => idx !== indexToDelete));
    if (section === "collectors") setCollImages(prev => prev.filter((_, idx) => idx !== indexToDelete));
    if (section === "plumbing") setPlumbImages(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const getLatestSystemsWithImages = (section: "tank" | "mms" | "collectors" | "plumbing", images: string[]): SystemState[] => {
    if (section === "tank") {
      const arr = [...tankSystems];
      if (activeSystem <= arr.length) {
        arr[activeSystem - 1] = {
          system_no: activeSystem,
          status: tankStatus,
          remarks: tankRemarks,
          images: images
        };
      }
      return arr;
    }
    if (section === "mms") {
      const arr = [...mmsSystems];
      if (activeSystem <= arr.length) {
        arr[activeSystem - 1] = {
          system_no: activeSystem,
          status: mmsStatus,
          remarks: mmsRemarks,
          images: images
        };
      }
      return arr;
    }
    if (section === "collectors") {
      const arr = [...collSystems];
      if (activeSystem <= arr.length) {
        arr[activeSystem - 1] = {
          system_no: activeSystem,
          status: collStatus,
          remarks: collRemarks,
          images: images
        };
      }
      return arr;
    }
    if (section === "plumbing") {
      const arr = [...plumbSystems];
      if (activeSystem <= arr.length) {
        arr[activeSystem - 1] = {
          system_no: activeSystem,
          status: plumbStatus,
          remarks: plumbRemarks,
          images: images
        };
      }
      return arr;
    }
    return [];
  };

  const getModuleOverallStatus = (systems: SystemState[]) => {
    if (systems.length === 0) return "Pending";
    if (systems.every(s => s.status === "Completed")) return "Completed";
    if (systems.every(s => s.status === "Pending")) return "Pending";
    if (systems.some(s => s.status === "Suspended")) return "Suspended";
    return "In Progress";
  };

  const saveStageProgress = async (section: "tank" | "mms" | "collectors" | "plumbing") => {
    if (!inst) return;

    try {
      setSavingSection(section);

      // 1. Upload any pending offline files first
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

        for (const pf of pending) {
          formData.append("files", pf.file);
        }

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
          throw new Error(uploadData.error || "Failed to upload pending images during save.");
        }

        newlyUploadedUrls = uploadData.urls || [];
      }

      // 2. Compute final images list
      let currentImages: string[] = [];
      if (section === "tank") currentImages = [...tankImages, ...newlyUploadedUrls];
      else if (section === "mms") currentImages = [...mmsImages, ...newlyUploadedUrls];
      else if (section === "collectors") currentImages = [...collImages, ...newlyUploadedUrls];
      else if (section === "plumbing") currentImages = [...plumbImages, ...newlyUploadedUrls];

      // Sync local image states
      if (section === "tank") setTankImages(currentImages);
      else if (section === "mms") setMmsImages(currentImages);
      else if (section === "collectors") setCollImages(currentImages);
      else if (section === "plumbing") setPlumbImages(currentImages);

      const latestSystems = getLatestSystemsWithImages(section, currentImages);
      const nextOverallStatus = getModuleOverallStatus(latestSystems);

      // Update local array states
      if (section === "tank") setTankSystems(latestSystems);
      if (section === "mms") setMmsSystems(latestSystems);
      if (section === "collectors") setCollSystems(latestSystems);
      if (section === "plumbing") setPlumbSystems(latestSystems);

      // Build specific updates for this stage only
      const stageUpdates: any = {
        id: inst.id
      };

      if (section === "tank") {
        stageUpdates.tank_status = nextOverallStatus;
        stageUpdates.tank_percentage = nextOverallStatus === "Completed" ? 25 : 0;
        stageUpdates.tank_remarks = latestSystems.map(s => `System ${s.system_no}: ${s.remarks}`).join(" | ");
        stageUpdates.tank_images = latestSystems;
        stageUpdates.tank_updated_at = new Date().toISOString();
      } else if (section === "mms") {
        stageUpdates.mms_status = nextOverallStatus;
        stageUpdates.mms_percentage = nextOverallStatus === "Completed" ? 50 : 0;
        stageUpdates.mms_remarks = latestSystems.map(s => `System ${s.system_no}: ${s.remarks}`).join(" | ");
        stageUpdates.mms_images = latestSystems;
        stageUpdates.mms_updated_at = new Date().toISOString();
      } else if (section === "collectors") {
        stageUpdates.collectors_status = nextOverallStatus;
        stageUpdates.collectors_percentage = nextOverallStatus === "Completed" ? 75 : 0;
        stageUpdates.collectors_remarks = latestSystems.map(s => `System ${s.system_no}: ${s.remarks}`).join(" | ");
        stageUpdates.collectors_images = latestSystems;
        stageUpdates.collectors_updated_at = new Date().toISOString();
      } else if (section === "plumbing") {
        stageUpdates.plumbing_status = nextOverallStatus;
        stageUpdates.plumbing_percentage = nextOverallStatus === "Completed" ? 100 : 0;
        stageUpdates.plumbing_remarks = latestSystems.map(s => `System ${s.system_no}: ${s.remarks}`).join(" | ");
        stageUpdates.plumbing_images = latestSystems;
        stageUpdates.plumbing_updated_at = new Date().toISOString();
      }

      // Check overall progress impact sequentially
      let nextTankCompleted = section === "tank" ? nextOverallStatus === "Completed" : tankSystems.every(s => s.status === "Completed");
      let nextMmsCompleted = section === "mms" ? nextOverallStatus === "Completed" : mmsSystems.every(s => s.status === "Completed");
      let nextCollCompleted = section === "collectors" ? nextOverallStatus === "Completed" : collSystems.every(s => s.status === "Completed");
      let nextPlumbCompleted = section === "plumbing" ? nextOverallStatus === "Completed" : plumbSystems.every(s => s.status === "Completed");

      let nextOverallPct = 0;
      if (nextPlumbCompleted) nextOverallPct = 100;
      else if (nextCollCompleted) nextOverallPct = 75;
      else if (nextMmsCompleted) nextOverallPct = 50;
      else if (nextTankCompleted) nextOverallPct = 25;

      stageUpdates.overall_percentage = nextOverallPct;

      if (nextOverallPct === 100) {
        stageUpdates.overall_status = "Completed";
        stageUpdates.completed_at = new Date().toISOString();
      } else if (nextOverallPct > 0) {
        stageUpdates.overall_status = "In Progress";
        stageUpdates.started_at = inst.started_at || new Date().toISOString();
      } else {
        const anyInProgress = 
          (section === "tank" ? nextOverallStatus === "In Progress" : tankSystems.some(s => s.status === "In Progress")) ||
          (section === "mms" ? nextOverallStatus === "In Progress" : mmsSystems.some(s => s.status === "In Progress")) ||
          (section === "collectors" ? nextOverallStatus === "In Progress" : collSystems.some(s => s.status === "In Progress")) ||
          (section === "plumbing" ? nextOverallStatus === "In Progress" : plumbSystems.some(s => s.status === "In Progress"));
        stageUpdates.overall_status = anyInProgress ? "In Progress" : "Pending";
      }

      const res = await fetch("/api/installations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stageUpdates)
      });
      const data = await res.json();

      if (data.success) {
        // Clear pending states
        if (section === "tank") setPendingTankFiles([]);
        else if (section === "mms") setPendingMmsFiles([]);
        else if (section === "collectors") setPendingCollFiles([]);
        else if (section === "plumbing") setPendingPlumbFiles([]);

        showToast("success", `${section.toUpperCase()} stage progression saved!`);
        router.refresh();
        // If dynamic ID was updated due to first save of virtual, redirect to real ID
        if (inst.id.startsWith("virtual_inst_") && data.data?.id) {
          router.replace(`/installations/${data.data.id}`);
        } else {
          // Re-sync local states with updated data
          setInst(prev => prev ? { ...prev, ...data.data } : null);
        }
      } else {
        showToast("error", data.error || `Failed to save ${section} status.`);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to update record details.");
    } finally {
      setSavingSection(null);
    }
  };

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

  const renderImageGallery = (
    savedImages: string[],
    pendingFiles: PendingFile[],
    isLocked: boolean,
    section: "tank" | "mms" | "collectors" | "plumbing"
  ) => {
    const allImages = [
      ...savedImages.map((url, idx) => ({ url, isPending: false, index: idx })),
      ...pendingFiles.map((pf, idx) => ({ url: pf.previewUrl, isPending: true, index: idx }))
    ];

    if (allImages.length === 0) {
      return (
        <span className="text-[9px] font-bold text-slate-400 uppercase my-auto mx-auto select-none">
          No verification images uploaded
        </span>
      );
    }

    return allImages.map((item, idx) => (
      <div key={idx} className="relative group/img w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0">
        <img src={item.url} alt={section} className="w-full h-full object-cover" />
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity"
        >
          <Eye className="w-3.5 h-3.5" />
        </a>
        {!isLocked && (
          <button
            type="button"
            onClick={() => {
              if (item.isPending) {
                if (section === "tank") {
                  setPendingTankFiles(prev => prev.filter((_, i) => i !== item.index));
                } else if (section === "mms") {
                  setPendingMmsFiles(prev => prev.filter((_, i) => i !== item.index));
                } else if (section === "collectors") {
                  setPendingCollFiles(prev => prev.filter((_, i) => i !== item.index));
                } else if (section === "plumbing") {
                  setPendingPlumbFiles(prev => prev.filter((_, i) => i !== item.index));
                }
              } else {
                handleDeleteImage(item.index, section);
              }
            }}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-655 focus:outline-none cursor-pointer"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    ));
  };

  return (
    <div className={`h-screen w-full bg-[#f8fafc] flex overflow-hidden ${dmSans.className}`}>
      {/* ── SIDEBAR ── */}
      <SessionNavBar />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <SharedHeader />

        {/* Dynamic Toast Feedback */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[99999] px-4.5 py-3 rounded-xl border shadow-xl flex items-center gap-2.5 animate-slideIn ${
            toast.type === "success" ? "bg-emerald-50 border-emerald-250 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="text-xs font-bold uppercase tracking-wide">{toast.message}</span>
          </div>
        )}

        {/* Scrollable details container */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Breadcrumbs Navigation + Global System Switcher */}
          <div className="sticky top-0 z-20 -mx-6 px-6 py-3.5 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between shrink-0 select-none transition-all">
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  router.refresh();
                  router.push("/installations");
                }}
                className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-450 hover:text-emerald-750 uppercase tracking-widest transition-colors cursor-pointer group shrink-0"
              >
                <ChevronLeft className="w-4.5 h-4.5 transform group-hover:-translate-x-0.5 transition-transform text-slate-400 group-hover:text-emerald-600" />
                Back to Installations
              </button>

              {/* DYNAMIC SYSTEM SWITCHER TABS */}
              {!loading && inst && (() => {
                const maxSystems = Math.max(1, inst.schools?.no_of_systems || 1);

                if (maxSystems <= 1) return null;

                return (
                  <div className="flex bg-slate-150 p-1 rounded-xl border border-slate-250/50 shadow-inner">
                    {Array.from({ length: maxSystems }).map((_, idx) => {
                      const sysNo = idx + 1;
                      const isActive = activeSystem === sysNo;
                      return (
                        <button
                          key={sysNo}
                          onClick={() => handleSwitchSystem(sysNo)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                            isActive
                              ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80 font-extrabold"
                              : "text-slate-450 hover:text-slate-700 hover:bg-slate-200/50 font-bold"
                          }`}
                        >
                          System {sysNo}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Site ID: {inst?.id || "LOADING..."}
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
              <p className="text-xs font-black text-slate-455 uppercase tracking-widest">Retrieving site cockpit details...</p>
            </div>
          ) : !inst ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-auto shadow-sm flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-red-500 font-bold">!</div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Site details not loaded</h3>
              <p className="text-[10px] text-slate-450 uppercase font-bold leading-relaxed">
                The specified site execution record could not be loaded. Please return to the installations panel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Cockpit Dashboard & Status Progression */}
              <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-0">
                
                {/* Header Information Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col gap-4">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest bg-slate-50 border border-slate-200/50 px-2.5 py-0.5 rounded">
                        {inst.installation_code}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeStyles(inst.overall_status)}`}>
                        {inst.overall_status}
                      </span>
                    </div>

                    <h2 className="text-sm font-black text-slate-850 uppercase tracking-tight leading-tight">
                      {inst.schools?.kgbv_name || "UNKNOWN SCHOOL"} | {inst.schools?.no_of_systems ?? 0}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-350" /> {inst.schools?.district || "N/A"}{inst.schools?.pincode ? ` • ${inst.schools.pincode}` : ''}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3.5 flex flex-col gap-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Address details</span>
                    <p className="text-[10px] font-bold text-slate-600 uppercase leading-normal">
                      {inst.schools?.address || "No address supplied"}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-455 uppercase">
                      <Phone className="w-3.5 h-3.5" /> Contact: {inst.schools?.principal_name || "Principal"} ({inst.schools?.contact_number || "N/A"})
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dispatch Ref</span>
                      <span className="text-[10px] font-black text-slate-800 uppercase">{inst.materials?.material_code || "N/A"}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Capacity</span>
                      <span className="text-[10px] font-black text-emerald-800 uppercase">{inst.materials?.capacity || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Wheel & Completed Badge */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest self-start">Site Execution Level</span>

                  {/* Circular visual progress */}
                  <div className="relative w-32 h-32 flex items-center justify-center mt-1">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="stroke-slate-100"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="stroke-emerald-600 transition-all duration-700"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 52}
                        strokeDashoffset={2 * Math.PI * 52 * (1 - calculatedProgress / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-800 leading-none">{calculatedProgress}%</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Overall</span>
                    </div>
                  </div>

                  {/* Completion Animation Badge overlay */}
                  {calculatedProgress === 100 && (
                    <div className="mt-2 w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col items-center gap-1 animate-fadeIn relative overflow-hidden group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-emerald-400/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-center gap-1.5 text-emerald-800 font-black text-[10px] uppercase tracking-wider">
                        <Sparkles className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                        Fully Completed Site
                      </div>
                      <span className="relative text-[8.5px] font-bold text-emerald-600 uppercase tracking-wide">
                        Closed Date: {inst.completed_at ? new Date(inst.completed_at).toLocaleDateString() : new Date().toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="w-full border-t border-slate-100 pt-4 flex flex-col gap-2.5 text-left text-[9px] font-black text-slate-455 uppercase tracking-wide select-none">
                    <div className="flex justify-between items-center">
                      <span>Timeline Started:</span>
                      <span className="text-slate-655 font-bold">{inst.started_at ? new Date(inst.started_at).toLocaleDateString() : "Pending"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Timeline Closed:</span>
                      <span className="text-slate-655 font-bold">{inst.completed_at ? new Date(inst.completed_at).toLocaleDateString() : "Pending"}</span>
                    </div>
                  </div>
                </div>

                {/* Left Side Checklist indicator */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                    Milestones Checklist
                  </span>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isTankStageCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"}`}>
                        {isTankStageCompleted && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isTankStageCompleted ? "text-slate-500 line-through" : "text-slate-700"}`}>
                        Tank Installation stage
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isMmsStageCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"}`}>
                        {isMmsStageCompleted && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isMmsStageCompleted ? "text-slate-500 line-through" : "text-slate-700"}`}>
                        MMS structure setup stage
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isCollStageCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"}`}>
                        {isCollStageCompleted && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isCollStageCompleted ? "text-slate-500 line-through" : "text-slate-700"}`}>
                        Solar collectors setup stage
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isPlumbStageCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"}`}>
                        {isPlumbStageCompleted && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isPlumbStageCompleted ? "text-slate-500 line-through" : "text-slate-700"}`}>
                        Plumbing & Electrical stage
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="lg:col-span-8 flex flex-col gap-6">

                {/* 1. TANK WORKSPACE */}
                <div className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${
                  isTankLocked ? "border-emerald-350 bg-emerald-50/10" : "border-slate-200"
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 ${
                        isTankLocked ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-655"
                      }`}>1</span>
                      <div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          Tank Installation Stage {systemCount > 1 ? `(System ${activeSystem} of ${systemCount})` : ""}
                        </h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Execution Stage 1</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Milestone Progress Indicator */}
                      {activeSystem <= systemCount && (
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Milestone:</span>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                              tankStatus === "Completed" 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                                : tankStatus === "In Progress" 
                                ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse" 
                                : "bg-slate-50 border-slate-100 text-slate-450"
                            }`}>
                              {tankStatus === "Completed" ? "25%" : tankStatus === "In Progress" ? "Pending 25%" : "0%"}
                            </span>
                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                              <div 
                                className={`h-full transition-all duration-500 rounded-full ${
                                  tankStatus === "Completed" 
                                    ? "bg-emerald-500 w-full" 
                                    : tankStatus === "In Progress" 
                                    ? "bg-amber-500 w-1/3" 
                                    : "bg-slate-200 w-0"
                                }`} 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSystem <= systemCount && (
                        isTankLocked ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 border border-emerald-250 text-emerald-800 font-black text-[9px] uppercase tracking-wider rounded-full shadow-sm">
                            <Lock className="w-3 h-3 text-emerald-700 shrink-0" /> locked
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Status:</span>
                            <select
                              value={tankStatus}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                setTankStatus(newStatus);
                                setTankPct(newStatus === "Completed" ? 25 : 0);
                              }}
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2 text-xs font-bold text-slate-700 outline-none uppercase font-['DM_Sans'] cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {activeSystem > systemCount ? (
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-8 text-center flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-455 font-black text-sm">!</div>
                      <h4 className="text-xs font-black text-slate-550 uppercase tracking-widest">System Not Applicable</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold max-w-sm leading-relaxed">
                        This site dispatch only contains {systemCount} Tank system(s). System {activeSystem} is not required.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Remarks Input */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Stage Remarks</span>
                          {isTankLocked ? (
                            <p className="text-xs font-semibold text-slate-655 uppercase italic bg-emerald-50/20 p-3 rounded-xl border border-emerald-100 min-h-[70px]">
                              {tankRemarks || "No stage remarks entered."}
                            </p>
                          ) : (
                            <textarea
                              value={tankRemarks}
                              onChange={(e) => setTankRemarks(e.target.value)}
                              placeholder="Enter tank component structure status progress remarks..."
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-semibold text-slate-750 focus:ring-2 focus:ring-emerald-500/10 outline-none min-h-[70px] uppercase placeholder:text-slate-455"
                            />
                          )}
                        </div>

                        {/* Image dropzone */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Verification Images</span>
                            {!isTankLocked && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => tankFileRef.current?.click()}
                                  disabled={uploadingSection === "tank"}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {uploadingSection === "tank" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                                  Upload Image
                                </button>
                                <input
                                  type="file"
                                  ref={tankFileRef}
                                  onChange={(e) => handleImageUpload(e, "tank")}
                                  className="hidden"
                                  multiple
                                  accept="image/*"
                                />
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 min-h-[70px]">
                             {renderImageGallery(tankImages, pendingTankFiles, isTankLocked, "tank")}
                           </div>
                        </div>
                      </div>

                      {!isTankLocked && (
                        <div className="border-t border-slate-100 pt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => saveStageProgress("tank")}
                            disabled={savingSection === "tank"}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {savingSection === "tank" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save Stage 1 Progress
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 2. MMS WORKSPACE */}
                <div className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${
                  isMmsLocked ? "border-emerald-350 bg-emerald-50/10" : "border-slate-200"
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 ${
                        isMmsLocked ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-655"
                      }`}>2</span>
                      <div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          MMS Structure Installation Stage {systemCount > 1 ? `(System ${activeSystem} of ${systemCount})` : ""}
                        </h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Execution Stage 2</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Milestone Progress Indicator */}
                      {activeSystem <= systemCount && (
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Milestone:</span>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                              mmsStatus === "Completed" 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                                : mmsStatus === "In Progress" 
                                ? "bg-amber-50 border-amber-250 text-amber-700 animate-pulse" 
                                : "bg-slate-50 border-slate-100 text-slate-450"
                            }`}>
                              {mmsStatus === "Completed" ? "50%" : mmsStatus === "In Progress" ? "Pending 50%" : "0%"}
                            </span>
                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                              <div 
                                className={`h-full transition-all duration-500 rounded-full ${
                                  mmsStatus === "Completed" 
                                    ? "bg-emerald-500 w-full" 
                                    : mmsStatus === "In Progress" 
                                    ? "bg-amber-500 w-1/3" 
                                    : "bg-slate-200 w-0"
                                }`} 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSystem <= systemCount && (
                        isMmsLocked ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 border border-emerald-250 text-emerald-855 font-black text-[9px] uppercase tracking-wider rounded-full shadow-sm">
                            <Lock className="w-3 h-3 text-emerald-700 shrink-0" /> locked
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Status:</span>
                            <select
                              value={mmsStatus}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                setMmsStatus(newStatus);
                                setMmsPct(newStatus === "Completed" ? 50 : 0);
                              }}
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2 text-xs font-bold text-slate-700 outline-none uppercase font-['DM_Sans'] cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {activeSystem > systemCount ? (
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-8 text-center flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-455 font-black text-sm">!</div>
                      <h4 className="text-xs font-black text-slate-550 uppercase tracking-widest">System Not Applicable</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold max-w-sm leading-relaxed">
                        This site dispatch only contains {systemCount} MMS system(s). System {activeSystem} is not required.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Remarks Input */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Stage Remarks</span>
                          {isMmsLocked ? (
                            <p className="text-xs font-semibold text-slate-655 uppercase italic bg-emerald-50/20 p-3 rounded-xl border border-emerald-100 min-h-[70px]">
                              {mmsRemarks || "No stage remarks entered."}
                            </p>
                          ) : (
                            <textarea
                              value={mmsRemarks}
                              onChange={(e) => setMmsRemarks(e.target.value)}
                              placeholder="Enter module mounting structures status progress remarks..."
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-semibold text-slate-750 focus:ring-2 focus:ring-emerald-500/10 outline-none min-h-[70px] uppercase placeholder:text-slate-455"
                            />
                          )}
                        </div>

                        {/* Image dropzone */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Verification Images</span>
                            {!isMmsLocked && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => mmsFileRef.current?.click()}
                                  disabled={uploadingSection === "mms"}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {uploadingSection === "mms" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3 h-3" />}
                                  Upload Image
                                </button>
                                <input
                                  type="file"
                                  ref={mmsFileRef}
                                  onChange={(e) => handleImageUpload(e, "mms")}
                                  className="hidden"
                                  multiple
                                  accept="image/*"
                                />
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 min-h-[70px]">
                             {renderImageGallery(mmsImages, pendingMmsFiles, isMmsLocked, "mms")}
                           </div>
                        </div>
                      </div>

                      {!isMmsLocked && (
                        <div className="border-t border-slate-100 pt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => saveStageProgress("mms")}
                            disabled={savingSection === "mms"}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {savingSection === "mms" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save Stage 2 Progress
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 3. COLLECTORS WORKSPACE */}
                <div className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${
                  isCollLocked ? "border-emerald-350 bg-emerald-50/10" : "border-slate-200"
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 ${
                        isCollLocked ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-655"
                      }`}>3</span>
                      <div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          Solar Collectors Installation Stage {systemCount > 1 ? `(System ${activeSystem} of ${systemCount})` : ""}
                        </h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Execution Stage 3</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Milestone Progress Indicator */}
                      {activeSystem <= systemCount && (
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Milestone:</span>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                              collStatus === "Completed" 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                                : collStatus === "In Progress" 
                                ? "bg-amber-50 border-amber-250 text-amber-700 animate-pulse" 
                                : "bg-slate-50 border-slate-100 text-slate-450"
                            }`}>
                              {collStatus === "Completed" ? "75%" : collStatus === "In Progress" ? "Pending 75%" : "0%"}
                            </span>
                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                              <div 
                                className={`h-full transition-all duration-500 rounded-full ${
                                  collStatus === "Completed" 
                                    ? "bg-emerald-500 w-full" 
                                    : collStatus === "In Progress" 
                                    ? "bg-amber-500 w-1/3" 
                                    : "bg-slate-200 w-0"
                                }`} 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSystem <= systemCount && (
                        isCollLocked ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 border border-emerald-250 text-emerald-855 font-black text-[9px] uppercase tracking-wider rounded-full shadow-sm">
                            <Lock className="w-3 h-3 text-emerald-700 shrink-0" /> locked
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Status:</span>
                            <select
                              value={collStatus}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                setCollStatus(newStatus);
                                setCollPct(newStatus === "Completed" ? 75 : 0);
                              }}
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2 text-xs font-bold text-slate-700 outline-none uppercase font-['DM_Sans'] cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {activeSystem > systemCount ? (
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-8 text-center flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-455 font-black text-sm">!</div>
                      <h4 className="text-xs font-black text-slate-550 uppercase tracking-widest">System Not Applicable</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold max-w-sm leading-relaxed">
                        This site dispatch only contains {systemCount} Collectors system(s). System {activeSystem} is not required.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Remarks Input */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Stage Remarks</span>
                          {isCollLocked ? (
                            <p className="text-xs font-semibold text-slate-655 uppercase italic bg-emerald-50/20 p-3 rounded-xl border border-emerald-100 min-h-[70px]">
                              {collRemarks || "No stage remarks entered."}
                            </p>
                          ) : (
                            <textarea
                              value={collRemarks}
                              onChange={(e) => setCollRemarks(e.target.value)}
                              placeholder="Enter collector plate mounting structures progress remarks..."
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-semibold text-slate-750 focus:ring-2 focus:ring-emerald-500/10 outline-none min-h-[70px] uppercase placeholder:text-slate-455"
                            />
                          )}
                        </div>

                        {/* Image dropzone */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Verification Images</span>
                            {!isCollLocked && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => collFileRef.current?.click()}
                                  disabled={uploadingSection === "collectors"}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {uploadingSection === "collectors" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3 h-3" />}
                                  Upload Image
                                </button>
                                <input
                                  type="file"
                                  ref={collFileRef}
                                  onChange={(e) => handleImageUpload(e, "collectors")}
                                  className="hidden"
                                  multiple
                                  accept="image/*"
                                />
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 min-h-[70px]">
                             {renderImageGallery(collImages, pendingCollFiles, isCollLocked, "collectors")}
                           </div>
                        </div>
                      </div>

                      {!isCollLocked && (
                        <div className="border-t border-slate-100 pt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => saveStageProgress("collectors")}
                            disabled={savingSection === "collectors"}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {savingSection === "collectors" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save Stage 3 Progress
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 4. PLUMBING WORKSPACE */}
                <div className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${
                  isPlumbLocked ? "border-emerald-350 bg-emerald-50/10" : "border-slate-200"
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 ${
                        isPlumbLocked ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-655"
                      }`}>4</span>
                      <div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          Plumbing & Electrical Routing Stage {systemCount > 1 ? `(System ${activeSystem} of ${systemCount})` : ""}
                        </h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Execution Stage 4</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Milestone Progress Indicator */}
                      {activeSystem <= systemCount && (
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Milestone:</span>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                              plumbStatus === "Completed" 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                                : plumbStatus === "In Progress" 
                                ? "bg-amber-50 border-amber-250 text-amber-700 animate-pulse" 
                                : "bg-slate-50 border-slate-100 text-slate-450"
                            }`}>
                              {plumbStatus === "Completed" ? "100%" : plumbStatus === "In Progress" ? "Pending 100%" : "0%"}
                            </span>
                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                              <div 
                                className={`h-full transition-all duration-500 rounded-full ${
                                  plumbStatus === "Completed" 
                                    ? "bg-emerald-500 w-full" 
                                    : plumbStatus === "In Progress" 
                                    ? "bg-amber-500 w-1/3" 
                                    : "bg-slate-200 w-0"
                                }`} 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSystem <= systemCount && (
                        isPlumbLocked ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 border border-emerald-250 text-emerald-850 font-black text-[9px] uppercase tracking-wider rounded-full shadow-sm">
                            <Lock className="w-3 h-3 text-emerald-700 shrink-0" /> locked
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Status:</span>
                            <select
                              value={plumbStatus}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                setPlumbStatus(newStatus);
                                setPlumbPct(newStatus === "Completed" ? 100 : 0);
                              }}
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2 text-xs font-bold text-slate-700 outline-none uppercase font-['DM_Sans'] cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {activeSystem > systemCount ? (
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-8 text-center flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-455 font-black text-sm">!</div>
                      <h4 className="text-xs font-black text-slate-550 uppercase tracking-widest">System Not Applicable</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold max-w-sm leading-relaxed">
                        This site dispatch only contains {systemCount} Plumbing system(s). System {activeSystem} is not required.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Remarks Input */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Stage Remarks</span>
                          {isPlumbLocked ? (
                            <p className="text-xs font-semibold text-slate-655 uppercase italic bg-emerald-50/20 p-3 rounded-xl border border-emerald-100 min-h-[70px]">
                              {plumbRemarks || "No stage remarks entered."}
                            </p>
                          ) : (
                            <textarea
                              value={plumbRemarks}
                              onChange={(e) => setPlumbRemarks(e.target.value)}
                              placeholder="Enter pipe connections and electrical routing progress remarks..."
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-semibold text-slate-750 focus:ring-2 focus:ring-emerald-500/10 outline-none min-h-[70px] uppercase placeholder:text-slate-455"
                            />
                          )}
                        </div>

                        {/* Image dropzone */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Verification Images</span>
                            {!isPlumbLocked && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => plumbFileRef.current?.click()}
                                  disabled={uploadingSection === "plumbing"}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {uploadingSection === "plumbing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                  Upload Image
                                </button>
                                <input
                                  type="file"
                                  ref={plumbFileRef}
                                  onChange={(e) => handleImageUpload(e, "plumbing")}
                                  className="hidden"
                                  multiple
                                  accept="image/*"
                                />
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 min-h-[70px]">
                             {renderImageGallery(plumbImages, pendingPlumbFiles, isPlumbLocked, "plumbing")}
                           </div>
                        </div>
                      </div>

                      {!isPlumbLocked && (
                        <div className="border-t border-slate-100 pt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => saveStageProgress("plumbing")}
                            disabled={savingSection === "plumbing"}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {savingSection === "plumbing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save Stage 4 Progress
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
