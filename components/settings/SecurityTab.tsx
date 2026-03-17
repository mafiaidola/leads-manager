/**
 * @component SecurityTab
 * @description SuperAdmin-only security overview panel.
 * Shows: all users with last-login status, recent audit events,
 * and a Danger Zone with system-level actions.
 */
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Shield, Clock, Activity, AlertTriangle, Search, CheckCircle2,
    XCircle, Users, UserCheck, UserX, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SecurityUser {
    _id: string; name: string; username: string; role: string;
    active: boolean; isSuperAdmin?: boolean; orgName: string;
    lastLogin: string | null; createdAt: string;
}
interface AuditEvent {
    _id: string; action: string; entityType: string;
    userName: string; details: string; createdAt: string;
}
interface SecurityTabProps {
    users: SecurityUser[];
    recentEvents: AuditEvent[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_COLOR: Record<string, string> = {
    CREATE:      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    UPDATE:      "text-blue-400 bg-blue-500/10 border-blue-500/20",
    DELETE:      "text-red-400 bg-red-500/10 border-red-500/20",
    LOGIN:       "text-violet-400 bg-violet-500/10 border-violet-500/20",
    EXPORT:      "text-amber-400 bg-amber-500/10 border-amber-500/20",
    IMPORT:      "text-teal-400 bg-teal-500/10 border-teal-500/20",
    BULK_UPDATE: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    BULK_DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
};

function relativeTime(iso: string | null): string {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
}

function loginStatus(lastLogin: string | null): { label: string; class: string } {
    if (!lastLogin) return { label: "Never logged in", class: "text-muted-foreground" };
    const diff = Date.now() - new Date(lastLogin).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1)  return { label: "Active today",   class: "text-emerald-400" };
    if (days < 7)  return { label: `${days}d ago`,   class: "text-blue-400" };
    if (days < 30) return { label: `${days}d ago`,   class: "text-amber-400" };
    return             { label: `${days}d ago`,       class: "text-red-400" };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SecurityTab({ users, recentEvents }: SecurityTabProps) {
    const [search, setSearch] = useState("");

    // Stats
    const stats = useMemo(() => ({
        total:    users.length,
        active:   users.filter(u => u.active).length,
        inactive: users.filter(u => !u.active).length,
        neverLoggedIn: users.filter(u => !u.lastLogin).length,
        activeToday: users.filter(u => {
            if (!u.lastLogin) return false;
            return Date.now() - new Date(u.lastLogin).getTime() < 86400000;
        }).length,
    }), [users]);

    const filtered = useMemo(() =>
        users.filter(u =>
            !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.orgName.toLowerCase().includes(search.toLowerCase())
        ),
    [users, search]);

    return (
        <div className="space-y-6">

            {/* ── Stats row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: "Total Users",    value: stats.total,        icon: Users,      color: "text-primary" },
                    { label: "Active",         value: stats.active,       icon: UserCheck,  color: "text-emerald-400" },
                    { label: "Inactive",       value: stats.inactive,     icon: UserX,      color: "text-red-400" },
                    { label: "Active Today",   value: stats.activeToday,  icon: TrendingUp, color: "text-blue-400" },
                    { label: "Never Logged In",value: stats.neverLoggedIn,icon: AlertTriangle,color: "text-amber-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Icon className={cn("h-5 w-5 flex-shrink-0", color)} />
                            <div>
                                <div className={cn("text-2xl font-bold", color)}>{value}</div>
                                <div className="text-[10px] text-muted-foreground">{label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ── User Login Status Table ───────────────────────── */}
                <Card className="lg:col-span-2 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-violet-400" />
                            User Security Overview
                        </CardTitle>
                        <CardDescription>Last login status for all users across all organizations.</CardDescription>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search user or organization…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 h-8 text-xs rounded-xl border-white/10 bg-white/5"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5 max-h-[440px] overflow-y-auto scrollbar-hide pr-1">
                            {filtered.map(user => {
                                const status = loginStatus(user.lastLogin);
                                const initials = user.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
                                return (
                                    <div key={user._id} className={cn(
                                        "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                                        user.active
                                            ? "border-white/5 bg-white/5 hover:bg-white/8"
                                            : "border-red-500/10 bg-red-500/5 opacity-60"
                                    )}>
                                        {/* Avatar */}
                                        <div className={cn(
                                            "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                            user.active ? "bg-primary/15 text-primary" : "bg-red-500/15 text-red-400"
                                        )}>
                                            {initials}
                                        </div>

                                        {/* Name + org */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-sm font-semibold">{user.name}</span>
                                                {!user.active && <Badge variant="outline" className="text-[9px] h-4 px-1 text-red-400 border-red-400/30">Inactive</Badge>}
                                                {user.isSuperAdmin && <Badge variant="outline" className="text-[9px] h-4 px-1 text-amber-400 border-amber-400/30">SuperAdmin</Badge>}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">{user.orgName} · @{user.username}</div>
                                        </div>

                                        {/* Role */}
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] uppercase tracking-wide h-5 px-2 border flex-shrink-0",
                                            user.role === "ADMIN" ? "text-violet-400 border-violet-400/30 bg-violet-500/10" :
                                            user.role === "MARKETING" ? "text-teal-400 border-teal-400/30 bg-teal-500/10" :
                                            "text-blue-400 border-blue-400/30 bg-blue-500/10"
                                        )}>
                                            {user.role}
                                        </Badge>

                                        {/* Last login */}
                                        <div className="text-right flex-shrink-0">
                                            <div className={cn("text-xs font-medium flex items-center gap-1", status.class)}>
                                                <Clock className="h-3 w-3" />
                                                {status.label}
                                            </div>
                                            {user.lastLogin && (
                                                <div className="text-[10px] text-muted-foreground/50">
                                                    {new Date(user.lastLogin).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Active indicator */}
                                        <div className="flex-shrink-0">
                                            {user.active
                                                ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                : <XCircle className="h-4 w-4 text-red-400" />
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Recent Audit Events ──────────────────────────── */}
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-400" />
                            Recent Events
                        </CardTitle>
                        <CardDescription className="text-xs">Last 30 system audit events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[440px] overflow-y-auto scrollbar-hide pr-1">
                            {recentEvents.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">No events yet</div>
                            ) : recentEvents.map(evt => (
                                <div key={evt._id} className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/8 transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] uppercase tracking-wide h-4 px-1.5 border",
                                            ACTION_COLOR[evt.action] || "text-muted-foreground"
                                        )}>
                                            {evt.action}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground/60 font-mono">{evt.entityType}</span>
                                        <span className="ml-auto text-[10px] text-muted-foreground/50">{relativeTime(evt.createdAt)}</span>
                                    </div>
                                    <div className="text-xs text-foreground/80 truncate">{evt.details}</div>
                                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">by {evt.userName}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Danger Zone ───────────────────────────────────────── */}
            <Card className="rounded-3xl border-red-500/20 bg-red-500/5 backdrop-blur-xl shadow-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-400/70">
                        Irreversible system actions. Use with caution.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                            onClick={() => {
                                if (confirm("Force logout all users? They will need to log in again.")) {
                                    // Could call a server action to invalidate all sessions
                                    // For now: show a toast (future implementation)
                                    alert("Feature coming soon: Force logout all sessions.");
                                }
                            }}
                        >
                            Force Logout All Users
                        </Button>
                    </div>
                    <p className="text-[10px] text-red-400/50 mt-3">
                        These actions affect all users across all organizations and cannot be undone.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
