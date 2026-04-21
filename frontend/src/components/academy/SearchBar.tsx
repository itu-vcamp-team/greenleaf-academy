"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import apiClient from "@/lib/api-client";
import ContentCard from "./ContentCard";

interface SearchBarProps {
  className?: string;
  locale: string;
}

export default function SearchBar({ className = "", locale }: SearchBarProps) {
  const t = useTranslations("academy");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Simple debounce implementation
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiClient.get(`/academy/contents/search?q=${encodeURIComponent(q)}&locale=${locale}`);
      setResults(res.data);
      setShowResults(true);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 400);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Input Group */}
      <div className="flex items-center gap-2 border border-foreground/10 rounded-2xl px-4 py-3
                      bg-surface focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm">
        <Search size={18} className="text-foreground/20 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={t("search_placeholder")}
          className="flex-1 text-sm outline-none bg-transparent placeholder:text-foreground/20 font-medium text-foreground"
        />
        {loading ? (
          <Loader2 size={16} className="text-primary animate-spin" />
        ) : query && (
          <button onClick={clearSearch}>
            <X size={16} className="text-foreground/40 hover:text-foreground/60 transition-colors" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 z-[60] mt-2 glass md:bg-surface/80
                        border border-foreground/5 rounded-2xl shadow-2xl max-h-[480px] overflow-y-auto overflow-x-hidden p-3 custom-scrollbar text-foreground">
          {results.length === 0 ? (
            <div className="py-8 text-center text-foreground/30 text-sm italic font-medium">
              "{query}" {t("no_results")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((item) => (
                <div key={item.id} onClick={() => setShowResults(false)}>
                  <ContentCard 
                    {...item} 
                    isLocked={item.is_locked} // Align with backend property name
                    thumbnailUrl={item.thumbnail_url}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
