/**
 * @component KeyboardShortcutsGuide
 * @description Floating "?" button + modal dialog showing all available keyboard shortcuts.
 * Triggered by pressing "?" key or clicking the help button.
 */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Keyboard, X, Search, LayoutDashboard, Users, Settings, Star, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShortcutGroup {
    title: string;
    shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        title: "Navigation",
        shortcuts: [
            { keys: ["Ctrl", "K"], description: "Open Command Palette" },
            { keys: ["G", "D"], description: "Go to Dashboard" },
            { keys: ["G", "L"], description: "Go to Leads" },
            { keys: ["G", "S"], description: "Go to Settings" },
            { keys: ["G", "R"], description: "Go to Reports" },
            { keys: ["G", "A"], description: "Go to Audit Log" },
        ],
    },
    {
        title: "Leads",
        shortcuts: [
            { keys: ["N"], description: "New Lead" },
            { keys: ["S"], description: "Toggle Star on selected lead" },
            { keys: ["F"], description: "Focus search bar" },
            { keys: ["Esc"], description: "Clear selection / Close panel" },
        ],
    },
    {
        title: "General",
        shortcuts: [
            { keys: ["?"], description: "Show this shortcuts guide" },
            { keys: ["Ctrl", "Z"], description: "Undo last action" },
        ],
    },
];

export function KeyboardShortcutsGuide() {
    const [isOpen, setIsOpen] = useState(false);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger when typing in inputs
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

        if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setIsOpen(prev => !prev);
        }

        if (e.key === "Escape" && isOpen) {
            setIsOpen(false);
        }
    }, [isOpen]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return (
        <>
            {/* Floating "?" button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-white/20 hover:scale-110 transition-all duration-200 group"
                title="Keyboard Shortcuts (?)"
                aria-label="Show keyboard shortcuts"
            >
                <Keyboard className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>

            {/* Modal overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-card/95 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                                    <Keyboard className="h-4.5 w-4.5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold">Keyboard Shortcuts</h2>
                                    <p className="text-[11px] text-muted-foreground">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono border border-white/10">?</kbd> to toggle</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                                aria-label="Close shortcuts guide"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Shortcuts list */}
                        <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto scrollbar-hide">
                            {SHORTCUT_GROUPS.map((group) => (
                                <div key={group.title}>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2.5">
                                        {group.title}
                                    </h3>
                                    <div className="space-y-1.5">
                                        {group.shortcuts.map((shortcut, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-colors group"
                                            >
                                                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                                    {shortcut.description}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {shortcut.keys.map((key, j) => (
                                                        <React.Fragment key={j}>
                                                            {j > 0 && (
                                                                <span className="text-muted-foreground/40 text-[10px] mx-0.5">+</span>
                                                            )}
                                                            <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-white/10 border border-white/10 text-xs font-mono font-medium text-foreground shadow-sm">
                                                                {key}
                                                            </kbd>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground/50">
                                Shortcuts work when no input field is focused
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono border border-white/10">Esc</kbd>
                                to close
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
