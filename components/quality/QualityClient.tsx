"use client";

import { useState, useCallback, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertTriangle, Clock, Target, UserCheck, Users, Search,
    Download, ChevronRight, TrendingDown, TrendingUp, Timer,
    DollarSign, BadgeDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAbandonedLeads, getInactiveUsers, getTargetProgress, getUserPerformance } from "@/lib/actions/quality";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { useRouter } from "next/navigation";

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

            {/* ─── Tab 5: Sales Performance ─────────────────────────────── */}
            {activeTab === "salesPerf" && (
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-cyan-400" />
                                    Sales Performance
                                </CardTitle>
                                <CardDescription>Agent pricing accuracy and revenue analysis</CardDescription>
                            </div>
                            <Button
                                onClick={loadSalesPerf}
                                disabled={isPending}
                                className="rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 h-9"
                                size="sm"
                            >
                                <Search className="h-3.5 w-3.5 mr-1.5" />
                                {isPending ? "Loading…" : "Analyze"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!salesPerfData ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Click <strong>Analyze</strong> to view sales performance</p>
                            </div>
                        ) : (() => {
                            const agents = salesPerfData.agentRevenueDetails || [];
                            const currency = salesPerfData.defaultCurrency || "AED";
                            const totalOriginal = salesPerfData.totalOriginalRevenue || 0;
                            const totalActual = salesPerfData.totalRevenue || 0;
                            const totalPL = totalActual - totalOriginal;
                            const totalMargin = totalOriginal > 0 ? ((totalPL / totalOriginal) * 100).toFixed(1) : '0.0';
                            if (agents.length === 0) return (
                                <div className="text-center py-16 text-muted-foreground">
                                    <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No sales data yet. Sales are recorded when leads reach a sale status.</p>
                                </div>
                            );
                            return (
                                <div className="space-y-6">
                                    {/* Summary KPIs */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                            <BadgeDollarSign className="h-5 w-5 mx-auto mb-2 text-blue-400" />
                                            <div className="text-xl font-extrabold">{totalOriginal.toLocaleString()}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Original Revenue ({currency})</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                            <DollarSign className="h-5 w-5 mx-auto mb-2 text-cyan-400" />
                                            <div className="text-xl font-extrabold">{totalActual.toLocaleString()}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Actual Revenue ({currency})</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                            <TrendingUp className={`h-5 w-5 mx-auto mb-2 ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                                            <div className={`text-xl font-extrabold ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {totalPL >= 0 ? '+' : ''}{totalPL.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Profit/Loss</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                            <Target className={`h-5 w-5 mx-auto mb-2 ${parseFloat(totalMargin) >= 0 ? 'text-violet-400' : 'text-orange-400'}`} />
                                            <div className={`text-2xl font-extrabold ${parseFloat(totalMargin) >= 0 ? 'text-violet-400' : 'text-orange-400'}`}>
                                                {parseFloat(totalMargin) >= 0 ? '+' : ''}{totalMargin}%
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Overall Margin</div>
                                        </div>
                                    </div>

                                    {/* Agent Ranking */}
                                    <div>
                                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                            <ChevronRight className="h-4 w-4 text-cyan-400" />
                                            Agent Pricing Accuracy
                                        </h4>
                                        <div className="space-y-2">
                                            {agents.map((agent: any, i: number) => {
                                                const margin = agent.originalRevenue > 0
                                                    ? ((agent.profitLoss / agent.originalRevenue) * 100).toFixed(1)
                                                    : '0.0';
                                                const isProfit = agent.profitLoss >= 0;
                                                const medals = ['🥇', '🥈', '🥉'];
                                                const medal = medals[i] || `#${i + 1}`;
                                                return (
                                                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                                        <span className="text-xl w-8 text-center">{medal}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-sm">{agent.agentName}</span>
                                                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{agent.agentRole}</Badge>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs">
                                                                    <span className="text-muted-foreground">{agent.leadsSold} sales</span>
                                                                    <span className="text-muted-foreground font-mono">{agent.originalRevenue.toLocaleString()} → {agent.actualRevenue.toLocaleString()}</span>
                                                                    <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                        {isProfit ? '+' : ''}{agent.profitLoss.toLocaleString()}
                                                                    </span>
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isProfit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                                                        {isProfit ? '▲' : '▼'}{isProfit ? '+' : ''}{margin}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all duration-500",
                                                                        isProfit ? 'bg-emerald-400' : 'bg-red-400'
                                                                    )}
                                                                    style={{ width: `${Math.min(100, Math.max(4, Math.abs(parseFloat(margin))))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
