"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BarChart3, Settings as SettingsIcon, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleSignOut } from "@/lib/actions/auth";

const allRoutes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/",
        color: "text-sky-500",
        roles: ["ADMIN", "MARKETING", "SALES"],
    },
    {
        label: "Leads",
        icon: Users,
        href: "/leads",
        color: "text-violet-500",
        roles: ["ADMIN", "MARKETING", "SALES"],
    },
    {
        label: "Reports",
        icon: BarChart3,
        href: "/reports",
        color: "text-pink-700",
        roles: ["ADMIN"],
    },
    {
        label: "Audit Log",
        icon: Shield,
        href: "/audit",
        color: "text-amber-500",
        roles: ["ADMIN"],
    },
    {
        label: "Settings",
        icon: SettingsIcon,
        href: "/settings",
        color: "text-gray-500",
        roles: ["ADMIN"],
    },
];

export function Sidebar({ className, userRole }: { className?: string; userRole?: string }) {
    const pathname = usePathname();
    const routes = allRoutes.filter((r) => !userRole || r.roles.includes(userRole));

    return (
        <div className={cn("flex flex-col h-full bg-sidebar/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl text-sidebar-foreground shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-primary/5 hover:border-sidebar-border/80", className)}>
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none dark:from-white/5" />

            <div className="px-4 py-6 flex-1 relative z-10 flex flex-col">
                <Link href="/" className="flex items-center pl-2 mb-10 group">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 mr-3 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-white/70">Leads Mgr</h1>
                        <p className="text-xs text-muted-foreground font-medium">Pro Edition</p>
                    </div>
                </Link>

                <div className="space-y-2 flex-1">
                    {routes.map((route) => {
                        const isActive = route.href === "/" ? pathname === "/" : pathname.startsWith(route.href);
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200 relative overflow-hidden",
                                    isActive
                                        ? "text-primary bg-primary/10 border border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)] font-semibold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:translate-x-1"
                                )}
                            >
                                <div className="flex items-center flex-1 relative z-10">
                                    <route.icon className={cn("h-5 w-5 mr-3 transition-colors", isActive ? "text-primary" : route.color)} />
                                    {route.label}
                                </div>
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Logout Area */}
                <div className="mt-auto pt-4 border-t border-white/10">
                    <form action={handleSignOut}>
                        <button className="flex items-center w-full p-3 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors">
                            <LogOut className="h-5 w-5 mr-3" />
                            Logout
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
