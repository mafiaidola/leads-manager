"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Users, LayoutDashboard, BarChart3, Settings, Shield, ArrowRight, Command } from "lucide-react";
import { searchLeads } from "@/lib/actions/leads";

interface SearchResult {
    _id: string;
    name: string;
    company: string;
    status: string;
    phone: string;
    email: string;
}

const PAGES = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard, keywords: "home overview stats" },
    { label: "Leads", href: "/leads", icon: Users, keywords: "contacts pipeline" },
    { label: "Reports", href: "/reports", icon: BarChart3, keywords: "analytics charts" },
    { label: "Settings", href: "/settings", icon: Settings, keywords: "config preferences team" },
    { label: "Audit Log", href: "/audit", icon: Shield, keywords: "history log" },
];

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Keyboard shortcut: Ctrl+K or Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === "Escape") {
                setOpen(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery("");
            setResults([]);
            setSelectedIndex(0);
        }
    }, [open]);

    // Debounced search
    const handleSearch = useCallback((q: string) => {
        setQuery(q);
        setSelectedIndex(0);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            const res = await searchLeads(q);
            setResults(res);
            setLoading(false);
        }, 250);
    }, []);

    // Filter pages
    const filteredPages = query.length > 0
        ? PAGES.filter(p => p.label.toLowerCase().includes(query.toLowerCase()) || p.keywords.includes(query.toLowerCase()))
        : PAGES;

    // Total items
    const totalItems = filteredPages.length + results.length;

    // Navigate to selected item
    const navigateTo = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex < filteredPages.length) {
                navigateTo(filteredPages[selectedIndex].href);
            } else {
                const leadIdx = selectedIndex - filteredPages.length;
                if (results[leadIdx]) {
                    navigateTo(`/leads/${results[leadIdx]._id}`);
                }
            }
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Palette */}
            <div
                className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/30 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => handleSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search leads, navigate pages..."
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
                        autoComplete="off"
                    />
                    {query && (
                        <button onClick={() => handleSearch("")} title="Clear search" aria-label="Clear search" className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono text-muted-foreground bg-white/5 border border-white/10 rounded-lg">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[340px] overflow-y-auto p-2">
                    {/* Pages */}
                    {filteredPages.length > 0 && (
                        <div>
                            <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Pages</p>
                            {filteredPages.map((page, i) => {
                                const Icon = page.icon;
                                return (
                                    <button
                                        key={page.href}
                                        onClick={() => navigateTo(page.href)}
                                        onMouseEnter={() => setSelectedIndex(i)}
                                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${selectedIndex === i ? "bg-primary/15 text-primary" : "text-foreground hover:bg-white/5"
                                            }`}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span className="flex-1 text-left">{page.label}</span>
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Leads */}
                    {loading && (
                        <div className="px-3 py-4 text-center">
                            <div className="inline-block h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="mt-1">
                            <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Leads</p>
                            {results.map((lead, i) => {
                                const idx = filteredPages.length + i;
                                return (
                                    <button
                                        key={lead._id}
                                        onClick={() => navigateTo(`/leads/${lead._id}`)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${selectedIndex === idx ? "bg-primary/15 text-primary" : "text-foreground hover:bg-white/5"
                                            }`}
                                    >
                                        <Users className="h-4 w-4 shrink-0 text-violet-500" />
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="font-medium truncate">{lead.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {lead.company}{lead.company && lead.phone ? " · " : ""}{lead.phone}
                                            </div>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground shrink-0">
                                            {lead.status}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            No leads found for &ldquo;{query}&rdquo;
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono">↑↓</kbd> navigate</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono">↵</kbd> open</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono">esc</kbd> close</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                        <Command className="h-3 w-3" />
                        <span>+K</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
