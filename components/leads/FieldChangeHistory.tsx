/**
 * @component FieldChangeHistory
 * @description Timeline showing field-level changes on a lead.
 * Only visible to Admin and SuperAdmin users.
 * Shows who changed which field, old → new value, and when.
 */
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangeRecord {
    _id: string;
    field: string;
    oldValue: string;
    newValue: string;
    changedByName: string;
    createdAt: string;
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
}

interface FieldChangeHistoryProps {
    changes: ChangeRecord[];
}

export const FieldChangeHistory = React.memo(function FieldChangeHistory({
    changes,
}: FieldChangeHistoryProps) {
    if (changes.length === 0) {
        return (
            <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <History className="h-4 w-4 text-amber-400" />
                        Change History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        <History className="h-6 w-6 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No changes recorded yet</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Group changes by date
    const grouped = changes.reduce<Record<string, ChangeRecord[]>>((acc, change) => {
        const date = new Date(change.createdAt).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(change);
        return acc;
    }, {});

    return (
        <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <History className="h-4 w-4 text-amber-400" />
                    Change History
                    <span className="text-xs font-normal text-muted-foreground ml-auto">
                        {changes.length} changes
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="max-h-[400px] overflow-y-auto scrollbar-hide space-y-4">
                    {Object.entries(grouped).map(([date, dayChanges]) => (
                        <div key={date}>
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                {date}
                            </div>
                            <div className="space-y-1.5">
                                {dayChanges.map((c) => (
                                    <div
                                        key={c._id}
                                        className="flex items-start gap-2 p-2.5 rounded-xl border border-white/5 bg-white/3 hover:bg-white/5 transition-colors"
                                    >
                                        {/* Timeline dot */}
                                        <div className="mt-1.5 h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-xs font-semibold text-primary">
                                                    {c.field}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    by {c.changedByName}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/50 ml-auto">
                                                    {timeAgo(c.createdAt)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded-md max-w-[45%] truncate",
                                                    "bg-red-500/10 text-red-400 border border-red-500/20"
                                                )}>
                                                    {c.oldValue || "(empty)"}
                                                </span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded-md max-w-[45%] truncate",
                                                    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                )}>
                                                    {c.newValue || "(empty)"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
});
