"use client";

import React from "react";
import { Clock, MessageSquare, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TimelineItem {
    _id: string;
    kind: "note" | "action";
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

export const LeadTimeline = React.memo(function LeadTimeline({
    timeline,
    getTimelineIcon,
    getTimelineColor,
    timeAgo,
    formatDate,
    formatTime,
}: LeadTimelineProps) {
    return (
        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Activity Timeline
                    <Badge variant="outline" className="ml-auto rounded-full text-[10px] border-white/10">{timeline.length} events</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {timeline.length === 0 ? (
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
                            {timeline.map((item) => (
                                <div key={item._id} className="relative flex gap-3 py-3 group">
                                    {/* Icon */}
                                    <div className={cn(
                                        "relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background transition-all",
                                        getTimelineColor(item.kind, item.type)
                                    )}>
                                        {getTimelineIcon(item.kind, item.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        {item.kind === "action" ? item.type.replace("_", " ") : item.type.replace("_", " ")}
                                                    </span>
                                                    {item.kind === "action" && (
                                                        <Badge variant="outline" className="text-[9px] rounded-full border-white/10 px-1.5 h-4">Action</Badge>
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
