"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  searchTerm?: string;
  setSearchTerm?: (val: string) => void;
  placeholder?: string;
  showSearch?: boolean;
}

export function SharedHeader({
  searchTerm = "",
  setSearchTerm,
  placeholder = "Search...",
  showSearch = true,
}: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user context", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.replace("/login");
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-sm shrink-0">
      {/* Search Bar section */}
      <div className="flex items-center gap-4 w-96">
        {showSearch && setSearchTerm && (
          <div className="relative w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none font-['DM_Sans'] text-slate-700"
            />
          </div>
        )}
      </div>

      {/* Profile and Action section */}
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        <div className="w-px h-8 bg-slate-200"></div>

        {user && (
          <div className="flex items-center gap-3">
            {/* User Info on Left of Avatar */}
            <div className="hidden sm:flex flex-col text-right font-['DM_Sans'] select-none">
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">
                {user.full_name || "USER"}
              </span>
              <span className="text-[9px] font-bold text-slate-400 leading-tight mt-0.5">
                {user.email || ""}
              </span>
            </div>

            {/* Dropdown Menu */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="focus:outline-none cursor-pointer" asChild>
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center font-black text-emerald-700 text-xs shadow-sm hover:bg-emerald-250 transition-colors uppercase select-none cursor-pointer overflow-hidden bg-emerald-50 shrink-0">
                  {user.profile_photo ? (
                    <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.charAt(0) || "U"
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-100 shadow-lg mt-1 font-['DM_Sans'] select-none">
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-2 cursor-pointer py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-emerald-700 focus:bg-slate-50 focus:text-emerald-700 font-['DM_Sans']"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-655 cursor-pointer py-2.5 text-xs font-black hover:bg-red-50 hover:text-red-750 focus:bg-red-50 focus:text-red-750 font-['DM_Sans']"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
