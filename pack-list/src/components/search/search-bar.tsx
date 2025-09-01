"use client"

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  className?: string;
  autoFocus?: boolean;
  debounceMs?: number;
}

export function SearchBar({
  placeholder = "Search...",
  onSearch,
  onClear,
  className,
  autoFocus = false,
  debounceMs = 300,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, onSearch, debounceMs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsSearching(true);
  };

  const handleClear = () => {
    setQuery("");
    onClear?.();
    onSearch("");
  };

  // Keyboard shortcut (Ctrl/Cmd + F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="search-input"
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          autoFocus={autoFocus}
          className="pl-9 pr-9"
          aria-label="Search"
        />
        <AnimatePresence>
          {query && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClear}
                className="h-7 w-7"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1">
          <div className="text-xs text-muted-foreground">Searching...</div>
        </div>
      )}
    </div>
  );
}