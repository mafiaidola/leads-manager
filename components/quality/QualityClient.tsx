"use client";

import { useState, useCallback, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertTriangle, Clock, Target, UserCheck, Users, Search,
    Download, ChevronRight, TrendingDown, TrendingUp, Timer,
    DollarSign, BadgeDollarSign, Package, CalendarDays, Filter,
    BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAbandonedLeads, getInactiveUsers, getTargetProgress, getUserPerformance } from "@/lib/actions/quality";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { getSalesQuality, type SalesQualityData, type SalesQualityFilters } from "@/lib/actions/salesQuality";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

// ─── Types ───────────────────────────────────────────────────────────────────
interface QualityClientProps {
    settings: any;
    users: any[];
    currentUserRole: string;
}

const TABS = [
    { key: "abandoned", label: "Abandoned Leads", icon: AlertTriangle, color: "text-red-400" },
    { key: "inactive", label: "Inactive Users", icon: Clock, color: "text-amber-400" },
    { key: "targets", label: "Target Tracking", icon: Target, color: "text-emerald-400" },
    { key: "performance", label: "User Performance", icon: UserCheck, color: "text-blue-400" },
    { key: "salesPerf", label: "Sales Performance", icon: DollarSign, color: "text-cyan-400" },
] as const;

type TabKey = typeof TABS[number]["key"];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function QualityClient({ settings, users }: QualityClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>("abandoned");
    const [isPending, startTransition] = useTransition();

    // Abandoned Leads state
    const [abandonedDays, setAbandonedDays] = useState("7");
    const [abandonedAgent, setAbandonedAgent] = useState("all");
    const [abandonedData, setAbandonedData] = useState<any>(null);

    // Inactive Users state
    const [inactiveDays, setInactiveDays] = useState("7");
    const [inactiveData, setInactiveData] = useState<any>(null);

    // Targets state
    const [targetData, setTargetData] = useState<any>(null);

    // Performance state
    const [perfUserId, setPerfUserId] = useState("");
    const [perfData, setPerfData] = useState<any>(null);

    // Sales Performance state
    const [salesPerfData, setSalesPerfData] = useState<any>(null);

    // ─── Data fetchers ───────────────────────────────────────────────────────
    const loadAbandoned = useCallback(() => {
        startTransition(async () => {
            const data = await getAbandonedLeads(Number(abandonedDays), { agentId: abandonedAgent });
            setAbandonedData(data);
        });
    }, [abandonedDays, abandonedAgent]);

    const loadInactive = useCallback(() => {
        startTransition(async () => {
            const data = await getInactiveUsers(Number(inactiveDays));
            setInactiveData(data);
        });
    }, [inactiveDays]);

    const loadTargets = useCallback(() => {
        startTransition(async () => {
            const data = await getTargetProgress();
            setTargetData(data);
        });
    }, []);

    const loadPerformance = useCallback(() => {
        if (!perfUserId) return;
        startTransition(async () => {
            const data = await getUserPerformance(perfUserId);
            setPerfData(data);
        });
    }, [perfUserId]);

    const loadSalesPerf = useCallback(() => {
        startTransition(async () => {
            const data = await getDashboardStats("all");
            setSalesPerfData(data);
        });
    }, []);

    // Status label resolver
    const statusLabel = useCallback((key: string) => {
        const s = settings?.statuses?.find((st: any) => st.key === key);
        return s?.label || key?.replace(/_/g, " ");
    }, [settings]);

    const sourceLabel = useCallback((key: string) => {
        const s = settings?.sources?.find((src: any) => src.key === key);
        return s?.label || key?.replace(/_/g, " ");
    }, [settings]);

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 flex-wrap">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                            activeTab === tab.key
                                ? "bg-primary/15 text-primary border border-primary/30 shadow-lg shadow-primary/10"
                                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/10"
                        )}
                    >
                        <tab.icon className={cn("h-4 w-4", activeTab === tab.key ? "text-primary" : tab.color)} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── Tab 1: Abandoned Leads ──────────────────────────────────────── */}
            {activeTab === "abandoned" && (
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                    Abandoned Leads
                                </CardTitle>
                                <CardDescription>Leads with no status change for the selected period</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Select value={abandonedDays} onValueChange={setAbandonedDays}>
                                    <SelectTrigger className="w-[130px] rounded-xl border-white/10 bg-white/5 h-9 text-xs">
                                        <Timer className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        <SelectItem value="3">3 days</SelectItem>
                                        <SelectItem value="7">7 days</SelectItem>
                                        <SelectItem value="14">14 days</SelectItem>
                                        <SelectItem value="30">30 days</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={abandonedAgent} onValueChange={setAbandonedAgent}>
                                    <SelectTrigger className="w-[150px] rounded-xl border-white/10 bg-white/5 h-9 text-xs">
                                        <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                        <SelectValue placeholder="All Agents" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        <SelectItem value="all">All Agents</SelectItem>
                                        {users.map((u: any) => (
                                            <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={loadAbandoned}
                                    disabled={isPending}
                                    className="rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 h-9"
                                    size="sm"
                                >
                                    <Search className="h-3.5 w-3.5 mr-1.5" />
                                    {isPending ? "Loading…" : "Scan"}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!abandonedData ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Click <strong>Scan</strong> to find abandoned leads</p>
                            </div>
                        ) : abandonedData.leads.length === 0 ? (
                            <div className="text-center py-16 text-emerald-400">
                                <UserCheck className="h-10 w-10 mx-auto mb-3" />
                                <p className="text-sm font-medium">No abandoned leads found! 🎉</p>
                                <p className="text-xs text-muted-foreground mt-1">All leads have been updated within {abandonedDays} days</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <Badge variant="outline" className="text-red-400 border-red-500/30 bg-red-500/10 px-3 py-1">
                                        {abandonedData.total} abandoned leads
                                    </Badge>
                                </div>
                                <div className="overflow-x-auto rounded-2xl border border-white/5">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 bg-white/5">
                                                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Lead</th>
                                                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                                                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Agent</th>
                                                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Days Stale</th>
                                                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Last Updated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {abandonedData.leads.map((lead: any) => (
                                                <tr
                                                    key={lead._id}
                                                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                                    onClick={() => router.push(`/leads/${lead._id}`)}
                                                >
                                                    <td className="p-3">
                                                        <div className="font-medium">{lead.name}</div>
                                                        <div className="text-xs text-muted-foreground">{lead.phone || lead.email}</div>
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className="text-[10px] border-white/20">
                                                            {statusLabel(lead.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground text-xs">
                                                        {lead.assignedTo?.name || "Unassigned"}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={cn(
                                                            "font-bold text-sm",
                                                            lead.daysSinceUpdate >= 14 ? "text-red-400" :
                                                            lead.daysSinceUpdate >= 7 ? "text-amber-400" :
                                                            "text-yellow-400"
                                                        )}>
                                                            {lead.daysSinceUpdate}d
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-xs text-muted-foreground">
                                                        {new Date(lead.updatedAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── Tab 2: Inactive Users ──────────────────────────────────────── */}
            {activeTab === "inactive" && (
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-amber-400" />
                                    Inactive Users
                                </CardTitle>
                                <CardDescription>Users who haven&apos;t logged in recently</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={inactiveDays} onValueChange={setInactiveDays}>
                                    <SelectTrigger className="w-[130px] rounded-xl border-white/10 bg-white/5 h-9 text-xs">
                                        <Timer className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        <SelectItem value="3">3 days</SelectItem>
                                        <SelectItem value="7">7 days</SelectItem>
                                        <SelectItem value="14">14 days</SelectItem>
                                        <SelectItem value="30">30 days</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={loadInactive}
                                    disabled={isPending}
                                    className="rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 h-9"
                                    size="sm"
                                >
                                    <Search className="h-3.5 w-3.5 mr-1.5" />
                                    {isPending ? "Loading…" : "Scan"}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!inactiveData ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Click <strong>Scan</strong> to find inactive users</p>
                            </div>
                        ) : inactiveData.length === 0 ? (
                            <div className="text-center py-16 text-emerald-400">
                                <UserCheck className="h-10 w-10 mx-auto mb-3" />
                                <p className="text-sm font-medium">All users are active! 🎉</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 px-3 py-1 mb-4">
                                    {inactiveData.length} inactive users
                                </Badge>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {inactiveData.map((user: any) => (
                                        <div key={user._id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/20 transition-all">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-10 w-10 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-400">
                                                    {user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm">{user.name}</div>
                                                    <div className="text-[11px] text-muted-foreground">@{user.username}</div>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Role</span>
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{user.role}</Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Last Login</span>
                                                    <span className="text-red-400 font-medium">
                                                        {user.daysSinceLogin !== null ? `${user.daysSinceLogin}d ago` : "Never"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Assigned Leads</span>
                                                    <span className="font-medium">{user.totalLeads}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── Tab 3: Target Tracking ─────────────────────────────────────── */}
            {activeTab === "targets" && (
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Target className="h-5 w-5 text-emerald-400" />
                                    Target Tracking
                                </CardTitle>
                                <CardDescription>Monthly progress toward org goals</CardDescription>
                            </div>
                            <Button
                                onClick={loadTargets}
                                disabled={isPending}
                                className="rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 h-9"
                                size="sm"
                            >
                                {isPending ? "Loading…" : "Load Progress"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!targetData ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <Target className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Click <strong>Load Progress</strong> to view target completion</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {targetData.targets && (
                                    <div className="flex gap-4 mb-6 flex-wrap">
                                        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                                            <span className="text-muted-foreground">Monthly Lead Target: </span>
                                            <span className="font-bold text-emerald-400">{targetData.targets.monthlyLeadTarget}</span>
                                        </div>
                                        <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                                            <span className="text-muted-foreground">Conversion Target: </span>
                                            <span className="font-bold text-blue-400">{targetData.targets.monthlyConversionTarget}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {targetData.users.map((user: any) => (
                                        <div key={user._id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">{user.name}</span>
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{user.role}</Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="text-muted-foreground">{user.leadsThisMonth} leads</span>
                                                    <span className="text-muted-foreground">{user.conversionsThisMonth} conversions</span>
                                                </div>
                                            </div>
                                            {/* Lead Target Bar */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-muted-foreground">Leads</span>
                                                    <span className={cn(
                                                        "font-bold",
                                                        user.leadTargetPct >= 80 ? "text-emerald-400" :
                                                        user.leadTargetPct >= 50 ? "text-amber-400" : "text-red-400"
                                                    )}>{user.leadTargetPct}%</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-500",
                                                            user.leadTargetPct >= 80 ? "bg-emerald-500" :
                                                            user.leadTargetPct >= 50 ? "bg-amber-500" : "bg-red-500"
                                                        )}
                                                        style={{ width: `${Math.min(user.leadTargetPct, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            {/* Conversion Target Bar */}
                                            <div className="space-y-1.5 mt-2">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-muted-foreground">Conversions</span>
                                                    <span className={cn(
                                                        "font-bold",
                                                        user.conversionTargetPct >= 80 ? "text-emerald-400" :
                                                        user.conversionTargetPct >= 50 ? "text-amber-400" : "text-red-400"
                                                    )}>{user.conversionTargetPct}%</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-500",
                                                            user.conversionTargetPct >= 80 ? "bg-blue-500" :
                                                            user.conversionTargetPct >= 50 ? "bg-amber-500" : "bg-red-500"
                                                        )}
                                                        style={{ width: `${Math.min(user.conversionTargetPct, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── Tab 4: User Performance ────────────────────────────────────── */}
            {activeTab === "performance" && (
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-blue-400" />
                                    User Performance
                                </CardTitle>
                                <CardDescription>Detailed per-user metrics and analytics</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={perfUserId} onValueChange={setPerfUserId}>
                                    <SelectTrigger className="w-[180px] rounded-xl border-white/10 bg-white/5 h-9 text-xs">
                                        <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                        <SelectValue placeholder="Select user…" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        {users.map((u: any) => (
                                            <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={loadPerformance}
                                    disabled={isPending || !perfUserId}
                                    className="rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 h-9"
                                    size="sm"
                                >
                                    {isPending ? "Loading…" : "Analyze"}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!perfData?.performance ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Select a user and click <strong>Analyze</strong></p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* KPI Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: "Total Leads", value: perfData.performance.totalLeads, icon: Users, color: "text-violet-400" },
                                        { label: "Conversions", value: perfData.performance.customers, icon: TrendingUp, color: "text-emerald-400" },
                                        { label: "Conv. Rate", value: `${perfData.performance.conversionRate}%`, icon: Target, color: "text-blue-400" },
                                        { label: "Avg Response", value: `${perfData.performance.avgResponseHours}h`, icon: Timer, color: "text-amber-400" },
                                    ].map(kpi => (
                                        <div key={kpi.label} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                            <kpi.icon className={cn("h-5 w-5 mx-auto mb-2", kpi.color)} />
                                            <div className="text-2xl font-extrabold">{kpi.value}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{kpi.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Status Distribution */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                            <ChevronRight className="h-4 w-4 text-primary" />
                                            Status Distribution
                                        </h4>
                                        <div className="space-y-2">
                                            {perfData.performance.statusDistribution.map((s: any) => {
                                                const pct = perfData.performance.totalLeads > 0
                                                    ? Math.round((s.count / perfData.performance.totalLeads) * 100)
                                                    : 0;
                                                return (
                                                    <div key={s.status} className="space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-muted-foreground">{statusLabel(s.status)}</span>
                                                            <span className="font-medium">{s.count} ({pct}%)</span>
                                                        </div>
                                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-primary/60 transition-all duration-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                            <ChevronRight className="h-4 w-4 text-blue-400" />
                                            Source Distribution
                                        </h4>
                                        <div className="space-y-2">
                                            {perfData.performance.sourceDistribution.map((s: any) => {
                                                const pct = perfData.performance.totalLeads > 0
                                                    ? Math.round((s.count / perfData.performance.totalLeads) * 100)
                                                    : 0;
                                                return (
                                                    <div key={s.source} className="space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-muted-foreground">{sourceLabel(s.source)}</span>
                                                            <span className="font-medium">{s.count} ({pct}%)</span>
                                                        </div>
                                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-blue-500/60 transition-all duration-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── Tab 5: Sales Performance (Full Analytics Dashboard) ─── */}
            {activeTab === "salesPerf" && (
                <SalesAnalyticsDashboard
                    settings={settings}
                    users={users}
                    isPending={isPending}
                    startTransition={startTransition}
                />
            )}
        </div>
    );
}

// ─── Sales Analytics Dashboard Sub-Component ─────────────────────────────────
interface SalesAnalyticsDashboardProps {
    settings: any;
    users: any[];
    isPending: boolean;
    startTransition: (fn: () => void) => void;
}

function SalesAnalyticsDashboard({ settings, users, isPending, startTransition }: SalesAnalyticsDashboardProps) {
    const [period, setPeriod] = useState<SalesQualityFilters["period"]>("monthly");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [productFilter, setProductFilter] = useState("all");
    const [data, setData] = useState<SalesQualityData | null>(null);
    const [showUserPicker, setShowUserPicker] = useState(false);

    const load = useCallback(() => {
        startTransition(async () => {
            const result = await getSalesQuality({
                period,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                userIds: selectedUsers.length > 0 ? selectedUsers : undefined,
                productKey: productFilter !== "all" ? productFilter : undefined,
            });
            setData(result);
        });
    }, [period, dateFrom, dateTo, selectedUsers, productFilter, startTransition]);

    const handleExportCSV = useCallback(() => {
        if (!data) return;
        const bom = "\uFEFF";
        const rows: string[][] = [];
        rows.push(["User", "Role", "Leads", "Conversions", "Conv. Rate", "Product Price Total", "Sales Price Total", "Discount %", "Margin", "Avg Deal"]);
        data.users.forEach(u => {
            rows.push([
                u.userName, u.userRole, String(u.totalLeads), String(u.conversions),
                `${u.conversionRate}%`, String(u.totalProductPrice), String(u.totalCustomPrice),
                `${u.discountPct}%`, String(u.margin), String(u.avgDealSize),
            ]);
        });
        rows.push([]);
        rows.push(["Product", "Units Sold", "Base Price", "Avg User Price", "Avg Discount %", "Total Revenue"]);
        data.products.forEach(p => {
            rows.push([p.productLabel, String(p.unitsSold), String(p.basePrice), String(p.avgUserPrice), `${p.avgDiscount}%`, String(p.totalRevenue)]);
        });
        const csv = bom + rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sales_quality_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [data, period]);

    const toggleUser = (uid: string) => {
        setSelectedUsers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
    };

    const salesUsers = users.filter(u => ["ADMIN", "SALES"].includes(u.role));

    return (
        <div className="space-y-5">
            {/* ── Filters ──────────────────────────────────────── */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Period */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Period</label>
                            <div className="flex gap-1">
                                {(["daily", "weekly", "monthly", "annually"] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                            period === p
                                                ? "bg-primary/20 text-primary border border-primary/30"
                                                : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10"
                                        )}
                                    >
                                        {p === "daily" ? "Today" : p === "weekly" ? "Week" : p === "monthly" ? "Month" : "Year"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date From */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">From</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="h-9 w-36 rounded-xl border-white/10 bg-black/20 text-xs"
                            />
                        </div>

                        {/* Date To */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">To</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="h-9 w-36 rounded-xl border-white/10 bg-black/20 text-xs"
                            />
                        </div>

                        {/* Product Filter */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product</label>
                            <Select value={productFilter} onValueChange={setProductFilter}>
                                <SelectTrigger className="h-9 w-40 rounded-xl border-white/10 bg-black/20 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Products</SelectItem>
                                    {(settings?.products || []).map((p: any) => (
                                        <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User Picker */}
                        <div className="space-y-1 relative">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Users</label>
                            <button
                                onClick={() => setShowUserPicker(!showUserPicker)}
                                className="h-9 px-3 rounded-xl border border-white/10 bg-black/20 text-xs flex items-center gap-1.5 hover:bg-white/10 transition-all min-w-[120px]"
                            >
                                <Filter className="h-3 w-3" />
                                {selectedUsers.length === 0 ? "All Users" : `${selectedUsers.length} selected`}
                            </button>
                            {showUserPicker && (
                                <div className="absolute top-full left-0 mt-1 z-50 w-56 max-h-56 overflow-auto rounded-2xl bg-card/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2">
                                    <button
                                        onClick={() => { setSelectedUsers([]); setShowUserPicker(false); }}
                                        className="w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-white/10 text-muted-foreground mb-1"
                                    >
                                        ✕ Clear All
                                    </button>
                                    {salesUsers.map(u => (
                                        <button
                                            key={u._id}
                                            onClick={() => toggleUser(u._id)}
                                            className={cn(
                                                "w-full text-left text-xs px-3 py-1.5 rounded-lg transition-all",
                                                selectedUsers.includes(u._id)
                                                    ? "bg-primary/20 text-primary"
                                                    : "hover:bg-white/10 text-foreground"
                                            )}
                                        >
                                            {selectedUsers.includes(u._id) ? "✓ " : ""}{u.name}
                                            <Badge variant="outline" className="ml-2 text-[8px] h-3.5 px-1">{u.role}</Badge>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 ml-auto">
                            <Button
                                onClick={load}
                                disabled={isPending}
                                className="rounded-xl bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 h-9"
                                size="sm"
                            >
                                <Search className="h-3.5 w-3.5 mr-1.5" />
                                {isPending ? "Loading…" : "Analyze"}
                            </Button>
                            {data && (
                                <Button
                                    onClick={handleExportCSV}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-white/10 h-9"
                                >
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Export CSV
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── KPI Summary ──────────────────────────────────── */}
            {data && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                        {[
                            { label: "Total Leads", value: data.summary.totalLeads.toLocaleString(), icon: Users, color: "text-blue-400" },
                            { label: "Conversions", value: data.summary.totalConversions.toLocaleString(), icon: Target, color: "text-emerald-400" },
                            { label: "Conv. Rate", value: `${data.summary.conversionRate}%`, icon: TrendingUp, color: "text-cyan-400" },
                            { label: `Product Total`, value: `${data.summary.currency} ${data.summary.totalProductPrice.toLocaleString()}`, icon: Package, color: "text-violet-400" },
                            { label: `Sales Total`, value: `${data.summary.currency} ${data.summary.totalCustomPrice.toLocaleString()}`, icon: DollarSign, color: "text-amber-400" },
                            { label: "Margin", value: `${data.summary.currency} ${data.summary.totalMargin.toLocaleString()}`, icon: data.summary.totalMargin >= 0 ? TrendingUp : TrendingDown, color: data.summary.totalMargin >= 0 ? "text-emerald-400" : "text-red-400" },
                            { label: "Avg Discount", value: `${data.summary.avgDiscountPct}%`, icon: BadgeDollarSign, color: data.summary.avgDiscountPct > 0 ? "text-red-400" : "text-emerald-400" },
                            { label: "Period", value: period.charAt(0).toUpperCase() + period.slice(1), icon: CalendarDays, color: "text-primary" },
                        ].map((kpi, i) => (
                            <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <kpi.icon className={cn("h-4 w-4 mx-auto mb-1.5", kpi.color)} />
                                <div className="text-sm font-extrabold leading-tight">{kpi.value}</div>
                                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">{kpi.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── User Performance Table ──────────────────── */}
                    {data.users.length > 0 && (
                        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-blue-400" />
                                    User Performance
                                    <Badge variant="outline" className="ml-auto text-[10px] border-white/10">{data.users.length} users</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider">#</th>
                                                <th className="text-left py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider">User</th>
                                                <th className="text-center py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider">Leads</th>
                                                <th className="text-center py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider">Sales</th>
                                                <th className="text-center py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider">Rate</th>
                                                <th className="text-right py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider">Product Total</th>
                                                <th className="text-right py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider">Sales Total</th>
                                                <th className="text-center py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider">Discount</th>
                                                <th className="text-right py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider">Margin</th>
                                                <th className="text-right py-2 px-2 font-bold text-muted-foreground uppercase tracking-wider">Avg Deal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.users.map((u, i) => {
                                                const medals = ["🥇", "🥈", "🥉"];
                                                return (
                                                    <tr key={u.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="py-2.5 px-2 text-center">{medals[i] || `${i + 1}`}</td>
                                                        <td className="py-2.5 px-2">
                                                            <div className="font-semibold">{u.userName}</div>
                                                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 mt-0.5">{u.userRole}</Badge>
                                                        </td>
                                                        <td className="py-2.5 px-2 text-center font-mono">{u.totalLeads}</td>
                                                        <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400">{u.conversions}</td>
                                                        <td className="py-2.5 px-2 text-center">
                                                            <span className={cn("font-bold", u.conversionRate >= 30 ? "text-emerald-400" : u.conversionRate >= 15 ? "text-amber-400" : "text-red-400")}>
                                                                {u.conversionRate}%
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">{u.totalProductPrice.toLocaleString()}</td>
                                                        <td className="py-2.5 px-2 text-right font-mono font-semibold">{u.totalCustomPrice.toLocaleString()}</td>
                                                        <td className="py-2.5 px-2 text-center">
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                                                                u.discountPct > 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                                                            )}>
                                                                {u.discountPct > 0 ? "-" : "+"}{Math.abs(u.discountPct)}%
                                                            </span>
                                                        </td>
                                                        <td className={cn("py-2.5 px-2 text-right font-mono font-bold", u.margin >= 0 ? "text-emerald-400" : "text-red-400")}>
                                                            {u.margin >= 0 ? "+" : ""}{u.margin.toLocaleString()}
                                                        </td>
                                                        <td className="py-2.5 px-2 text-right font-mono">{u.avgDealSize.toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Product Performance Table ───────────────── */}
                    {data.products.length > 0 && (
                        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Package className="h-4 w-4 text-violet-400" />
                                    Product Performance
                                    <Badge variant="outline" className="ml-auto text-[10px] border-white/10">{data.products.length} products</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-2 px-3 font-bold text-muted-foreground uppercase tracking-wider">Product</th>
                                                <th className="text-center py-2 px-3 font-bold text-muted-foreground uppercase tracking-wider">Units Sold</th>
                                                <th className="text-right py-2 px-3 font-bold text-muted-foreground uppercase tracking-wider">Base Price</th>
                                                <th className="text-right py-2 px-3 font-bold text-muted-foreground uppercase tracking-wider">Avg User Price</th>
                                                <th className="text-center py-2 px-3 font-bold text-muted-foreground uppercase tracking-wider">Avg Discount</th>
                                                <th className="text-right py-2 px-3 font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.products.map(p => (
                                                <tr key={p.productKey} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="py-2.5 px-3 font-semibold">{p.productLabel}</td>
                                                    <td className="py-2.5 px-3 text-center font-mono font-bold">{p.unitsSold}</td>
                                                    <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{p.basePrice.toLocaleString()}</td>
                                                    <td className="py-2.5 px-3 text-right font-mono">{p.avgUserPrice.toLocaleString()}</td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <span className={cn(
                                                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                                                            p.avgDiscount > 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                                                        )}>
                                                            {p.avgDiscount > 0 ? "-" : "+"}{Math.abs(p.avgDiscount)}%
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{p.totalRevenue.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Period Trends ────────────────────────────── */}
                    {data.periods.length > 0 && (
                        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-cyan-400" />
                                    Period Trends
                                    <Badge variant="outline" className="ml-auto text-[10px] border-white/10">{data.periods.length} periods</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                    {data.periods.map(p => (
                                        <div key={p.dateKey} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{p.label}</div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">Leads</span>
                                                    <span className="font-bold">{p.leads}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">Sales</span>
                                                    <span className="font-bold text-emerald-400">{p.conversions}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">Revenue</span>
                                                    <span className="font-mono font-semibold text-xs">{p.revenue.toLocaleString()}</span>
                                                </div>
                                                {/* Mini progress bar */}
                                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${data.periods.length > 0 ? Math.min(100, Math.max(4, (p.leads / Math.max(...data.periods.map(pp => pp.leads))) * 100)) : 4}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty state */}
                    {data.users.length === 0 && data.products.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No sales data found for the selected filters.</p>
                            <p className="text-xs mt-1">Try adjusting your date range or user selection.</p>
                        </div>
                    )}
                </>
            )}

            {/* Initial empty state */}
            {!data && (
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                    <CardContent className="py-16">
                        <div className="text-center text-muted-foreground">
                            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">Sales Quality Analytics</p>
                            <p className="text-xs mt-1">Choose your filters above, then click <strong>Analyze</strong> to view comprehensive sales data.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
