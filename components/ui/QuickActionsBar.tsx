"use client";

import React, { useState, useTransition } from "react";
import { Trash2, ArrowRightLeft, Tag, CheckCircle2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuickActionsBarProps {
    selectedCount: number;
    onBulkDelete: () => void;
    onBulkStatusChange: (status: string) => void;
    onClearSelection: () => void;
    statuses: { key: string; label: string; color: string }[];
}

/**
 * @component QuickActionsBar
 * @description Floating action bar that appears when multiple leads are selected.
 * Provides bulk operations: status change, delete, with smooth slide-in animation.
 */
export function QuickActionsBar({
    selectedCount,
    onBulkDelete,
    onBulkStatusChange,
    onClearSelection,
    statuses,
}: QuickActionsBarProps) {
    const [showStatusPicker, setShowStatusPicker] = useState(false);

    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/15 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/20">
                {/* Selection count */}
                <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary border-none text-sm font-bold px-3 py-1 rounded-lg">
                        {selectedCount}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-medium">
                        lead{selectedCount > 1 ? "s" : ""} selected
                    </span>
                </div>

                <div className="w-px h-8 bg-white/10" />

                {/* Status change */}
                <div className="relative">
                    {showStatusPicker ? (
                        <div className="flex items-center gap-2">
                            <Select onValueChange={(v) => { onBulkStatusChange(v); setShowStatusPicker(false); }}>
                                <SelectTrigger className="w-[180px] h-9 rounded-xl bg-white/5 border-white/10 text-sm">
                                    <SelectValue placeholder="Choose status..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                    {statuses.map((s) => (
                                        <SelectItem key={s.key} value={s.key}>
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full status-dot" ref={el => { if (el) el.style.setProperty('--status-color', s.color); }} />
                                                {s.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <button onClick={() => setShowStatusPicker(false)} className="text-muted-foreground hover:text-foreground" aria-label="Cancel status change">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowStatusPicker(true)}
                            className="rounded-xl hover:bg-primary/10 text-sm gap-2"
                        >
                            <Tag className="h-4 w-4" />
                            Status
                        </Button>
                    )}
                </div>

                {/* Delete */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBulkDelete}
                    className="rounded-xl hover:bg-destructive/10 text-destructive text-sm gap-2"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </Button>

                <div className="w-px h-8 bg-white/10" />

                {/* Clear */}
                <button
                    onClick={onClearSelection}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear selection"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
