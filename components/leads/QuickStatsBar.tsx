/**
 * @component QuickStatsBar
 * @description Horizontal stat cards showing lead counts grouped by status.
 *
 * Highlights the active filter with scale-up + coloured background.
 * Wrapped in `React.memo` — skips re-render unless stats/settings/currentStatus change.
 *
 * @prop {Array} stats — `{ status, count }` per status
 * @prop {object} settings — org settings (provides `.statuses` labels/colours)
 * @prop {string|null} currentStatus — currently selected status filter
 * @prop {Function} onStatusClick — callback when a stat card is clicked
 */
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickStatsBarProps {
    stats: { status: string; count: number }[];
    settings: any;
    currentStatus: string | null;
    onStatusClick: (status: string) => void;
}

export const QuickStatsBar = React.memo(function QuickStatsBar({ stats, settings, currentStatus, onStatusClick }: QuickStatsBarProps) {
    const totalLeads = stats.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide snap-x snap-mandatory">
            {/* Total Card */}
            <div
                onClick={() => onStatusClick("")}
                className={cn(
                    "cursor-pointer group relative overflow-hidden flex flex-col p-3 rounded-2xl border transition-all duration-300 min-w-[100px] shrink-0 snap-start",
                    !currentStatus
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                        : "bg-card/40 border-white/10 hover:border-primary/50 backdrop-blur-xl"
                )}
            >
                <span className={cn("text-[10px] font-bold uppercase tracking-wider opacity-70 whitespace-nowrap", !currentStatus && "opacity-100")}>Total Leads</span>
                <span className="text-xl font-black mt-0.5">{totalLeads}</span>
            </div>

            {/* Status Cards */}
            {settings?.statuses.map((s: any) => {
                const stat = stats.find(st => st.status === s.key);
                const count = stat ? stat.count : 0;
                const isActive = currentStatus === s.key;

                return (
                    <div
                        key={s.key}
                        onClick={() => onStatusClick(s.key)}
                        className={cn(
                            "cursor-pointer group relative overflow-hidden flex flex-col p-3 rounded-2xl border transition-all duration-300 min-w-[100px] shrink-0 snap-start",
                            `[--status-color:${s.color}] [--status-shadow:${s.color}33]`,
                            isActive
                                ? "shadow-[0_10px_15px_-3px_var(--status-shadow)] scale-105 bg-[var(--status-color)] border-[var(--status-color)] text-white"
                                : "bg-card/40 border-white/10 hover:bg-white/5 backdrop-blur-xl"
                        )}
                    >
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider opacity-70 whitespace-nowrap", isActive && "opacity-100")}>{s.emoji && <span className="mr-0.5 normal-case">{s.emoji}</span>}{s.label}</span>
                        <span className="text-xl font-black mt-0.5">{count}</span>

                        {/* Subtle background glow */}
                        {!isActive && (
                            <div
                                className="absolute -right-2 -bottom-2 w-10 h-10 rounded-full opacity-10 group-hover:opacity-20 transition-opacity bg-[var(--status-color)]"
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
});
