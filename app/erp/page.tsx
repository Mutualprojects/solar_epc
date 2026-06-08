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
  ChevronRight
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
    fetchErpData(projectCode);
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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-black border-b border-slate-150 select-none">
                      {activeTab === "po" && (
                        <>
                          <th className="py-3.5 px-6">Order ID</th>
                          <th className="py-3.5 px-6">Supplier</th>
                          <th className="py-3.5 px-6">Transaction Date</th>
                          <th className="py-3.5 px-6">Grand Total</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6 pr-6 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === "pi" && (
                        <>
                          <th className="py-3.5 px-6">Invoice ID</th>
                          <th className="py-3.5 px-6">Supplier</th>
                          <th className="py-3.5 px-6">Posting Date</th>
                          <th className="py-3.5 px-6">Grand Total</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6 pr-6 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === "so" && (
                        <>
                          <th className="py-3.5 px-6">Order ID</th>
                          <th className="py-3.5 px-6">Customer</th>
                          <th className="py-3.5 px-6">Transaction Date</th>
                          <th className="py-3.5 px-6">Grand Total</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6 pr-6 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === "si" && (
                        <>
                          <th className="py-3.5 px-6">Invoice ID</th>
                          <th className="py-3.5 px-6">Customer</th>
                          <th className="py-3.5 px-6">Posting Date</th>
                          <th className="py-3.5 px-6">Grand Total</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6 pr-6 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === "expense" && (
                        <>
                          <th className="py-3.5 px-6">Claim ID</th>
                          <th className="py-3.5 px-6">Employee</th>
                          <th className="py-3.5 px-6">Posting Date</th>
                          <th className="py-3.5 px-6">Claimed Amount</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6 pr-6 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === "timesheet" && (
                        <>
                          <th className="py-3.5 px-6">Timesheet ID</th>
                          <th className="py-3.5 px-6">Employee</th>
                          <th className="py-3.5 px-6">Start Date</th>
                          <th className="py-3.5 px-6">Total Hours</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6 pr-6 text-right">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                    {filteredActiveData.map((doc: any) => (
                      <tr key={doc.name} className="hover:bg-slate-50/50 transition-colors">
                        {/* ── Purchase Order Row ── */}
                        {activeTab === "po" && (
                          <>
                            <td className="py-3.5 px-6 font-extrabold text-slate-800">{doc.name}</td>
                            <td className="py-3.5 px-6 text-slate-550 uppercase truncate max-w-[200px]">{doc.supplier}</td>
                            <td className="py-3.5 px-6 text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {doc.transaction_date || doc.creation?.split(" ")[0] || "—"}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-emerald-700 font-extrabold">{formatCurrency(doc.grand_total || 0)}</td>
                            <td className="py-3.5 px-6">{getStatusBadge(doc.status)}</td>
                          </>
                        )}

                        {/* ── Purchase Invoice Row ── */}
                        {activeTab === "pi" && (
                          <>
                            <td className="py-3.5 px-6 font-extrabold text-slate-800">{doc.name}</td>
                            <td className="py-3.5 px-6 text-slate-550 uppercase truncate max-w-[200px]">{doc.supplier}</td>
                            <td className="py-3.5 px-6 text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {doc.posting_date || doc.creation?.split(" ")[0] || "—"}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-emerald-700 font-extrabold">{formatCurrency(doc.grand_total || 0)}</td>
                            <td className="py-3.5 px-6">{getStatusBadge(doc.status)}</td>
                          </>
                        )}

                        {/* ── Sales Order Row ── */}
                        {activeTab === "so" && (
                          <>
                            <td className="py-3.5 px-6 font-extrabold text-slate-800">{doc.name}</td>
                            <td className="py-3.5 px-6 text-slate-550 uppercase truncate max-w-[200px]">{doc.customer}</td>
                            <td className="py-3.5 px-6 text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {doc.transaction_date || doc.creation?.split(" ")[0] || "—"}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-emerald-700 font-extrabold">{formatCurrency(doc.grand_total || 0)}</td>
                            <td className="py-3.5 px-6">{getStatusBadge(doc.status)}</td>
                          </>
                        )}

                        {/* ── Sales Invoice Row ── */}
                        {activeTab === "si" && (
                          <>
                            <td className="py-3.5 px-6 font-extrabold text-slate-800">{doc.name}</td>
                            <td className="py-3.5 px-6 text-slate-550 uppercase truncate max-w-[200px]">{doc.customer}</td>
                            <td className="py-3.5 px-6 text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {doc.posting_date || doc.creation?.split(" ")[0] || "—"}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-emerald-700 font-extrabold">{formatCurrency(doc.grand_total || 0)}</td>
                            <td className="py-3.5 px-6">{getStatusBadge(doc.status)}</td>
                          </>
                        )}

                        {/* ── Expense Claim Row ── */}
                        {activeTab === "expense" && (
                          <>
                            <td className="py-3.5 px-6 font-extrabold text-slate-800">{doc.name}</td>
                            <td className="py-3.5 px-6 text-slate-550 uppercase truncate max-w-[200px]">{doc.employee_name || doc.employee}</td>
                            <td className="py-3.5 px-6 text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {doc.posting_date || doc.creation?.split(" ")[0] || "—"}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-emerald-700 font-extrabold">{formatCurrency(doc.total_claimed_amount || 0)}</td>
                            <td className="py-3.5 px-6">{getStatusBadge(doc.status)}</td>
                          </>
                        )}

                        {/* ── Timesheet Row ── */}
                        {activeTab === "timesheet" && (
                          <>
                            <td className="py-3.5 px-6 font-extrabold text-slate-800">{doc.name}</td>
                            <td className="py-3.5 px-6 text-slate-550 uppercase truncate max-w-[200px]">{doc.employee}</td>
                            <td className="py-3.5 px-6 text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {doc.start_date?.split(" ")[0] || doc.creation?.split(" ")[0] || "—"}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-indigo-700 font-extrabold">{doc.total_hours || 0} hrs</td>
                            <td className="py-3.5 px-6">{getStatusBadge(doc.status)}</td>
                          </>
                        )}

                        {/* Action buttons */}
                        <td className="py-3.5 px-6 text-right pr-6">
                          <a
                            href={`https://brihaspathi.m.frappe.cloud/app/${activeTab === "expense" ? "expense-claim" : activeTab === "timesheet" ? "timesheet" : activeTab === "po" ? "purchase-order" : activeTab === "pi" ? "purchase-invoice" : activeTab === "so" ? "sales-order" : "sales-invoice"}/${doc.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            <span>Open ERP</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
