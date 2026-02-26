"use client";

import React, { useState, useMemo } from "react";
import { Clock, MessageSquare, CheckCircle2, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TimelineItem {
    _id: string;
    kind: "note" | "action" | "audit";
    type: string;
    message?: string;
    description?: string;
    outcome?: string;
    createdAt: string;
    authorName?: string;
    authorId?: { name?: string };
}

interface LeadTimelineProps {
    timeline: TimelineItem[];
    getTimelineIcon: (kind: string, type: string) => React.ReactNode;
    getTimelineColor: (kind: string, type: string) => string;
    timeAgo: (dateStr: string) => string;
    formatDate: (dateStr: string) => string;
    formatTime: (dateStr: string) => string;
}

type FilterKind = "all" | "note" | "action" | "audit";

const FILTER_OPTIONS: { key: FilterKind; label: string }[] = [
    { key: "all", label: "All" },
    { key: "note", label: "Notes" },
    { key: "action", label: "Actions" },
    { key: "audit", label: "System" },
];

export const LeadTimeline = React.memo(function LeadTimeline({
    timeline,
    getTimelineIcon,
    getTimelineColor,
    timeAgo,
    formatDate,
    formatTime,
}: LeadTimelineProps) {
    const [filter, setFilter] = useState<FilterKind>("all");

    const filteredTimeline = useMemo(() => {
        if (filter === "all") return timeline;
        return timeline.filter((item) => item.kind === filter);
    }, [timeline, filter]);

    // Provide defaults for audit kind icons/colors
    const resolveIcon = (kind: string, type: string) => {
        if (kind === "audit") return <Shield className="h-4 w-4 text-indigo-400" />;
        return getTimelineIcon(kind, type);
    };

    const resolveColor = (kind: string, type: string) => {
        if (kind === "audit") return "bg-indigo-500/10 text-indigo-400";
        return getTimelineColor(kind, type);
    };

    return (
        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Activity Timeline
                    <Badge variant="outline" className="ml-auto rounded-full text-[10px] border-white/10">{filteredTimeline.length} events</Badge>
                </CardTitle>
                {/* Filter Toggles */}
                <div className="flex gap-1.5 mt-2">
                    {FILTER_OPTIONS.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFilter(key)}
                            className={cn(
                                "text-[10px] px-3 py-1 rounded-full border transition-all font-medium",
                                filter === key
                                    ? "bg-primary/20 border-primary/40 text-primary"
                                    : "border-white/10 text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                {filteredTimeline.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No activity yet</p>
                        <p className="text-xs mt-1">Add a note or log an action to get started</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/5" />

                        <div className="space-y-1">
                            {filteredTimeline.map((item) => (
                                <div key={item._id} className="relative flex gap-3 py-3 group">
                                    {/* Icon */}
                                    <div className={cn(
                                        "relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background transition-all",
                                        resolveColor(item.kind, item.type)
                                    )}>
                                        {resolveIcon(item.kind, item.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        {item.type.replace(/_/g, " ")}
                                                    </span>
                                                    {item.kind === "action" && (
                                                        <Badge variant="outline" className="text-[9px] rounded-full border-white/10 px-1.5 h-4">Action</Badge>
                                                    )}
                                                    {item.kind === "audit" && (
                                                        <Badge variant="outline" className="text-[9px] rounded-full border-indigo-400/30 text-indigo-400 px-1.5 h-4">System</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm">{item.message || item.description}</p>
                                                {item.outcome && (
                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                                        Outcome: {item.outcome}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 pt-1">
                                                {timeAgo(item.createdAt)}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                            by {item.authorName || (item.authorId?.name) || "System"} · {formatDate(item.createdAt)} {formatTime(item.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
