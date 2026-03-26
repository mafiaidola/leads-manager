"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastEntry {
    id: string;
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    timestamp: Date;
}

/**
 * @component ToastHistoryPanel
 * @description Floating panel showing recent toast notifications.
 * Captures toasts via a global event system and displays them in a collapsible timeline.
 */
export function ToastHistoryPanel() {
    const [history, setHistory] = useState<ToastEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasNew, setHasNew] = useState(false);

    const addToast = useCallback((e: CustomEvent) => {
        const { title, description, variant } = e.detail;
        const entry: ToastEntry = {
            id: Date.now().toString(),
            title,
            description,
            variant,
            timestamp: new Date(),
        };
        setHistory((prev) => [entry, ...prev].slice(0, 20));
        setHasNew(true);
    }, []);

    useEffect(() => {
        window.addEventListener("toast-logged" as any, addToast as any);
        return () => window.removeEventListener("toast-logged" as any, addToast as any);
    }, [addToast]);

    const clearHistory = () => {
        setHistory([]);
        setHasNew(false);
    };

    if (history.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-4 z-50">
            {/* Toggle Button */}
            <button
                onClick={() => { setIsOpen(!isOpen); setHasNew(false); }}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-xl shadow-2xl transition-all text-sm font-medium",
                    isOpen
                        ? "bg-card/95 border-white/20 text-foreground"
                        : "bg-card/80 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
                )}
            >
                {hasNew && !isOpen && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                <Info className="h-4 w-4" />
                Recent Actions ({history.length})
                {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </button>

            {/* Panel */}
            {isOpen && (
                <div className="absolute bottom-12 right-0 w-80 max-h-[320px] overflow-y-auto rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Action History</span>
                        <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive transition-colors" aria-label="Clear action history">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="divide-y divide-white/5">
                        {history.map((entry) => (
                            <div key={entry.id} className="px-4 py-2.5 flex items-start gap-2.5">
                                {entry.variant === "destructive" ? (
                                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                ) : entry.title.includes("⚠") ? (
                                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{entry.title}</p>
                                    {entry.description && (
                                        <p className="text-[10px] text-muted-foreground truncate">{entry.description}</p>
                                    )}
                                </div>
                                <span className="text-[9px] text-muted-foreground/50 shrink-0 mt-0.5">
                                    {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
