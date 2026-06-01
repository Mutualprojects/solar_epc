"use client";

import { cn } from "@/lib/utils";
import {
  ChevronsUpDown,
  LogOut,
  UserCircle,
  School,
  Wrench,
  Package,
  Warehouse,
  LayoutDashboard,
  Sun,
  Users,
  X,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard/superadmin", label: "Overview", Icon: LayoutDashboard, match: "dashboard" },
  { href: "/schools", label: "Schools", Icon: School, match: "schools" },
  { href: "/warehouse", label: "Warehouse", Icon: Warehouse, match: "warehouse" },
  { href: "/installations", label: "Installations", Icon: Wrench, match: "installations" },
  { href: "/inventory", label: "Material", Icon: Package, match: "inventory" },
  { href: "/users", label: "Personnel", Icon: Users, match: "users" },
  { href: "/profile", label: "Profile", Icon: UserCircle, match: "profile" },
];

// ─── Single NavLink ─────────────────────────────────────────────────────────────

function NavLink({ item, onNavigate }: { item: typeof NAV_ITEMS[0]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive =
    item.match === "profile"
      ? pathname === "/profile"
      : pathname?.includes(item.match);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex h-11 w-full items-center gap-3 rounded-xl px-3 py-2 font-semibold transition-all duration-150 select-none",
        isActive
          ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 border border-transparent"
      )}
    >
      <item.Icon
        className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-emerald-600" : "text-slate-400"
        )}
      />
      <span className="text-[14px] whitespace-nowrap">{item.label}</span>
    </Link>
  );
}

// ─── Sidebar inner content (shared between desktop and mobile) ──────────────────

function SidebarContent({
  user,
  onNavigate,
  onClose,
  showClose,
}: {
  user: any;
  onNavigate?: () => void;
  onClose?: () => void;
  showClose?: boolean;
}) {
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "US";

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.replace("/login");
  };

  return (
    <div className="flex h-full flex-col bg-white">

      {/* ── Logo Header ── */}
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-100 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 shadow-sm shadow-emerald-500/20">
          <Sun className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-base font-extrabold tracking-tight text-slate-800 whitespace-nowrap">
          Solar<span className="text-emerald-500">EPC</span>
        </span>
        {/* Close button — mobile only */}
        {showClose && (
          <button
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ── Nav Links ── */}
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-3 gap-1 scrollbar-none">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>

      {/* ── User Footer ── */}
      <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 p-3">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="w-full focus:outline-none" asChild>
            <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-center font-bold text-emerald-700 bg-emerald-50 shrink-0 overflow-hidden uppercase select-none">
                {user?.profile_photo ? (
                  <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <p className="text-[12px] font-black text-slate-800 whitespace-nowrap leading-tight uppercase truncate max-w-[140px]">
                  {user?.full_name || "USER SESSION"}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 whitespace-nowrap truncate max-w-[140px]">
                  {user?.email || "loading..."}
                </p>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            sideOffset={8}
            side="top"
            className="w-48 rounded-xl border-slate-100 shadow-lg mb-2 font-['DM_Sans']"
          >
            <DropdownMenuItem
              asChild
              className="flex items-center gap-2 cursor-pointer py-2.5 font-bold text-slate-600 focus:bg-slate-50 focus:text-emerald-700"
            >
              <Link href="/profile" onClick={onNavigate}>
                <UserCircle className="h-4 w-4 text-slate-400" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-red-600 cursor-pointer py-2.5 font-black focus:bg-red-50 focus:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function SessionNavBar() {
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (e) { /* silent */ }
  }, []);

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          DESKTOP / TABLET — always visible, no toggle, fixed left
          Visible from md (768px) and up
          ════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
        <SidebarContent user={user} />
      </aside>

      {/* ════════════════════════════════════════════════════════
          MOBILE — hamburger toggle + slide-over overlay
          Only visible below md (< 768px)
          ════════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* Floating hamburger — always visible on mobile when sidebar is closed */}
        {!mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-md text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Slide-in panel */}
        <div
          className={cn(
            "fixed top-0 left-0 z-50 h-full w-72 border-r border-slate-200 shadow-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent
            user={user}
            showClose
            onClose={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
