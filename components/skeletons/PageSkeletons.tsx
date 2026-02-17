import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("animate-pulse rounded-xl bg-white/5", className)} {...props} />
    );
}

// ─── Dashboard Skeleton ──────────────────────────────────────────────────────
export function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 space-y-3">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                ))}
            </div>

            {/* Chart area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 space-y-4">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 space-y-4">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// ─── Leads Skeleton ──────────────────────────────────────────────────────────
export function LeadsSkeleton() {
    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-24" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-card/40 p-4 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-6 w-12" />
                    </div>
                ))}
            </div>

            {/* View toggle + filters */}
            <div className="flex justify-between">
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-xl" />
                    <Skeleton className="h-8 w-20 rounded-xl" />
                    <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
                <Skeleton className="h-7 w-36 rounded-xl" />
            </div>

            {/* Filters bar */}
            <div className="flex gap-3 p-4 rounded-2xl bg-card/40 border border-white/10">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-[140px] rounded-xl" />
                <Skeleton className="h-10 w-[140px] rounded-xl" />
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/10 bg-card/40 overflow-hidden">
                <div className="bg-white/5 px-4 py-3 flex gap-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="px-4 py-4 flex gap-4 border-t border-white/5">
                        <Skeleton className="h-4 w-4 rounded" />
                        {Array.from({ length: 6 }).map((_, j) => (
                            <Skeleton key={j} className="h-4 flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Settings Skeleton ──────────────────────────────────────────────────────
export function SettingsSkeleton() {
    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-28 rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Audit Skeleton ──────────────────────────────────────────────────────────
export function AuditSkeleton() {
    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-3 w-56" />
                </div>
            </div>

            <div className="flex gap-3 p-4 rounded-2xl bg-card/40 border border-white/10">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-[160px] rounded-xl" />
                <Skeleton className="h-10 w-[160px] rounded-xl" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-card/40 overflow-hidden">
                <div className="bg-white/5 px-4 py-3 flex gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="px-4 py-4 flex gap-4 border-t border-white/5">
                        {Array.from({ length: 5 }).map((_, j) => (
                            <Skeleton key={j} className="h-4 flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
