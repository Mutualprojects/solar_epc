"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, Transition } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Blocks,
  ChevronsUpDown,
  LogOut,
  Settings,
  UserCircle,
  UserCog,
  School,
  Wrench,
  Package,
  Warehouse,
  LayoutDashboard,
  Sun
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const sidebarVariants = {
  open: {
    width: "16rem",
  },
  closed: {
    width: "4.5rem",
  },
};

const contentVariants = {
  open: { display: "flex", opacity: 1 },
  closed: { display: "flex", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    display: "block",
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    display: "none",
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps: Transition = {
  type: "tween" as const,
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

export function SessionNavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ full_name?: string; email?: string; profile_photo?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const initials = user?.full_name 
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US';

  return (
    <div
      className={cn(
        "sidebar z-40 h-screen shrink-0 border-r border-slate-200 bg-white text-slate-800 shadow-sm",
      )}
      style={{ width: "16rem" }}
    >
      <div
        className={`relative z-40 flex h-screen shrink-0 flex-col bg-white transition-all`}
      >
        <ul className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            
            {/* Header / Org Selector */}
            <div className="flex h-[72px] w-full shrink-0 items-center border-b border-slate-100 p-3">
              <div className="flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex h-12 w-full items-center justify-start gap-3 rounded-xl px-2 hover:bg-slate-50 hover:text-emerald-700" 
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 shadow-sm shadow-emerald-500/20">
                        <Sun className="h-5 w-5 text-white" strokeWidth={2.5} />
                      </div>
                      <li
                        className="flex w-full items-center gap-2 overflow-hidden"
                      >
                        <p className="text-base font-extrabold tracking-tight text-slate-800">
                          Solar<span className="text-emerald-500">EPC</span>
                        </p>
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
                      </li>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 rounded-xl border-slate-100 shadow-lg">
                    <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                      <Link href="/settings/members">
                        <UserCog className="h-4 w-4 text-slate-400" /> Manage members
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                      <Link href="/settings/integrations">
                        <Blocks className="h-4 w-4 text-slate-400" /> Integrations
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-1 w-full flex-col mt-2 overflow-hidden">
              <ScrollArea className="flex-1 w-full px-3">
                <div className={cn("flex w-full flex-col gap-1.5")}>
                    
                    <Link
                      href="/dashboard/superadmin"
                      className={cn(
                        "group flex h-11 w-full flex-row items-center rounded-xl px-3 py-2 transition-all font-semibold",
                        pathname?.includes("dashboard") 
                          ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 border border-transparent"
                      )}
                    >
                      <LayoutDashboard className={cn("h-5 w-5 shrink-0 transition-colors", pathname?.includes("dashboard") ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500")} />
                      <li className="overflow-hidden">
                        <p className="ml-3 text-[14px] whitespace-nowrap">Overview</p>
                      </li>
                    </Link>

                    <Link
                      href="/schools"
                      className={cn(
                        "group flex h-11 w-full flex-row items-center rounded-xl px-3 py-2 transition-all font-semibold",
                        pathname?.includes("schools") 
                          ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 border border-transparent"
                      )}
                    >
                      <School className={cn("h-5 w-5 shrink-0 transition-colors", pathname?.includes("schools") ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500")} />
                      <li className="overflow-hidden">
                        <p className="ml-3 text-[14px] whitespace-nowrap">Schools</p>
                      </li>
                    </Link>

                    <Link
                      href="/warehouse"
                      className={cn(
                        "group flex h-11 w-full flex-row items-center rounded-xl px-3 py-2 transition-all font-semibold",
                        pathname?.includes("warehouse") 
                          ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 border border-transparent"
                      )}
                    >
                      <Warehouse className={cn("h-5 w-5 shrink-0 transition-colors", pathname?.includes("warehouse") ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500")} />
                      <li className="overflow-hidden">
                        <p className="ml-3 text-[14px] whitespace-nowrap">Warehouse</p>
                      </li>
                    </Link>
                    

                    
                    <Link
                      href="/installations"
                      className={cn(
                        "group flex h-11 w-full flex-row items-center rounded-xl px-3 py-2 transition-all font-semibold",
                        pathname?.includes("installations") 
                          ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 border border-transparent"
                      )}
                    >
                      <Wrench className={cn("h-5 w-5 shrink-0 transition-colors", pathname?.includes("installations") ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500")} />
                      <li className="overflow-hidden">
                        <p className="ml-3 text-[14px] whitespace-nowrap">Installations</p>
                      </li>
                    </Link>

                    <Link
                      href="/inventory"
                      className={cn(
                        "group flex h-11 w-full flex-row items-center rounded-xl px-3 py-2 transition-all font-semibold",
                        pathname?.includes("inventory") 
                          ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 border border-transparent"
                      )}
                    >
                      <Package className={cn("h-5 w-5 shrink-0 transition-colors", pathname?.includes("inventory") ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500")} />
                      <li className="overflow-hidden">
                        <p className="ml-3 text-[14px] whitespace-nowrap">Material</p>
                      </li>
                    </Link>

                    <Link
                      href="/profile"
                      className={cn(
                        "group flex h-11 w-full flex-row items-center rounded-xl px-3 py-2 transition-all font-semibold",
                        pathname === "/profile"
                          ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 border border-transparent"
                      )}
                    >
                      <UserCircle className={cn("h-5 w-5 shrink-0 transition-colors", pathname === "/profile" ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500")} />
                      <li className="overflow-hidden">
                        <p className="ml-3 text-[14px] whitespace-nowrap">Profile</p>
                      </li>
                    </Link>

                  </div>
                </ScrollArea>

              {/* Bottom Footer section */}
              <div className="flex flex-col p-3 border-t border-slate-100 bg-slate-50/50">

                
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full focus:outline-none" asChild>
                      <Button variant="ghost" className="flex h-14 w-full flex-row items-center gap-3 rounded-xl px-2 py-2 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 justify-start group">
                        <div className="w-9 h-9 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-center font-bold text-emerald-700 bg-emerald-50 shrink-0 overflow-hidden uppercase select-none">
                          {user?.profile_photo ? (
                            <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <li
                          className="flex w-full items-center gap-2 overflow-hidden"
                        >
                          <div className="flex flex-col items-start justify-center text-left">
                            <p className="text-[13px] font-bold text-slate-800 whitespace-nowrap leading-tight uppercase">{user?.full_name || "USER SESSION"}</p>
                            <p className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{user?.email || "loading..."}</p>
                          </div>
                          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
                        </li>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={8} className="w-48 rounded-xl border-slate-100 shadow-lg mb-2 font-['DM_Sans']">
                      <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer py-2.5 font-bold text-slate-655 focus:bg-slate-50 focus:text-emerald-700">
                        <Link href="/profile">
                          <UserCircle className="h-4 w-4 text-slate-400" /> Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 text-red-600 cursor-pointer py-2.5 font-black focus:bg-red-50 focus:text-red-700" onClick={() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        window.location.replace("/login");
                      }}>
                        <LogOut className="h-4 w-4" /> Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
}
