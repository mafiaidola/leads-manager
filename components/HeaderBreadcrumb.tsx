"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LayoutDashboard, Users, BarChart3, Settings, Shield } from "lucide-react";

const PAGE_META: Record<string, { label: string; icon: any }> = {
    "/": { label: "Dashboard", icon: LayoutDashboard },
    "/leads": { label: "Leads", icon: Users },
    "/reports": { label: "Reports", icon: BarChart3 },
    "/settings": { label: "Settings", icon: Settings },
    "/audit": { label: "Audit Log", icon: Shield },
};

export function HeaderBreadcrumb() {
    const pathname = usePathname();

    // Build breadcrumb segments
    const segments: { label: string; href: string; icon?: any }[] = [];

    if (pathname === "/") {
        segments.push({ label: "Dashboard", href: "/", icon: LayoutDashboard });
    } else {
        // Find the base route
        const basePath = "/" + pathname.split("/").filter(Boolean)[0];
        const meta = PAGE_META[basePath];
        if (meta) {
            segments.push({ label: meta.label, href: basePath, icon: meta.icon });
        }

        // Check for lead detail page (/leads/[id])
        const parts = pathname.split("/").filter(Boolean);
        if (parts[0] === "leads" && parts[1]) {
            segments.push({ label: "Lead Details", href: pathname });
        }
    }

    if (segments.length === 0) {
        segments.push({ label: "Dashboard", href: "/", icon: LayoutDashboard });
    }

    return (
        <nav className="flex items-center gap-1.5 text-sm">
            {segments.map((seg, i) => {
                const isLast = i === segments.length - 1;
                const Icon = seg.icon;
                return (
                    <span key={seg.href} className="flex items-center gap-1.5">
                        {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />}
                        {isLast ? (
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                                {Icon && <Icon className="h-4 w-4 text-primary" />}
                                {seg.label}
                            </span>
                        ) : (
                            <Link href={seg.href} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                                {Icon && <Icon className="h-4 w-4" />}
                                {seg.label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
