"use client";

import Link from "next/link";
import { Plus, BarChart3, Download, Users } from "lucide-react";

export function QuickActions() {
    return (
        <div className="flex flex-wrap gap-3">
            <Link
                href="/leads"
                className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:scale-[1.02] transition-all duration-200 text-sm font-bold"
            >
                <Plus className="h-4 w-4" />
                Add Lead
            </Link>
            <Link
                href="/reports"
                className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-500 hover:bg-violet-500/20 hover:scale-[1.02] transition-all duration-200 text-sm font-bold"
            >
                <BarChart3 className="h-4 w-4" />
                Reports
            </Link>
            <Link
                href="/api/leads/export"
                className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:scale-[1.02] transition-all duration-200 text-sm font-bold"
            >
                <Download className="h-4 w-4" />
                Export
            </Link>
            <Link
                href="/leads"
                className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:scale-[1.02] transition-all duration-200 text-sm font-bold"
            >
                <Users className="h-4 w-4" />
                View All Leads
            </Link>
        </div>
    );
}
