"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Button (Looks like Ant Design Select) */}
      <div
        className={`flex items-center justify-between bg-white border ${
          isOpen ? "border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" : "border-slate-300"
        } rounded-lg px-3 py-2 cursor-pointer transition-all ${
          disabled ? "bg-slate-50 opacity-60 cursor-not-allowed" : "hover:border-emerald-400"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`text-xs font-bold uppercase truncate ${selectedOption ? "text-slate-700" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <div className="flex items-center gap-1.5 text-slate-400">
          {value && !disabled && (
            <X 
              className="w-3.5 h-3.5 hover:text-slate-600 transition-colors" 
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            />
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[9999] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col"
          >
            {/* Search Input inside Dropdown */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="SEARCH..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-emerald-500 transition-colors uppercase placeholder:normal-case"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`px-3 py-2 text-xs font-bold uppercase rounded-md cursor-pointer transition-colors ${
                      value === opt.value
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-xs font-bold text-slate-400 uppercase">
                  No matches found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
