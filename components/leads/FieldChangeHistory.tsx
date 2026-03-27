/**
 * @component FieldChangeHistory
 * @description Enhanced visual timeline showing field-level changes on a lead.
 * Groups changes by timestamp (edit session), shows before/after values with
 * color-coded diff, field-type icons, and relative timestamps.
 * Only visible to Admin and SuperAdmin users.
 */
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    History,
    ArrowRight,
    User as UserIcon,
    Phone,
    Mail,
    DollarSign,
    Tag,
    Target,
    Calendar,
    Users,
    FileText,
    Building2,
    Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangeRecord {
    _id: string;
    field: string;
    oldValue: string;
    newValue: string;
    changedByName: string;
    createdAt: string;
}

interface FieldChangeHistoryProps {
    changes: ChangeRecord[];
}

// Field → icon + color mapping for visual distinction
const FIELD_CONFIG: Record<string, { icon: any; color: string; bg: string; label?: string }> = {
    "Name": { icon: UserIcon, color: "text-blue-400", bg: "bg-blue-500/10" },
    "Email": { icon: Mail, color: "text-purple-400", bg: "bg-purple-500/10" },
    "Phone": { icon: Phone, color: "text-green-400", bg: "bg-green-500/10" },
    "Company": { icon: Building2, color: "text-amber-400", bg: "bg-amber-500/10" },
    "Status": { icon: Target, color: "text-red-400", bg: "bg-red-500/10" },
    "Source": { icon: Tag, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    "Deal Value": { icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    "Currency": { icon: DollarSign, color: "text-emerald-300", bg: "bg-emerald-500/10" },
    "Assigned To": { icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    "Follow-up Date": { icon: Calendar, color: "text-orange-400", bg: "bg-orange-500/10" },
    "Tags": { icon: Tag, color: "text-pink-400", bg: "bg-pink-500/10" },
    "Priority": { icon: Target, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    "Notes": { icon: FileText, color: "text-slate-400", bg: "bg-slate-500/10" },
};

const DEFAULT_CONFIG = { icon: History, color: "text-muted-foreground", bg: "bg-white/5" };

/** Relative time string */
function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return "Yesterday";
    if (d < 7) return `${d}d ago`;
    if (d < 30) return `${Math.floor(d / 7)}w ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Format exact date */
function exactDate(iso: string): string {
    return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
    });
}

/** Group changes by minute (same edit session) */
function groupBySession(changes: ChangeRecord[]): { timestamp: string; author: string; changes: ChangeRecord[] }[] {
    const groups = new Map<string, ChangeRecord[]>();
    for (const c of changes) {
        const key = `${c.changedByName}::${c.createdAt.slice(0, 16)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(c);
    }
    return Array.from(groups.entries()).map(([, items]) => ({
        timestamp: items[0].createdAt,
        author: items[0].changedByName,
        changes: items,
    }));
}

export const FieldChangeHistory = React.memo(function FieldChangeHistory({
    changes,
}: FieldChangeHistoryProps) {
    // Empty state
    if (changes.length === 0) {
        return (
            <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-400" />
                        Field Change Audit
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-10">
                        <History className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
                        <p className="text-sm text-muted-foreground">No field changes recorded yet</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">
                            Changes will appear here when lead fields are edited.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const grouped = groupBySession(changes);

    return (
        <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-400" />
                    Field Change Audit
                    <Badge variant="outline" className="text-[10px] ml-auto font-normal border-white/10 text-muted-foreground">
                        {changes.length} {changes.length === 1 ? "change" : "changes"}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <ScrollArea className="max-h-[450px] pr-1">
                    <div className="space-y-0">
                        {grouped.map((group, idx) => (
                            <div
                                key={idx}
                                className="relative pl-7 pb-6 border-l-2 border-white/10 last:pb-2 last:border-transparent"
                            >
                                {/* Timeline node */}
                                <div className="absolute left-[-8px] top-0 w-[14px] h-[14px] rounded-full bg-card border-2 border-amber-400/60 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                </div>

                                {/* Session header: author + time */}
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                                            {group.author?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <span className="text-[11px] font-bold text-foreground">{group.author}</span>
                                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground border-white/10">
                                            {group.changes.length} {group.changes.length === 1 ? "field" : "fields"}
                                        </Badge>
                                    </div>
                                    <span
                                        className="text-[10px] text-muted-foreground cursor-help"
                                        title={exactDate(group.timestamp)}
                                    >
                                        {timeAgo(group.timestamp)}
                                    </span>
                                </div>

                                {/* Field change cards */}
                                <div className="space-y-1.5">
                                    {group.changes.map((change) => {
                                        const cfg = FIELD_CONFIG[change.field] || DEFAULT_CONFIG;
                                        const FieldIcon = cfg.icon;

                                        return (
                                            <div
                                                key={change._id}
                                                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                                            >
                                                {/* Field name with icon */}
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <div className={cn("w-5 h-5 rounded-md flex items-center justify-center", cfg.bg)}>
                                                        <FieldIcon className={cn("h-3 w-3", cfg.color)} />
                                                    </div>
                                                    <span className={cn("text-[11px] font-bold", cfg.color)}>
                                                        {change.field}
                                                    </span>
                                                </div>

                                                {/* Old → New diff */}
                                                <div className="flex items-center gap-1.5 ml-7">
                                                    <span
                                                        className="text-[11px] px-1.5 py-0.5 rounded-md max-w-[40%] truncate bg-red-500/10 text-red-400 border border-red-500/15 line-through"
                                                        title={change.oldValue || "(empty)"}
                                                    >
                                                        {change.oldValue || "(empty)"}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                                                    <span
                                                        className="text-[11px] px-1.5 py-0.5 rounded-md max-w-[40%] truncate bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-medium"
                                                        title={change.newValue || "(empty)"}
                                                    >
                                                        {change.newValue || "(empty)"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
});
