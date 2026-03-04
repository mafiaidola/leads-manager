"use client";

import {
    Building2, Users, BarChart3, TrendingUp, ArrowUpRight, Globe,
    Activity, Trophy, Clock, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrgStat {
    orgId: string;
    orgName: string;
    orgSlug: string;
    orgLogo: string;
    accentColor: string;
    totalLeads: number;
    newLeads7d: number;
    users: number;
    customers: number;
    conversionRate: number;
}

interface ActivityItem {
    action: string;
    entityType: string;
    userName: string;
    orgName: string;
    createdAt: string;
    details: string;
}

interface CrossOrgStats {
    totalOrgs: number;
    totalLeads: number;
    totalUsers: number;
    totalCustomers: number;
    orgStats: OrgStat[];
    recentActivity?: ActivityItem[];
    topPerformer?: OrgStat | null;
}

export function SuperAdminDashboard({ stats }: { stats: CrossOrgStats }) {
    const maxLeads = Math.max(...stats.orgStats.map(o => o.totalLeads), 1);

    return (
        <div className="space-y-6 mb-8">
            {/* ── Global Stats ── */}
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Organization Overview</h3>
                    <p className="text-xs text-muted-foreground">Cross-organization analytics • SuperAdmin</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <GlobalStatCard label="Organizations" value={stats.totalOrgs} icon={Building2} color="amber" />
                <GlobalStatCard label="Total Leads" value={stats.totalLeads} icon={BarChart3} color="blue" />
                <GlobalStatCard label="Total Users" value={stats.totalUsers} icon={Users} color="violet" />
                <GlobalStatCard label="Customers" value={stats.totalCustomers} icon={TrendingUp} color="emerald" />
            </div>

            {/* ── Top Performer + Activity Feed ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Top Performer */}
                {stats.topPerformer && (
                    <Card className="bg-gradient-to-br from-amber-500/10 via-card/60 to-yellow-500/5 border border-amber-500/20 rounded-3xl shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 text-amber-400 mb-4">
                                <Trophy className="h-5 w-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Top Performer</span>
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg accent-gradient-logo"
                                    style={{ '--accent': stats.topPerformer.accentColor } as React.CSSProperties}
                                >
                                    {stats.topPerformer.orgLogo ? (
                                        <img src={stats.topPerformer.orgLogo} alt="" className="h-7 w-7 object-contain" />
                                    ) : (
                                        stats.topPerformer.orgName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{stats.topPerformer.orgName}</p>
                                    <p className="text-xs text-muted-foreground">{stats.topPerformer.orgSlug}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-xl font-bold text-emerald-400">{stats.topPerformer.conversionRate}%</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Conversion</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-xl font-bold">{stats.topPerformer.totalLeads}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Leads</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-xl font-bold text-blue-400">{stats.topPerformer.newLeads7d}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">New 7d</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Activity Feed */}
                <Card className="lg:col-span-2 bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="h-4 w-4 text-green-400" />
                            Activity Feed
                            <span className="text-xs text-muted-foreground font-normal ml-auto">All organizations</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1 max-h-[280px] overflow-y-auto pr-2">
                            {(stats.recentActivity || []).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-all">
                                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${item.action === "CREATE" ? "bg-green-400" :
                                        item.action === "UPDATE" ? "bg-blue-400" :
                                            item.action === "DELETE" ? "bg-red-400" :
                                                "bg-gray-400"
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs truncate">
                                            <span className="font-medium">{item.userName}</span>
                                            <span className="text-muted-foreground"> {item.action.toLowerCase()}d </span>
                                            <span className="text-muted-foreground">{item.entityType}</span>
                                        </p>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Building2 className="h-2.5 w-2.5" /> {item.orgName}
                                            <span className="mx-1">•</span>
                                            <Clock className="h-2.5 w-2.5" /> {timeAgo(item.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Org Comparison Grid ── */}
            <Card className="bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl shadow-xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Organization Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        {stats.orgStats.map((org, idx) => (
                            <div
                                key={org.orgId}
                                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-all group flex-wrap"
                            >
                                {/* Rank */}
                                <span className="text-xs font-bold text-muted-foreground w-6 text-center">
                                    #{idx + 1}
                                </span>

                                {/* Logo */}
                                <div
                                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md accent-gradient-logo"
                                    style={{ '--accent': org.accentColor } as React.CSSProperties}
                                >
                                    {org.orgLogo ? (
                                        <img src={org.orgLogo} alt="" className="h-6 w-6 object-contain" />
                                    ) : (
                                        org.orgName.charAt(0).toUpperCase()
                                    )}
                                </div>

                                {/* Name */}
                                <div className="min-w-0 flex-1 sm:min-w-[120px]">
                                    <p className="text-sm font-semibold truncate">{org.orgName}</p>
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Globe className="h-2.5 w-2.5" /> {org.orgSlug}
                                    </p>
                                </div>

                                {/* Bar */}
                                <div className="flex-1 hidden md:block">
                                    <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500 accent-gradient-bar"
                                            style={{
                                                width: `${Math.max((org.totalLeads / maxLeads) * 100, 3)}%`,
                                                '--accent': org.accentColor,
                                            } as React.CSSProperties}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-3 sm:gap-4 text-xs ml-auto">
                                    <div className="text-center">
                                        <p className="font-bold text-foreground">{org.totalLeads}</p>
                                        <p className="text-muted-foreground">Leads</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-foreground">{org.users}</p>
                                        <p className="text-muted-foreground">Users</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-emerald-400 flex items-center gap-0.5 justify-center">
                                            {org.conversionRate}%
                                            {org.conversionRate > 0 && <ArrowUpRight className="h-3 w-3" />}
                                        </p>
                                        <p className="text-muted-foreground">Conv</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-blue-400">{org.newLeads7d}</p>
                                        <p className="text-muted-foreground">New 7d</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {stats.orgStats.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No active organizations found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Org Comparison Bars (Visual Chart) ── */}
            {stats.orgStats.length > 1 && (
                <Card className="bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-400" />
                            Lead Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.orgStats.map(org => {
                                const pct = maxLeads > 0 ? Math.round((org.totalLeads / maxLeads) * 100) : 0;
                                return (
                                    <div key={org.orgId} className="flex items-center gap-3">
                                        <div className="w-[100px] text-xs font-medium truncate">{org.orgName}</div>
                                        <div className="flex-1 h-8 bg-white/5 rounded-xl overflow-hidden relative">
                                            <div
                                                className="h-full rounded-xl flex items-center px-3 transition-all duration-700 accent-gradient-bar-soft"
                                                style={{
                                                    width: `${Math.max(pct, 5)}%`,
                                                    '--accent': org.accentColor,
                                                } as React.CSSProperties}
                                            >
                                                <span className="text-[11px] font-bold text-white whitespace-nowrap">{org.totalLeads} leads</span>
                                            </div>
                                        </div>
                                        <div className="w-[50px] text-xs font-bold text-right text-emerald-400">{org.conversionRate}%</div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function GlobalStatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
    const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
        amber: { bg: "from-amber-500/10 to-orange-500/10", icon: "text-amber-500", border: "border-amber-500/20" },
        blue: { bg: "from-blue-500/10 to-cyan-500/10", icon: "text-blue-500", border: "border-blue-500/20" },
        violet: { bg: "from-violet-500/10 to-purple-500/10", icon: "text-violet-500", border: "border-violet-500/20" },
        emerald: { bg: "from-emerald-500/10 to-green-500/10", icon: "text-emerald-500", border: "border-emerald-500/20" },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <Card className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl`}>
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center ${c.icon}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function timeAgo(dateStr: string): string {
    if (!dateStr) return "";
    const now = Date.now();
    const d = new Date(dateStr).getTime();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
