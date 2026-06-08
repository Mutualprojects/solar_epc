"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SessionNavBar } from "@/components/ui/sidebar";
import { SharedHeader } from "@/components/ui/header";
import { DM_Sans } from "next/font/google";
import {
  Database,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  Filter,
  RefreshCw,
  CreditCard,
  ShoppingBag,
  Layers,
  FileSpreadsheet,
  TrendingUp,
  UserCheck,
  ExternalLink,
  Calendar,
  ChevronRight,
  X,
  Info,
  Hash,
  Briefcase,
  User,
  Activity,
  Package,
  Wrench
} from "lucide-react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

type TabType = "po" | "pi" | "so" | "si" | "expense" | "timesheet";

export default function ErpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isViewer, setIsViewer] = useState<boolean | null>(null);

  // Detail Drawer States
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter States
  const [projectCode, setProjectCode] = useState("PROJ-0021");
  const [activeTab, setActiveTab] = useState<TabType>("po");
  const [searchTerm, setSearchTerm] = useState("");

  // Data State
  const [erpData, setErpData] = useState<any>({
    purchaseOrders: [],
    purchaseInvoices: [],
    expenseClaims: [],
    salesOrders: [],
    salesInvoices: [],
    timesheets: []
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const userRole = (parsedUser?.roles?.role_name || parsedUser?.role || "").toLowerCase().trim();
    if (userRole === "viewer") {
      setIsViewer(true);
      fetchErpData(projectCode);
    } else {
      setIsViewer(false);
      setLoading(false);
    }
  }, [router]);

  const fetchErpData = async (project: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorMsg(null);

      const response = await fetch(`/api/erp?project=${encodeURIComponent(project)}`);
      const result = await response.json();

      if (result.success) {
        setErpData(result.data);
      } else {
        setErrorMsg(result.error || "Failed to load ERP Integration data.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred while connecting to the backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleProjectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectCode.trim()) {
      fetchErpData(projectCode.trim());
    }
  };

  // Calculate totals for KPI metrics
  const metrics = useMemo(() => {
    const poTotal = erpData.purchaseOrders.reduce((sum: number, po: any) => sum + (po.grand_total || 0), 0);
    const piTotal = erpData.purchaseInvoices.reduce((sum: number, pi: any) => sum + (pi.grand_total || 0), 0);
    const soTotal = erpData.salesOrders.reduce((sum: number, so: any) => sum + (so.grand_total || 0), 0);
    const siTotal = erpData.salesInvoices.reduce((sum: number, si: any) => sum + (si.grand_total || 0), 0);
    const expenseTotal = erpData.expenseClaims.reduce((sum: number, ec: any) => sum + (ec.total_claimed_amount || 0), 0);
    const totalHours = erpData.timesheets.reduce((sum: number, ts: any) => sum + (ts.total_hours || 0), 0);

    return {
      poCount: erpData.purchaseOrders.length,
      poTotal,
      piCount: erpData.purchaseInvoices.length,
      piTotal,
      soCount: erpData.salesOrders.length,
      soTotal,
      siCount: erpData.salesInvoices.length,
      siTotal,
      expenseCount: erpData.expenseClaims.length,
      expenseTotal,
      timesheetCount: erpData.timesheets.length,
      totalHours
    };
  }, [erpData]);

  // Tab Details & Count Helper
  const tabConfig = [
    { id: "po", label: "Purchase Orders", count: erpData.purchaseOrders.length, icon: ShoppingBag },
    { id: "pi", label: "Purchase Invoices", count: erpData.purchaseInvoices.length, icon: CreditCard },
    { id: "so", label: "Sales Orders", count: erpData.salesOrders.length, icon: FileText },
    { id: "si", label: "Sales Invoices", count: erpData.salesInvoices.length, icon: FileSpreadsheet },
    { id: "expense", label: "Expense Claims", count: erpData.expenseClaims.length, icon: DollarSign },
    { id: "timesheet", label: "Timesheets", count: erpData.timesheets.length, icon: Clock },
  ];

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper for Status Badge Styles
  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    let bg = "bg-slate-50 border-slate-200 text-slate-500";
    if (s.includes("approved") || s.includes("paid") || s.includes("submitted") || s.includes("completed")) {
      bg = "bg-emerald-50 border-emerald-200 text-emerald-700";
    } else if (s.includes("draft") || s.includes("pending")) {
      bg = "bg-amber-50 border-amber-200 text-amber-700";
    } else if (s.includes("cancelled") || s.includes("rejected")) {
      bg = "bg-rose-50 border-rose-200 text-rose-700";
    }
    return (
      <span className={`inline-flex px-2 py-0.5 border rounded-md text-[10px] font-black uppercase tracking-wider ${bg}`}>
        {status || "Unknown"}
      </span>
    );
  };

  // Filter Active Dataset by Search Term
  const filteredActiveData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    switch (activeTab) {
      case "po":
        return erpData.purchaseOrders.filter((po: any) =>
          (po.name || "").toLowerCase().includes(term) ||
          (po.supplier || "").toLowerCase().includes(term) ||
          (po.status || "").toLowerCase().includes(term)
        );
      case "pi":
        return erpData.purchaseInvoices.filter((pi: any) =>
          (pi.name || "").toLowerCase().includes(term) ||
          (pi.supplier || "").toLowerCase().includes(term) ||
          (pi.status || "").toLowerCase().includes(term)
        );
      case "so":
        return erpData.salesOrders.filter((so: any) =>
          (so.name || "").toLowerCase().includes(term) ||
          (so.customer || "").toLowerCase().includes(term) ||
          (so.status || "").toLowerCase().includes(term)
        );
      case "si":
        return erpData.salesInvoices.filter((si: any) =>
          (si.name || "").toLowerCase().includes(term) ||
          (si.customer || "").toLowerCase().includes(term) ||
          (si.status || "").toLowerCase().includes(term)
        );
      case "expense":
        return erpData.expenseClaims.filter((ec: any) =>
          (ec.name || "").toLowerCase().includes(term) ||
          (ec.employee_name || ec.employee || "").toLowerCase().includes(term) ||
          (ec.status || "").toLowerCase().includes(term)
        );
      case "timesheet":
        return erpData.timesheets.filter((ts: any) =>
          (ts.name || "").toLowerCase().includes(term) ||
          (ts.employee || "").toLowerCase().includes(term) ||
          (ts.status || "").toLowerCase().includes(term)
        );
      default:
        return [];
    }
  }, [activeTab, erpData, searchTerm]);
  // Unauthorized Access Page
  if (isViewer === false) {
    return (
      <div className={`h-screen w-full bg-[#f8fafc] flex overflow-hidden ${dmSans.className}`}>
        <SessionNavBar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
          <div className="max-w-md w-full text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Access Denied</h2>
            <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
              ERP Integration details are restricted only to the **Viewer** role. Please contact system administrators if you require credentials.
            </p>
            <button
              onClick={() => router.push("/dashboard/superadmin")}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
            >
              Back to Overview
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full bg-[#f8fafc] flex overflow-hidden ${dmSans.className}`}>
      {/* ── SIDEBAR ── */}
      <SessionNavBar />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <SharedHeader
          placeholder="SEARCH ERP DOCUMENTS..."
          showSearch={true}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* ── Header Controls ── */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 relative z-20">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0">
              <Database className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight uppercase leading-tight">ERP Integration Hub</h2>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Frappe Cloud Purchase & Sales Records Pipeline</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleProjectSearch} className="flex items-center gap-2 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Project Code..."
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold uppercase rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Go
              </button>
            </form>

            <button
              onClick={() => fetchErpData(projectCode, true)}
              disabled={refreshing || loading}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all disabled:opacity-50 shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Main ERP Dashboard Body ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 text-rose-700 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Synchronization Error</p>
                <p className="text-xs font-semibold mt-1 opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* ── 1. Financial Analytics Overview (Metrics) ── */}
          {!loading && (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Metric 1 */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <ShoppingBag className="w-16 h-16 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purchase Orders</span>
                <h3 className="text-lg font-black text-slate-800 mt-2 leading-none">{metrics.poCount}</h3>
                <span className="text-[10px] font-extrabold mt-1 text-emerald-600 block leading-tight">
                  Value: {formatCurrency(metrics.poTotal)}
                </span>
              </div>

              {/* Metric 2 */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <CreditCard className="w-16 h-16 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purchase Invoices</span>
                <h3 className="text-lg font-black text-slate-800 mt-2 leading-none">{metrics.piCount}</h3>
                <span className="text-[10px] font-extrabold mt-1 text-indigo-600 block leading-tight">
                  Total: {formatCurrency(metrics.piTotal)}
                </span>
              </div>

              {/* Metric 3 */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <FileText className="w-16 h-16 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sales Orders</span>
                <h3 className="text-lg font-black text-slate-800 mt-2 leading-none">{metrics.soCount}</h3>
                <span className="text-[10px] font-extrabold mt-1 text-amber-600 block leading-tight">
                  Grand Value: {formatCurrency(metrics.soTotal)}
                </span>
              </div>

              {/* Metric 4 */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <FileSpreadsheet className="w-16 h-16 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sales Invoices</span>
                <h3 className="text-lg font-black text-slate-800 mt-2 leading-none">{metrics.siCount}</h3>
                <span className="text-[10px] font-extrabold mt-1 text-teal-600 block leading-tight">
                  Value: {formatCurrency(metrics.siTotal)}
                </span>
              </div>

              {/* Metric 5 */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <DollarSign className="w-16 h-16 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expense Claims</span>
                <h3 className="text-lg font-black text-slate-800 mt-2 leading-none">{metrics.expenseCount}</h3>
                <span className="text-[10px] font-extrabold mt-1 text-rose-600 block leading-tight">
                  Value: {formatCurrency(metrics.expenseTotal)}
                </span>
              </div>

              {/* Metric 6 */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <Clock className="w-16 h-16 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timesheets</span>
                <h3 className="text-lg font-black text-slate-800 mt-2 leading-none">{metrics.timesheetCount}</h3>
                <span className="text-[10px] font-extrabold mt-1 text-violet-600 block leading-tight">
                  Hours: {metrics.totalHours} hrs
                </span>
              </div>
            </div>
          )}

          {/* ── 2. Tabs Controls ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-1 shrink-0 shadow-sm">
            {tabConfig.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-850"
                  }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? "bg-emerald-700/80 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── 3. Table / Data List View ── */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
                <p className="text-xs font-black text-slate-455 uppercase tracking-widest">Retrieving Frappe resources...</p>
              </div>
            ) : filteredActiveData.length === 0 ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <Database className="w-12 h-12 text-slate-250" />
                <p className="text-xs font-black text-slate-455 uppercase tracking-widest">No Documents Found</p>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Could not find any {tabConfig.find(t => t.id === activeTab)?.label} matching "{searchTerm || projectCode}"
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredActiveData.map((doc: any) => {
                    const statusBadge = getStatusBadge(doc.status);
                    
                    // Tab-specific details
                    let mainTitle = "";
                    let subtitleLabel = "";
                    let subtitleValue = "";
                    let dateLabel = "Date";
                    let dateValue = "";
                    let amountValue: React.ReactNode = null;
                    let DocIcon = ShoppingBag;
                    
                    if (activeTab === "po") {
                      DocIcon = ShoppingBag;
                      mainTitle = doc.name;
                      subtitleLabel = "Supplier";
                      subtitleValue = doc.supplier || "—";
                      dateLabel = "Transaction Date";
                      dateValue = doc.transaction_date || doc.creation?.split(" ")[0] || "—";
                      amountValue = (
                        <div className="text-emerald-600 font-extrabold text-sm md:text-base">
                          {formatCurrency(doc.grand_total || 0)}
                        </div>
                      );
                    } else if (activeTab === "pi") {
                      DocIcon = CreditCard;
                      mainTitle = doc.name;
                      subtitleLabel = "Supplier";
                      subtitleValue = doc.supplier || "—";
                      dateLabel = "Posting Date";
                      dateValue = doc.posting_date || doc.creation?.split(" ")[0] || "—";
                      amountValue = (
                        <div className="text-emerald-600 font-extrabold text-sm md:text-base">
                          {formatCurrency(doc.grand_total || 0)}
                        </div>
                      );
                    } else if (activeTab === "so") {
                      DocIcon = FileText;
                      mainTitle = doc.name;
                      subtitleLabel = "Customer";
                      subtitleValue = doc.customer || "—";
                      dateLabel = "Transaction Date";
                      dateValue = doc.transaction_date || doc.creation?.split(" ")[0] || "—";
                      amountValue = (
                        <div className="text-emerald-600 font-extrabold text-sm md:text-base">
                          {formatCurrency(doc.grand_total || 0)}
                        </div>
                      );
                    } else if (activeTab === "si") {
                      DocIcon = FileSpreadsheet;
                      mainTitle = doc.name;
                      subtitleLabel = "Customer";
                      subtitleValue = doc.customer || "—";
                      dateLabel = "Posting Date";
                      dateValue = doc.posting_date || doc.creation?.split(" ")[0] || "—";
                      amountValue = (
                        <div className="text-emerald-600 font-extrabold text-sm md:text-base">
                          {formatCurrency(doc.grand_total || 0)}
                        </div>
                      );
                    } else if (activeTab === "expense") {
                      DocIcon = DollarSign;
                      mainTitle = doc.name;
                      subtitleLabel = "Employee";
                      subtitleValue = doc.employee_name || doc.employee || "—";
                      dateLabel = "Posting Date";
                      dateValue = doc.posting_date || doc.creation?.split(" ")[0] || "—";
                      amountValue = (
                        <div className="text-emerald-650 font-extrabold text-sm md:text-base">
                          {formatCurrency(doc.total_claimed_amount || 0)}
                        </div>
                      );
                    } else if (activeTab === "timesheet") {
                      DocIcon = Clock;
                      mainTitle = doc.name;
                      subtitleLabel = "Employee";
                      subtitleValue = doc.employee || "—";
                      dateLabel = "Start Date";
                      dateValue = doc.start_date?.split(" ")[0] || doc.creation?.split(" ")[0] || "—";
                      amountValue = (
                        <div className="text-indigo-600 font-extrabold text-sm md:text-base">
                          {doc.total_hours || 0} hrs
                        </div>
                      );
                    }
                    
                    return (
                      <div
                        key={doc.name}
                        onClick={() => {
                          setSelectedDoc(doc);
                          setDrawerOpen(true);
                        }}
                        className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
                      >
                        {/* Soft background glow */}
                        <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-50 opacity-[0.05] group-hover:opacity-[0.1] blur-xl transition-opacity duration-300" />
                        
                        <div>
                          {/* Card Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 border border-slate-100 flex items-center justify-center transition-colors">
                                <DocIcon className="w-4.5 h-4.5" />
                              </div>
                              <span className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                {mainTitle}
                              </span>
                            </div>
                            {statusBadge}
                          </div>
                          
                          {/* Card Body */}
                          <div className="space-y-2.5 mb-5">
                            <div>
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">
                                {subtitleLabel}
                              </span>
                              <p className="text-xs font-bold text-slate-700 uppercase truncate mt-0.5">
                                {subtitleValue}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px]">
                                {dateValue}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Card Footer / Action */}
                        <div className="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between">
                          {amountValue}
                          
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setDrawerOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 rounded-lg border border-emerald-100/50 transition-all cursor-pointer"
                            >
                              Details
                            </button>
                            <a
                              href={`https://brihaspathi.m.frappe.cloud/app/${activeTab === "expense" ? "expense-claim" : activeTab === "timesheet" ? "timesheet" : activeTab === "po" ? "purchase-order" : activeTab === "pi" ? "purchase-invoice" : activeTab === "so" ? "sales-order" : "sales-invoice"}/${doc.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-7.5 h-7.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                              title="Open in ERP"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── DETAIL DRAWER (OFF-CANVAS) ── */}
      {drawerOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .animate-slideInRight {
              animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out cursor-pointer" 
              onClick={() => setDrawerOpen(false)}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-2xl transform bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full animate-slideInRight select-text">
                
                {/* Drawer Header */}
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
                      {activeTab === "po" && <ShoppingBag className="w-5 h-5" />}
                      {activeTab === "pi" && <CreditCard className="w-5 h-5" />}
                      {activeTab === "so" && <FileText className="w-5 h-5" />}
                      {activeTab === "si" && <FileSpreadsheet className="w-5 h-5" />}
                      {activeTab === "expense" && <DollarSign className="w-5 h-5" />}
                      {activeTab === "timesheet" && <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">{selectedDoc.name}</h2>
                        {getStatusBadge(selectedDoc.status)}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {tabConfig.find(t => t.id === activeTab)?.label} Details
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* General Stats / Quick Glance Card */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400" /> Summary Info
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Block */}
                      <div>
                        {activeTab === "po" || activeTab === "pi" ? (
                          <>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Supplier</span>
                            <p className="text-xs font-black text-slate-700 uppercase mt-0.5 truncate">{selectedDoc.supplier || "—"}</p>
                          </>
                        ) : activeTab === "so" || activeTab === "si" ? (
                          <>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Customer</span>
                            <p className="text-xs font-black text-slate-700 uppercase mt-0.5 truncate">{selectedDoc.customer || "—"}</p>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Employee</span>
                            <p className="text-xs font-black text-slate-700 uppercase mt-0.5 truncate">{selectedDoc.employee_name || selectedDoc.employee || "—"}</p>
                          </>
                        )}
                      </div>

                      {/* Right Block */}
                      <div>
                        {selectedDoc.grand_total !== undefined || selectedDoc.total_claimed_amount !== undefined ? (
                          <>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Value Amount</span>
                            <p className="text-sm font-black text-emerald-600 mt-0.5">
                              {formatCurrency(selectedDoc.grand_total ?? selectedDoc.total_claimed_amount ?? 0)}
                            </p>
                          </>
                        ) : selectedDoc.total_hours !== undefined ? (
                          <>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Duration</span>
                            <p className="text-sm font-black text-indigo-600 mt-0.5">{selectedDoc.total_hours} Hours</p>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Project</span>
                            <p className="text-xs font-black text-slate-700 uppercase mt-0.5">{selectedDoc.project || "—"}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Complete Document Fields */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Document Details</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {/* Dynamic Human-readable Key-Values */}
                      {Object.entries(selectedDoc).map(([key, val]: [string, any]) => {
                        // Skip nested tables/arrays and long internal fields
                        if (typeof val === "object" || Array.isArray(val) || key.startsWith("_") || !val) return null;
                        
                        // Human-friendly titles
                        const cleanKey = key.replace(/_/g, " ").toUpperCase();
                        
                        return (
                          <div key={key} className="border-b border-slate-100 pb-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{cleanKey}</span>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5 break-words">
                              {typeof val === "number" && (key.includes("total") || key.includes("amount") || key.includes("rate"))
                                ? formatCurrency(val)
                                : String(val)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Embedded line items or logs if present */}
                  {selectedDoc.items && Array.isArray(selectedDoc.items) && selectedDoc.items.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                        Line Items ({selectedDoc.items.length})
                      </h3>
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4">Item Details</th>
                              <th className="py-2.5 px-4 text-center">Qty</th>
                              <th className="py-2.5 px-4 text-right">Rate</th>
                              <th className="py-2.5 px-4 text-right pr-4">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="text-[11px] font-bold text-slate-600 divide-y divide-slate-100">
                            {selectedDoc.items.map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4">
                                  <p className="font-extrabold text-slate-800">{item.item_code}</p>
                                  {item.item_name && <p className="text-[9px] text-slate-400 mt-0.5">{item.item_name}</p>}
                                </td>
                                <td className="py-2.5 px-4 text-center">{item.qty} {item.uom || ""}</td>
                                <td className="py-2.5 px-4 text-right">{formatCurrency(item.rate || 0)}</td>
                                <td className="py-2.5 px-4 text-right pr-4 text-emerald-600 font-extrabold">{formatCurrency(item.amount || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedDoc.expenses && Array.isArray(selectedDoc.expenses) && selectedDoc.expenses.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                        Expenses ({selectedDoc.expenses.length})
                      </h3>
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4">Type</th>
                              <th className="py-2.5 px-4">Description</th>
                              <th className="py-2.5 px-4 text-right pr-4">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="text-[11px] font-bold text-slate-600 divide-y divide-slate-100">
                            {selectedDoc.expenses.map((expense: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4 font-extrabold text-slate-800 uppercase">{expense.expense_type?.replace(/-/g, " ")}</td>
                                <td className="py-2.5 px-4 text-slate-400 font-medium">{expense.description || "—"}</td>
                                <td className="py-2.5 px-4 text-right pr-4 text-rose-600 font-extrabold">{formatCurrency(expense.amount || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedDoc.time_logs && Array.isArray(selectedDoc.time_logs) && selectedDoc.time_logs.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                        Activity Logs ({selectedDoc.time_logs.length})
                      </h3>
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4">Activity</th>
                              <th className="py-2.5 px-4">Timeframe</th>
                              <th className="py-2.5 px-4 text-right pr-4">Hours</th>
                            </tr>
                          </thead>
                          <tbody className="text-[11px] font-bold text-slate-600 divide-y divide-slate-100">
                            {selectedDoc.time_logs.map((log: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4">
                                  <p className="font-extrabold text-slate-800 uppercase">{log.activity_type || "—"}</p>
                                  {log.description && <p className="text-[9px] text-slate-400 mt-0.5">{log.description}</p>}
                                </td>
                                <td className="py-2.5 px-4 text-slate-400 font-medium">
                                  <div className="flex flex-col">
                                    <span>From: {log.from_time?.replace("T", " ") || "—"}</span>
                                    <span>To: {log.to_time?.replace("T", " ") || "—"}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-right pr-4 text-indigo-600 font-extrabold">{log.hours} hrs</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Drawer Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <a
                    href={`https://brihaspathi.m.frappe.cloud/app/${activeTab === "expense" ? "expense-claim" : activeTab === "timesheet" ? "timesheet" : activeTab === "po" ? "purchase-order" : activeTab === "pi" ? "purchase-invoice" : activeTab === "so" ? "sales-order" : "sales-invoice"}/${selectedDoc.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                  >
                    <span>View in Frappe Cloud ERP</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
