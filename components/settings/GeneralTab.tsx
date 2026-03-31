/**
 * @component GeneralTab
 * @description Settings tab for lead statuses (drag-to-reorder), sources, and monthly goals.
 * Drag & Drop via HTML5 native API — no extra packages required.
 */
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, GripVertical, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { STATUS_EMOJI_OPTIONS, SOURCE_ICON_OPTIONS, getSourceIconComponent } from "@/lib/iconMap";

const COLOR_NAME_MAP: Record<string, string> = {
    red: "#ef4444", blue: "#3b82f6", green: "#22c55e", emerald: "#10b981",
    violet: "#8b5cf6", purple: "#a855f7", amber: "#f59e0b", orange: "#f97316",
    yellow: "#eab308", cyan: "#06b6d4", pink: "#ec4899", rose: "#f43f5e",
    teal: "#14b8a6", indigo: "#6366f1", lime: "#84cc16", sky: "#0ea5e9",
};

function toHex(c: string | undefined): string {
    if (!c) return "#8b5cf6";
    if (c.startsWith("#")) return c;
    return COLOR_NAME_MAP[c.toLowerCase()] || "#8b5cf6";
}

interface GeneralTabProps {
    statuses: any[];
    sources: any[];
    onStatusChange: (index: number, field: string, value: string) => void;
    onAddStatus: () => void;
    onRemoveStatus: (index: number) => void;
    onSourcesChange: (sources: any[]) => void;
    onSaveSettings: () => void;
    onReorderStatuses?: (statuses: any[]) => void;
    autoAssignStrategy?: string;
    onAutoAssignStrategyChange?: (strategy: string) => void;
    defaultCurrency?: string;
    onCurrencyChange?: (currency: string) => void;
}

