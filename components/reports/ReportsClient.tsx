/**
 * @component ReportsClient
 * @description Interactive reports page client component — charts grid
 * with lead growth, status breakdown, source analysis, and conversion rate.
 * Supports date range filters and SuperAdmin cross-org comparison.
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend,
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, ComposedChart, Line, ReferenceLine
} from "recharts";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getDashboardStats, getRevenueByPeriod } from "@/lib/actions/dashboard";
import { getSettings } from "@/lib/actions/settings";
import { getUsers } from "@/lib/actions/users";
import { cn } from "@/lib/utils";
import { Users, TrendingUp, Target, ArrowUpRight, ArrowDownRight, Minus, FileSpreadsheet, FileText, FileDown, Filter, CalendarDays, X, Building2, DollarSign, BarChart3, PiggyBank, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function getThemeColors(): string[] {
    if (typeof window === "undefined") return ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
    const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
    // Generate a harmonious palette starting from the theme primary
    return [
        `oklch(${primary})`,
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];
}

const COLORS = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

type DateRange = "7d" | "30d" | "90d" | "all" | "custom";

export default function ReportsClient({ isSuperAdmin, organizations }: { isSuperAdmin?: boolean; organizations?: { _id: string; name: string; slug: string }[] }) {
    const [data, setData] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [dateRange, setDateRange] = useState<DateRange>("all");
    const [selectedAgent, setSelectedAgent] = useState<string>("");
    const [agents, setAgents] = useState<{ _id: string; name: string; role: string }[]>([]);
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [orgFilter, setOrgFilter] = useState("mine");
    const { toast } = useToast();
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [revenuePeriod, setRevenuePeriod] = useState<"today" | "week" | "month" | "year" | "all">("month");
    const [revPeriodData, setRevPeriodData] = useState<any>(null);


    // Fetch agents list once
    useEffect(() => {
        getUsers().then((users) => {
            setAgents(users.map((u: any) => ({ _id: u._id, name: u.name, role: u.role })));
        });
    }, []);

    // Fetch dashboard data when filters change
    const fetchData = useCallback(() => {
        setData(null);
        const range = dateRange === "custom" ? undefined : dateRange;
        const start = dateRange === "custom" ? customStart : undefined;
        const end = dateRange === "custom" ? customEnd : undefined;
        Promise.all([
            getDashboardStats(range, selectedAgent || undefined, start, end),
            getSettings(),
        ]).then(([d, s]) => {
            setData(d);
            setSettings(s);
        });
    }, [dateRange, selectedAgent, customStart, customEnd, orgFilter]);

    useEffect(() => {
        // For custom date, only fetch when both dates are set
        if (dateRange === "custom" && (!customStart || !customEnd)) return;
        fetchData();
    }, [fetchData, dateRange, customStart, customEnd]);

    // Revenue period filter
    useEffect(() => {
        getRevenueByPeriod(revenuePeriod).then(setRevPeriodData);
    }, [revenuePeriod]);


    const statusData = useMemo(() => {
        const statuses = settings?.statuses || [];
        return (data?.leadsByStatus || []).map((item: any) => {
            const cfg = statuses.find((s: any) => s.key === item.status);
            return {
                name: cfg?.label || item.status.replace(/_/g, " "),
                value: item.count,
                color: cfg?.color,
            };
        });
    }, [data?.leadsByStatus, settings?.statuses]);

    const sourceData = useMemo(() => (data?.leadsBySource || []).map((item: any) => ({
        name: item.source || "Unknown",
        value: item.count
    })), [data?.leadsBySource]);

    const conversionRate = useMemo(() => (data?.totalLeads ?? 0) > 0
        ? (((data?.customers ?? 0) / (data?.totalLeads ?? 1)) * 100).toFixed(1)
        : "0.0", [data?.totalLeads, data?.customers]);

    const trendChange = useMemo(() => (data?.monthlyTrends?.length ?? 0) >= 2
        ? data!.monthlyTrends[data!.monthlyTrends.length - 1].total - data!.monthlyTrends[data!.monthlyTrends.length - 2].total
        : 0, [data?.monthlyTrends]);

    // Goal vs Actual data
    const monthlyLeadTarget = settings?.goals?.monthlyLeadTarget || 50;
    const monthlyConversionTarget = settings?.goals?.monthlyConversionTarget || 10;
    const currentMonthLeads = useMemo(() => (data?.monthlyTrends?.length ?? 0) > 0 ? data!.monthlyTrends[data!.monthlyTrends.length - 1].total : 0, [data?.monthlyTrends]);
    const leadGoalPercent = useMemo(() => Math.min(100, Math.round((currentMonthLeads / monthlyLeadTarget) * 100)), [currentMonthLeads, monthlyLeadTarget]);
    const convGoalPercent = useMemo(() => Math.min(100, Math.round(((data?.customers ?? 0) / monthlyConversionTarget) * 100)), [data?.customers, monthlyConversionTarget]);

    const goalVsActualData = useMemo(() => (data?.monthlyTrends || []).map((m: any) => ({
        ...m,
        target: monthlyLeadTarget,
    })), [data?.monthlyTrends, monthlyLeadTarget]);

    // Export handlers
    const currency = data?.defaultCurrency || settings?.defaultCurrency || "AED";

    const handleExportCSV = useCallback(() => {
        if (!data) return;
        const rows = [
            ["Metric", "Value"],
            ["Total Leads", data.totalLeads],
            ["New Leads (30d)", data.newLeadsLast30Days],
            ["Customers Won", data.customers],
            ["Conversion Rate", `${conversionRate}%`],
            ["Total Revenue", `${(data.totalRevenue || 0).toLocaleString()} ${currency}`],
            ["Monthly Lead Target", monthlyLeadTarget],
            ["Monthly Conversion Target", monthlyConversionTarget],
            [""],
            ["Month", "Leads", "Target"],
            ...data.monthlyTrends.map((m: any) => [m.name, m.total, monthlyLeadTarget]),
            [""],
            ["Status", "Count"],
            ...data.leadsByStatus.map((s: any) => [s.status, s.count]),
            [""],
            ["Source", "Count"],
            ...data.leadsBySource.map((s: any) => [s.source || "Unknown", s.count]),
            [""],
            ["Agent", "Total Leads", "Won", "Win Rate", `Revenue (${currency})`],
            ...(data.agentLeaderboard || []).map((a: any) => [a.agentName, a.total, a.won, `${a.total > 0 ? Math.round((a.won / a.total) * 100) : 0}%`, (a.revenue || 0).toLocaleString()]),
        ];
        const csv = rows.map(r => Array.isArray(r) ? r.join(",") : "").join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-report-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Report exported as CSV" });
    }, [data, conversionRate, monthlyLeadTarget, monthlyConversionTarget, currency, toast]);

    const handleExportJSON = useCallback(() => {
        if (!data) return;
        const report = {
            exportedAt: new Date().toISOString(),
            currency,
            summary: {
                totalLeads: data.totalLeads,
                newLeads30d: data.newLeadsLast30Days,
                customers: data.customers,
                conversionRate: `${conversionRate}%`,
                totalRevenue: data.totalRevenue || 0,
            },
            goals: {
                monthlyLeadTarget,
                monthlyConversionTarget,
                currentMonthLeads,
                leadGoalPercent: `${leadGoalPercent}%`,
                convGoalPercent: `${convGoalPercent}%`,
            },
            monthlyTrends: data.monthlyTrends,
            leadsByStatus: data.leadsByStatus,
            leadsBySource: data.leadsBySource,
            agentPerformance: (data.agentLeaderboard || []).map((a: any) => ({
                agent: a.agentName,
                role: a.agentRole,
                totalLeads: a.total,
                won: a.won,
                revenue: a.revenue || 0,
            })),
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-report-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Report exported as JSON" });
    }, [data, conversionRate, monthlyLeadTarget, monthlyConversionTarget, currentMonthLeads, leadGoalPercent, convGoalPercent, currency, toast]);

    const handleExportPDF = useCallback(async () => {
        if (!reportRef.current || isExportingPDF) return;
        setIsExportingPDF(true);
        toast({ title: "Generating PDF, please wait..." });
        try {
            const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
                import("jspdf"),
                import("html2canvas"),
            ]);
            const canvas = await html2canvas(reportRef.current, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: "#09090b",
                logging: false,
            });
            const imgData = canvas.toDataURL("image/jpeg", 0.85);
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yOffset = 0;
            while (yOffset < pdfHeight) {
                pdf.addImage(imgData, "JPEG", 0, -yOffset, pdfWidth, pdfHeight);
                yOffset += pageHeight;
                if (yOffset < pdfHeight) pdf.addPage();
            }
            pdf.save(`leads-report-${new Date().toISOString().split("T")[0]}.pdf`);
            toast({ title: "✅ PDF downloaded successfully!" });
        } catch (err) {
            console.error("PDF export error:", err);
            toast({ title: "PDF export failed", variant: "destructive" });
        } finally {
            setIsExportingPDF(false);
        }
    }, [isExportingPDF, toast]);

    if (!data) return (
        <div className="p-8 space-y-8 bg-background/50">
            <div className="flex items-center justify-between">
                <div className="h-9 w-64 bg-white/5 rounded-xl animate-pulse" />
            </div>
            <div className="grid gap-6 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 animate-pulse h-[110px]" />
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 animate-pulse h-[400px]" />
                ))}
            </div>
        </div>
    );



    const DATE_RANGES: { label: string; value: DateRange }[] = [
        { label: "7 Days", value: "7d" },
        { label: "30 Days", value: "30d" },
        { label: "90 Days", value: "90d" },
        { label: "All Time", value: "all" },
        { label: "Custom", value: "custom" },
    ];

    return (
        <div className="p-4 sm:p-8 space-y-8 bg-background/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Analytics Reports</h2>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Agent Filter */}
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <select
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            className="bg-transparent text-xs font-medium outline-none cursor-pointer text-foreground"
                            aria-label="Filter by agent"
                        >
                            <option value="" className="bg-card">All Agents</option>
                            {agents.map((a) => (
                                <option key={a._id} value={a._id} className="bg-card">
                                    {a.name} ({a.role})
                                </option>
                            ))}
                        </select>
                        {selectedAgent && (
                            <button onClick={() => setSelectedAgent("")} className="text-muted-foreground hover:text-foreground" aria-label="Clear agent filter">
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                    {/* Organization Filter (SuperAdmin) */}
                    {isSuperAdmin && organizations && organizations.length > 0 && (
                        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                            <Building2 className="h-3.5 w-3.5 text-amber-500" />
                            <select
                                value={orgFilter}
                                onChange={(e) => setOrgFilter(e.target.value)}
                                className="bg-transparent text-xs font-medium outline-none cursor-pointer text-foreground"
                                aria-label="Filter by organization"
                            >
                                <option value="mine" className="bg-card">My Organization</option>
                                <option value="all" className="bg-card">All Organizations</option>
                                {organizations.map((o) => (
                                    <option key={o._id} value={o._id} className="bg-card">{o.name}</option>
                                ))}
                            </select>
                            {orgFilter !== "mine" && (
                                <button onClick={() => setOrgFilter("mine")} className="text-muted-foreground hover:text-foreground" aria-label="Clear org filter">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    )}
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-0.5">
                        {DATE_RANGES.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => setDateRange(r.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    dateRange === r.value
                                        ? "bg-primary text-white shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {/* Custom Date Inputs */}
                    {dateRange === "custom" && (
                        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="bg-transparent text-xs outline-none text-foreground"
                                aria-label="Start date"
                            />
                            <span className="text-xs text-muted-foreground">→</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="bg-transparent text-xs outline-none text-foreground"
                                aria-label="End date"
                            />
                        </div>
                    )}
                    <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
                        <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportJSON} className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
                        <FileText className="h-4 w-4 mr-1.5" /> Export JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExportingPDF} className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50">
                        <FileDown className="h-4 w-4 mr-1.5" /> {isExportingPDF ? "Generating..." : "Download PDF"}
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl border-t-4 border-t-violet-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                        <div className="p-2 bg-violet-500/10 rounded-xl"><Users className="h-4 w-4 text-violet-500" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{data.totalLeads}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">Lifetime cumulative</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl border-t-4 border-t-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">New (30d)</CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            {trendChange > 0 ? <ArrowUpRight className="h-4 w-4 text-blue-500" /> :
                                trendChange < 0 ? <ArrowDownRight className="h-4 w-4 text-blue-500" /> :
                                    <Minus className="h-4 w-4 text-blue-500" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{data.newLeadsLast30Days}</div>
                        <p className={`text-[10px] mt-2 font-semibold ${trendChange > 0 ? 'text-emerald-500' : trendChange < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {trendChange > 0 ? `↑ ${trendChange} more than prev month` : trendChange < 0 ? `↓ ${Math.abs(trendChange)} fewer than prev month` : "No change vs prev month"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl border-t-4 border-t-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Customers Won</CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-xl"><Target className="h-4 w-4 text-emerald-500" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{data.customers}</div>
                        <p className="text-[10px] text-emerald-500 mt-2 font-medium">Converted to customer</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl border-t-4 border-t-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                        <div className="p-2 bg-amber-500/10 rounded-xl"><TrendingUp className="h-4 w-4 text-amber-500" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{conversionRate}%</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">Lead → Customer rate</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl border-t-4 border-t-cyan-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <div className="p-2 bg-cyan-500/10 rounded-xl"><DollarSign className="h-4 w-4 text-cyan-500" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{(data.totalRevenue || 0).toLocaleString()} <span className="text-lg text-muted-foreground">{currency}</span></div>
                        <p className="text-[10px] text-cyan-400 mt-2 font-medium">From closed sales</p>
                    </CardContent>
                </Card>
            </div>

            {/* Period Comparison Strip */}
            {(data.monthlyTrends?.length ?? 0) >= 2 && (() => {
                const curr = data.monthlyTrends[data.monthlyTrends.length - 1];
                const prev = data.monthlyTrends[data.monthlyTrends.length - 2];
                const leadsDelta = curr.total - prev.total;
                const leadsPercent = prev.total > 0 ? ((leadsDelta / prev.total) * 100).toFixed(0) : "∞";
                const isPositive = leadsDelta > 0;
                const isNeutral = leadsDelta === 0;
                return (
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardContent className="py-5 px-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <CalendarDays className="h-4 w-4" />
                                    <span>Period Comparison:</span>
                                    <span className="font-bold text-foreground">{curr.name}</span>
                                    <span>vs</span>
                                    <span className="text-foreground">{prev.name}</span>
                                </div>
                                <div className="flex items-center gap-6 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Leads:</span>
                                        <span className="text-sm font-bold">{curr.total}</span>
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded-full",
                                            isPositive ? "bg-emerald-500/15 text-emerald-400" :
                                            isNeutral ? "bg-white/10 text-muted-foreground" :
                                            "bg-red-500/15 text-red-400"
                                        )}>
                                            {isPositive ? "↑" : isNeutral ? "→" : "↓"} {Math.abs(leadsDelta)} ({leadsPercent}%)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Previous:</span>
                                        <span className="text-sm font-medium text-muted-foreground">{prev.total} leads</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })()}

            {/* Goal vs Actual Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Target className="h-5 w-5 text-emerald-500" />
                            Lead Goal Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-5xl font-bold">{currentMonthLeads}</div>
                                    <p className="text-xs text-muted-foreground mt-1">of {monthlyLeadTarget} target</p>
                                </div>
                                <div className={`text-3xl font-bold ${leadGoalPercent >= 100 ? 'text-emerald-500' : leadGoalPercent >= 70 ? 'text-amber-500' : 'text-red-400'}`}>
                                    {leadGoalPercent}%
                                </div>
                            </div>
                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 progress-bar ${leadGoalPercent >= 100 ? 'bg-emerald-500' : leadGoalPercent >= 70 ? 'bg-amber-500' : 'bg-red-400'}`}
                                    ref={el => { if (el) el.style.setProperty('--progress', `${Math.min(100, leadGoalPercent)}%`); }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Conversion Goal Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-5xl font-bold">{data.customers}</div>
                                    <p className="text-xs text-muted-foreground mt-1">of {monthlyConversionTarget} target</p>
                                </div>
                                <div className={`text-3xl font-bold ${convGoalPercent >= 100 ? 'text-emerald-500' : convGoalPercent >= 70 ? 'text-amber-500' : 'text-red-400'}`}>
                                    {convGoalPercent}%
                                </div>
                            </div>
                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 progress-bar ${convGoalPercent >= 100 ? 'bg-emerald-500' : convGoalPercent >= 70 ? 'bg-amber-500' : 'bg-red-400'}`}
                                    ref={el => { if (el) el.style.setProperty('--progress', `${Math.min(100, convGoalPercent)}%`); }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Goal vs Actual Trend Chart */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                        Goal vs Actual Trend
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={goalVsActualData}>
                            <defs>
                                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#aaa', fontSize: 11 }} />
                            <Legend />
                            <Area type="monotone" dataKey="total" name="Actual Leads" stroke="#10b981" strokeWidth={2.5} fill="url(#actualGradient)" dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                            <Line type="monotone" dataKey="target" name="Target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="8 4" dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Team Leaderboard */}
            {data.agentLeaderboard && data.agentLeaderboard.length > 0 && (
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                            Team Leaderboard
                            {dateRange !== "all" && (
                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                    · Last {dateRange === "7d" ? "7" : dateRange === "30d" ? "30" : "90"} Days
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.agentLeaderboard.map((agent: any, i: number) => {
                                const pct = agent.total > 0 ? Math.round((agent.won / agent.total) * 100) : 0;
                                const medals = ['🥇', '🥈', '🥉'];
                                const medal = medals[i] || `#${i + 1}`;
                                const roleColors: Record<string, string> = {
                                    ADMIN: 'text-violet-400',
                                    SALES: 'text-blue-400',
                                    MARKETING: 'text-emerald-400',
                                };
                                return (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <span className="text-xl w-8 text-center">{medal}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm truncate">{agent.agentName}</span>
                                                    <span className={`text-[10px] font-bold uppercase ${roleColors[agent.agentRole] || 'text-muted-foreground'}`}>{agent.agentRole}</span>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 text-xs">
                                                    <span className="text-muted-foreground">{agent.total} leads</span>
                                                    <span className="text-emerald-400 font-semibold">{agent.won} won</span>
                                                    <span className={`font-bold ${pct >= 50 ? 'text-emerald-400' : pct >= 25 ? 'text-amber-400' : 'text-muted-foreground'}`}>{pct}%</span>
                                                    {(agent.revenue || 0) > 0 && (
                                                        <span className="text-cyan-400 font-semibold">{(agent.revenue || 0).toLocaleString()} {currency}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 dist-bar ${pct >= 50 ? 'bg-emerald-400' : pct >= 25 ? 'bg-amber-400' : 'bg-blue-400'}`}
                                                    ref={el => { if (el) el.style.setProperty('--bar-width', `${Math.max(4, pct)}%`); }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══ Revenue Intelligence Section ═══ */}
            {(data.totalRevenue > 0 || data.totalOriginalRevenue > 0) && (
                <>
                    {/* Revenue KPI Cards */}
                    <div className="pt-4">
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                                Revenue Intelligence
                            </h3>
                            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-0.5">
                                {(["today", "week", "month", "year", "all"] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setRevenuePeriod(p)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                                            revenuePeriod === p
                                                ? "bg-cyan-500 text-white shadow"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {p === "all" ? "All Time" : p === "week" ? "This Week" : p === "month" ? "This Month" : p === "year" ? "This Year" : "Today"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {(() => {
                            const rd = revPeriodData;
                            const origRev = rd?.originalRevenue ?? data.totalOriginalRevenue ?? 0;
                            const actRev = rd?.actualRevenue ?? data.totalRevenue ?? 0;
                            const pl = actRev - origRev;
                            const isProfit = pl > 0;
                            const marginVal = origRev > 0 ? ((pl / origRev) * 100).toFixed(1) : '0.0';
                            const isPositive = parseFloat(marginVal) >= 0;
                            const pLabel = rd ? (rd.period === "today" ? "Today" : rd.period === "week" ? "This Week" : rd.period === "month" ? "This Month" : rd.period === "year" ? "This Year" : "All Time") : "All Time";
                            const discountAmt = rd?.totalDiscounts ?? data.totalDiscounts ?? 0;
                            const discountCount = rd?.totalDiscountCount ?? data.totalDiscountCount ?? 0;
                            const extraAmt = rd?.totalExtraValue ?? data.totalExtraValue ?? 0;
                            const extraCount = rd?.totalExtraValueCount ?? data.totalExtraValueCount ?? 0;

                            return (
                                <>
                                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl shadow-lg border-t-4 border-t-blue-500">
                                        <CardContent className="pt-5 pb-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-muted-foreground">Original Revenue</span>
                                                <div className="p-1.5 bg-blue-500/10 rounded-lg"><BadgeDollarSign className="h-3.5 w-3.5 text-blue-500" /></div>
                                            </div>
                                            <div className="text-2xl font-bold">{origRev.toLocaleString()} <span className="text-sm text-muted-foreground">{currency}</span></div>
                                            <p className="text-[10px] text-muted-foreground mt-1">{pLabel} · Expected from product prices</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl shadow-lg border-t-4 border-t-cyan-500">
                                        <CardContent className="pt-5 pb-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-muted-foreground">Actual Revenue</span>
                                                <div className="p-1.5 bg-cyan-500/10 rounded-lg"><DollarSign className="h-3.5 w-3.5 text-cyan-500" /></div>
                                            </div>
                                            <div className="text-2xl font-bold">{actRev.toLocaleString()} <span className="text-sm text-muted-foreground">{currency}</span></div>
                                            <p className="text-[10px] text-cyan-400 mt-1">{pLabel} · {rd?.salesCount ?? 0} sales closed</p>
                                        </CardContent>
                                    </Card>
                                    <Card className={`rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl shadow-lg border-t-4 ${isProfit ? 'border-t-emerald-500' : 'border-t-red-500'}`}>
                                        <CardContent className="pt-5 pb-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-muted-foreground">Profit / Loss</span>
                                                <div className={`p-1.5 rounded-lg ${isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                                    <PiggyBank className={`h-3.5 w-3.5 ${isProfit ? 'text-emerald-500' : 'text-red-500'}`} />
                                                </div>
                                            </div>
                                            <div className={`text-2xl font-bold ${isProfit ? 'text-emerald-500' : 'text-red-400'}`}>
                                                {isProfit ? '+' : ''}{pl.toLocaleString()} <span className="text-sm text-muted-foreground">{currency}</span>
                                            </div>
                                            <p className={`text-[10px] mt-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {pLabel} · {isProfit ? 'Above original pricing' : 'Below original pricing'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className={`rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl shadow-lg border-t-4 ${isPositive ? 'border-t-violet-500' : 'border-t-orange-500'}`}>
                                        <CardContent className="pt-5 pb-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-muted-foreground">Margin</span>
                                                <div className={`p-1.5 rounded-lg ${isPositive ? 'bg-violet-500/10' : 'bg-orange-500/10'}`}>
                                                    <BarChart3 className={`h-3.5 w-3.5 ${isPositive ? 'text-violet-500' : 'text-orange-500'}`} />
                                                </div>
                                            </div>
                                            <div className={`text-4xl font-bold ${isPositive ? 'text-violet-400' : 'text-orange-400'}`}>
                                                {isPositive ? '+' : ''}{marginVal}%
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">{pLabel} · Pricing efficiency</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl shadow-lg border-t-4 border-t-red-500">
                                        <CardContent className="pt-5 pb-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-muted-foreground">Total Discounts Given</span>
                                                <div className="p-1.5 bg-red-500/10 rounded-lg"><BadgeDollarSign className="h-3.5 w-3.5 text-red-500" /></div>
                                            </div>
                                            <div className="text-2xl font-bold text-red-400">-{discountAmt.toLocaleString()} <span className="text-sm text-muted-foreground">{currency}</span></div>
                                            <p className="text-[10px] text-red-400/70 mt-1">{pLabel} · {discountCount} deal{discountCount !== 1 ? 's' : ''} sold below product price</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl shadow-lg border-t-4 border-t-emerald-500">
                                        <CardContent className="pt-5 pb-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-muted-foreground">Total Extra Value Earned</span>
                                                <div className="p-1.5 bg-emerald-500/10 rounded-lg"><PiggyBank className="h-3.5 w-3.5 text-emerald-500" /></div>
                                            </div>
                                            <div className="text-2xl font-bold text-emerald-400">+{extraAmt.toLocaleString()} <span className="text-sm text-muted-foreground">{currency}</span></div>
                                            <p className="text-[10px] text-emerald-400/70 mt-1">{pLabel} · {extraCount} deal{extraCount !== 1 ? 's' : ''} sold above product price</p>
                                        </CardContent>
                                    </Card>
                                </>
                            );
                        })()}
                    </div>

                    {/* Revenue Trend: Original vs Actual */}
                    {data.revenueByMonth && data.revenueByMonth.length > 0 && (
                        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                                    Revenue Trend: Original vs Actual
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[350px] pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data.revenueByMonth}>
                                        <defs>
                                            <linearGradient id="origRevGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="actRevGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#aaa', fontSize: 11 }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="originalRevenue" name={`Original (${currency})`} stroke="#3b82f6" strokeWidth={2} fill="url(#origRevGradient)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} />
                                        <Area type="monotone" dataKey="actualRevenue" name={`Actual (${currency})`} stroke="#06b6d4" strokeWidth={2.5} fill="url(#actRevGradient)" dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Agent Sales Performance Table */}
                    {data.agentRevenueDetails && data.agentRevenueDetails.length > 0 && (
                        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full" />
                                    Agent Sales Performance
                                    <span className="text-xs font-normal text-muted-foreground ml-1">· Original vs Actual Revenue</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-xs text-muted-foreground border-b border-white/5">
                                                <th className="text-left py-3 px-2 font-semibold">Agent</th>
                                                <th className="text-center py-3 px-2 font-semibold">Leads Sold</th>
                                                <th className="text-right py-3 px-2 font-semibold">Original ({currency})</th>
                                                <th className="text-right py-3 px-2 font-semibold">Actual ({currency})</th>
                                                <th className="text-right py-3 px-2 font-semibold">Profit/Loss</th>
                                                <th className="text-right py-3 px-2 font-semibold">Margin</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.agentRevenueDetails.map((agent: any, i: number) => {
                                                const margin = agent.originalRevenue > 0
                                                    ? ((agent.profitLoss / agent.originalRevenue) * 100).toFixed(1)
                                                    : '0.0';
                                                const isProfit = agent.profitLoss >= 0;
                                                const roleColors: Record<string, string> = {
                                                    ADMIN: 'text-violet-400', SALES: 'text-blue-400', MARKETING: 'text-emerald-400',
                                                };
                                                return (
                                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="py-3 px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                                    {agent.agentName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <span className="font-semibold">{agent.agentName}</span>
                                                                    <span className={`ml-1.5 text-[10px] font-bold uppercase ${roleColors[agent.agentRole] || 'text-muted-foreground'}`}>{agent.agentRole}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-2 text-center font-semibold">{agent.leadsSold}</td>
                                                        <td className="py-3 px-2 text-right font-mono text-muted-foreground">{agent.originalRevenue.toLocaleString()}</td>
                                                        <td className="py-3 px-2 text-right font-mono font-semibold">{agent.actualRevenue.toLocaleString()}</td>
                                                        <td className={`py-3 px-2 text-right font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {isProfit ? '+' : ''}{agent.profitLoss.toLocaleString()}
                                                        </td>
                                                        <td className="py-3 px-2 text-right">
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isProfit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                                                {isProfit ? '▲' : '▼'} {isProfit ? '+' : ''}{margin}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Charts Row 1 */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-primary rounded-full" />
                            Lead Growth Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.monthlyTrends}>
                                <defs>
                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#aaa', fontSize: 11 }} />
                                <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2.5} fill="url(#areaGradient)" dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                            Leads by Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} allowDecimals={false} />
                                <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} width={110} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} itemStyle={{ color: '#fff' }} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                                    {statusData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                            Status Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="45%" innerRadius={70} outerRadius={110} fill="#8884d8" paddingAngle={4} dataKey="value" stroke="none">
                                    {statusData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="chart-cell" style={{ '--cell-color': COLORS[index % COLORS.length] } as React.CSSProperties} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
                            Leads by Source
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sourceData}>
                                <defs>
                                    <linearGradient id="sourceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} itemStyle={{ color: '#fff' }} />
                                <Bar dataKey="value" fill="url(#sourceGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
