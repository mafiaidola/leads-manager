"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickStatsBarProps {
    stats: { status: string; count: number }[];
    settings: any;
    currentStatus: string | null;
    onStatusClick: (status: string) => void;
}

export function QuickStatsBar({ stats, settings, currentStatus, onStatusClick }: QuickStatsBarProps) {
    const totalLeads = stats.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="flex flex-wrap gap-3 mb-6">
            {/* Total Card */}
            <div
                onClick={() => onStatusClick("")}
                className={cn(
                    "cursor-pointer group relative overflow-hidden flex flex-col p-4 min-w-[120px] rounded-2xl border transition-all duration-300",
                    !currentStatus
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                        : "bg-card/40 border-white/10 hover:border-primary/50 backdrop-blur-xl"
                )}
            >
                <span className={cn("text-xs font-bold uppercase tracking-wider opacity-70", !currentStatus && "opacity-100")}>Total Leads</span>
                <span className="text-2xl font-black mt-1">{totalLeads}</span>
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
                            "cursor-pointer group relative overflow-hidden flex flex-col p-4 min-w-[120px] rounded-2xl border transition-all duration-300",
                            `[--status-color:${s.color}] [--status-shadow:${s.color}33]`,
                            isActive
                                ? "shadow-[0_10px_15px_-3px_var(--status-shadow)] scale-105 bg-[var(--status-color)] border-[var(--status-color)] text-white"
                                : "bg-card/40 border-white/10 hover:bg-white/5 backdrop-blur-xl"
                        )}
                    >
                        <span className={cn("text-xs font-bold uppercase tracking-wider opacity-70", isActive && "opacity-100")}>{s.label}</span>
                        <span className="text-2xl font-black mt-1">{count}</span>

                        {/* Subtle background glow */}
                        {!isActive && (
                            <div
                                className="absolute -right-2 -bottom-2 w-12 h-12 rounded-full opacity-10 group-hover:opacity-20 transition-opacity bg-[var(--status-color)]"
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