export function GeneralTab({
    statuses, sources,
    onStatusChange, onAddStatus, onRemoveStatus,
    onSourcesChange,
    onSaveSettings,
    onReorderStatuses,
    autoAssignStrategy = "none",
    onAutoAssignStrategyChange,
    defaultCurrency = "AED",
    onCurrencyChange,
}: GeneralTabProps) {

    // ── Drag-to-reorder state (statuses)
    const dragIndex = useRef<number | null>(null);
    const [dragOver, setDragOver] = useState<number | null>(null);

    // ── Drag-to-reorder state (sources)
    const srcDragIndex = useRef<number | null>(null);
    const [srcDragOver, setSrcDragOver] = useState<number | null>(null);

    const handleDragStart = useCallback((index: number) => {
        dragIndex.current = index;
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOver(index);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        setDragOver(null);
        if (dragIndex.current === null || dragIndex.current === dropIndex) return;

        const reordered = [...statuses];
        const [moved] = reordered.splice(dragIndex.current, 1);
        reordered.splice(dropIndex, 0, moved);
        dragIndex.current = null;

        if (onReorderStatuses) onReorderStatuses(reordered);
    }, [statuses, onReorderStatuses]);

    const handleDragEnd = useCallback(() => {
        setDragOver(null);
        dragIndex.current = null;
    }, []);

    return (
        <div className="grid gap-6 md:grid-cols-2">

            {/* ── Lead Statuses ──────────────────────────────────── */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-primary rounded-full" />
                        Lead Statuses
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Configure lead stages. Drag <GripVertical className="inline h-3 w-3" /> to reorder.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {statuses.map((status, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={e => handleDragOver(e, index)}
                                onDrop={e => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                    "flex items-center gap-2 group bg-white/5 p-2 rounded-2xl border transition-all",
                                    dragOver === index
                                        ? "border-primary/50 bg-primary/5 scale-[1.01]"
                                        : "border-white/5 hover:bg-white/10"
                                )}
                            >
                                {/* Drag handle */}
                                <div
                                    className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-1 flex-shrink-0 mt-5"
                                    aria-label="Drag to reorder"
                                >
                                    <GripVertical className="h-4 w-4" />
                                </div>

                                {/* Label input */}
                                <div className="flex-1 space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Label</Label>
                                    <Input
                                        value={status.label}
                                        onChange={e => onStatusChange(index, "label", e.target.value)}
                                        placeholder="Label"
                                        className="h-9 rounded-xl border-white/10 bg-black/20"
                                    />
                                </div>

                                {/* Color picker */}
                                <div className="w-20 space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Color</Label>
                                    <StatusColorBox color={toHex(status.color)}>
                                        <Input
                                            type="color"
                                            value={toHex(status.color)}
                                            onChange={e => onStatusChange(index, "color", e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </StatusColorBox>
                                </div>

                                {/* Sale Status Toggle */}
                                <div className="w-16 space-y-1 flex-shrink-0">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Sale</Label>
                                    <button
                                        type="button"
                                        onClick={() => onStatusChange(index, "isSaleStatus", status.isSaleStatus ? "" : "true")}
                                        className={cn(
                                            "w-full h-9 rounded-xl border text-[10px] font-bold uppercase transition-all",
                                            status.isSaleStatus
                                                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                                                : "border-white/10 bg-black/20 text-muted-foreground/50 hover:bg-white/10"
                                        )}
                                        title="Mark this status as a completed sale (counts in revenue reports)"
                                    >
                                        {status.isSaleStatus ? "✓ Yes" : "No"}
                                    </button>
                                </div>

                                {/* Emoji Picker */}
                                <div className="w-14 space-y-1 flex-shrink-0">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Icon</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className="w-full h-9 rounded-xl border border-white/10 bg-black/20 text-lg flex items-center justify-center hover:bg-white/10 transition-all"
                                            >
                                                {status.emoji || "😀"}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-2 rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl" align="end">
                                            <div className="grid grid-cols-6 gap-1">
                                                {STATUS_EMOJI_OPTIONS.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => onStatusChange(index, "emoji", emoji)}
                                                        className={cn(
                                                            "h-9 w-9 rounded-lg text-lg flex items-center justify-center hover:bg-white/10 transition-all",
                                                            status.emoji === emoji && "bg-primary/20 ring-1 ring-primary/40"
                                                        )}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => onStatusChange(index, "emoji", "")}
                                                    className="h-9 w-9 rounded-lg text-[10px] text-muted-foreground flex items-center justify-center hover:bg-white/10 transition-all"
                                                >
                                                    None
                                                </button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Remove */}
                                <Button
                                    variant="ghost" size="icon"
                                    onClick={() => onRemoveStatus(index)}
                                    className="h-9 w-9 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity mt-5 flex-shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={onAddStatus}
                        variant="outline" size="sm"
                        className="rounded-xl border-white/10 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        Add New Status
                    </Button>
                    <div className="pt-4 border-t border-white/5">
                        <Button onClick={onSaveSettings} className="rounded-xl bg-primary hover:bg-primary/80 px-8 shadow-lg shadow-primary/20">
                            Save Status Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Lead Sources ───────────────────────────────────── */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                        Lead Sources
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">Where your leads come from. Drag <GripVertical className="inline h-3 w-3" /> to reorder.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {sources.map((source, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={() => { srcDragIndex.current = index; }}
                                onDragOver={e => { e.preventDefault(); setSrcDragOver(index); }}
                                onDrop={e => {
                                    e.preventDefault();
                                    setSrcDragOver(null);
                                    if (srcDragIndex.current === null || srcDragIndex.current === index) return;
                                    const reordered = [...sources];
                                    const [moved] = reordered.splice(srcDragIndex.current, 1);
                                    reordered.splice(index, 0, moved);
                                    srcDragIndex.current = null;
                                    onSourcesChange(reordered);
                                }}
                                onDragEnd={() => { setSrcDragOver(null); srcDragIndex.current = null; }}
                                className={cn(
                                    "flex items-center gap-2 group bg-white/5 p-2 rounded-2xl border transition-all",
                                    srcDragOver === index
                                        ? "border-blue-500/50 bg-blue-500/5 scale-[1.01]"
                                        : "border-white/5 hover:bg-white/10"
                                )}
                            >
                                {/* Drag handle */}
                                <div
                                    className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-1 flex-shrink-0"
                                    aria-label="Drag to reorder"
                                >
                                    <GripVertical className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        value={source.label}
                                        onChange={e => {
                                            const newSources = [...sources];
                                            newSources[index] = {
                                                ...source,
                                                label: e.target.value,
                                                key: e.target.value.toLowerCase().replace(/\s/g, "_"),
                                            };
                                            onSourcesChange(newSources);
                                        }}
                                        className="h-9 rounded-xl border-white/10 bg-black/20"
                                    />
                                </div>

                                {/* Icon Picker */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="h-9 w-9 rounded-xl border border-white/10 bg-black/20 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0"
                                        >
                                            {(() => { const IC = getSourceIconComponent(source.icon); return <IC className="h-4 w-4 text-primary" />; })()}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2 rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl" align="end">
                                        <div className="grid grid-cols-6 gap-1">
                                            {SOURCE_ICON_OPTIONS.map(iconKey => {
                                                const IC = getSourceIconComponent(iconKey);
                                                return (
                                                    <button
                                                        key={iconKey}
                                                        type="button"
                                                        onClick={() => {
                                                            const newSources = [...sources];
                                                            newSources[index] = { ...source, icon: iconKey };
                                                            onSourcesChange(newSources);
                                                        }}
                                                        className={cn(
                                                            "h-9 w-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all",
                                                            source.icon === iconKey && "bg-primary/20 ring-1 ring-primary/40"
                                                        )}
                                                        title={iconKey}
                                                    >
                                                        <IC className="h-4 w-4" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    variant="ghost" size="icon"
                                    onClick={() => {
                                        const newSources = [...sources];
                                        newSources.splice(index, 1);
                                        onSourcesChange(newSources);
                                    }}
                                    className="h-9 w-9 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button
                        onClick={() => onSourcesChange([...sources, { key: `source_${Date.now()}`, label: "New Source" }])}
                        variant="outline" size="sm"
                        className="rounded-xl border-white/10 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                    >
                        Add New Source
                    </Button>
                    <div className="pt-4 border-t border-white/5">
                        <Button onClick={onSaveSettings} className="rounded-xl bg-blue-500 hover:bg-blue-600 px-8 shadow-lg shadow-blue-500/20">
                            Save Source Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>



            {/* ── Default Currency ──────────────────────────────── */}
            <Card className="md:col-span-1 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        Default Currency
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Used for lead values and reports.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                        {["AED", "USD", "EUR", "GBP", "SAR", "EGP", "INR", "BHD"].map(c => (
                            <button
                                key={c}
                                onClick={() => onCurrencyChange?.(c)}
                                className={cn(
                                    "p-2.5 rounded-xl border text-center text-sm font-semibold transition-all",
                                    defaultCurrency === c
                                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
                                        : "border-white/10 bg-white/5 hover:bg-white/10 text-foreground"
                                )}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ── Auto-Assignment Strategy ────────────────────────── */}
            <Card className="md:col-span-2 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-cyan-500" />
                        Lead Auto-Assignment
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Automatically assign new leads to team members when no assignee is selected.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { value: "none", label: "Disabled", desc: "Manual assignment only" },
                            { value: "round_robin", label: "Round Robin", desc: "Cycles through team members in order" },
                            { value: "least_loaded", label: "Least Loaded", desc: "Assigns to member with fewest leads" },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => onAutoAssignStrategyChange?.(opt.value)}
                                className={cn(
                                    "p-4 rounded-2xl border text-left transition-all",
                                    autoAssignStrategy === opt.value
                                        ? "border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/30"
                                        : "border-white/10 bg-white/5 hover:bg-white/10"
                                )}
                            >
                                <p className={cn("text-sm font-semibold", autoAssignStrategy === opt.value ? "text-cyan-400" : "text-foreground")}>
                                    {opt.label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/* ─── StatusColorBox helper ─────────────────────────────────────────────── */
function StatusColorBox({ color, children }: { color: string; children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { if (ref.current) ref.current.style.backgroundColor = color; }, [color]);
    return (
        <div ref={ref} className="relative h-9 rounded-xl border border-white/10 overflow-hidden">
            {children}
        </div>
    );
}
