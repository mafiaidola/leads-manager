/**
 * @component QuickActions
 * @description Dashboard shortcut links — role-based.
 * - Admin: Add Lead, Reports, Export, View All Leads
 * - Marketing: Reports, View All Leads
 * - Sales: View All Leads only
 */
"use client";

import React from "react";
import Link from "next/link";
import { BarChart3, Users } from "lucide-react";

interface QuickActionsProps {
    userRole?: string;
}

export const QuickActions = React.memo(function QuickActions({ userRole }: QuickActionsProps) {
    const isAdmin = userRole === "ADMIN";
    const isMarketing = userRole === "MARKETING";

    return (
        <div className="flex flex-wrap gap-3">
            {(isAdmin || isMarketing) && (
                <Link
                    href="/reports"
                    className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-500 hover:bg-violet-500/20 hover:scale-[1.02] transition-all duration-200 text-sm font-bold"
                >
                    <BarChart3 className="h-4 w-4" />
                    Reports
                </Link>
            )}
            <Link
                href="/leads"
                className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:scale-[1.02] transition-all duration-200 text-sm font-bold"
            >
                <Users className="h-4 w-4" />
                View All Leads
            </Link>
        </div>
    );
});
