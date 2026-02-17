"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend,
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, ComposedChart, Line, ReferenceLine
} from "recharts";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { getSettings } from "@/lib/actions/settings";
import { Users, TrendingUp, Target, ArrowUpRight, ArrowDownRight, Minus, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const COLORS = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export default function ReportsClient() {
    const [data, setData] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        Promise.all([getDashboardStats(), getSettings()]).then(([d, s]) => {
            setData(d);
            setSettings(s);
        });
    }, []);

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

    const statusData = data.leadsByStatus.map((item: any) => ({
        name: item.status.replace(/_/g, " "),
        value: item.count
    }));

    const sourceData = data.leadsBySource.map((item: any) => ({
        name: item.source || "Unknown",
        value: item.count
    }));

    const conversionRate = data.totalLeads > 0
        ? ((data.customers / data.totalLeads) * 100).toFixed(1)
        : "0.0";

    const trendChange = data.monthlyTrends.length >= 2
        ? data.monthlyTrends[data.monthlyTrends.length - 1].total - data.monthlyTrends[data.monthlyTrends.length - 2].total
        : 0;

    // Goal vs Actual data
    const monthlyLeadTarget = settings?.goals?.monthlyLeadTarget || 50;
    const monthlyConversionTarget = settings?.goals?.monthlyConversionTarget || 10;
    const currentMonthLeads = data.monthlyTrends.length > 0 ? data.monthlyTrends[data.monthlyTrends.length - 1].total : 0;
    const leadGoalPercent = Math.min(100, Math.round((currentMonthLeads / monthlyLeadTarget) * 100));
    const convGoalPercent = Math.min(100, Math.round((data.customers / monthlyConversionTarget) * 100));

    const goalVsActualData = data.monthlyTrends.map((m: any) => ({
        ...m,
        target: monthlyLeadTarget,
    }));

    // Export handlers
    const handleExportCSV = () => {
        const rows = [
            ["Metric", "Value"],
            ["Total Leads", data.totalLeads],
            ["New Leads (30d)", data.newLeadsLast30Days],
            ["Customers Won", data.customers],
            ["Conversion Rate", `${conversionRate}%`],
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
    };

    const handleExportJSON = () => {
        const report = {
            exportedAt: new Date().toISOString(),
            summary: {
                totalLeads: data.totalLeads,
                newLeads30d: data.newLeadsLast30Days,
                customers: data.customers,
                conversionRate: `${conversionRate}%`,
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
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-report-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Report exported as JSON" });
    };

    return (
        <div className="p-8 space-y-8 bg-background/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Analytics Reports</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
                        <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportJSON} className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
                        <FileText className="h-4 w-4 mr-1.5" /> Export JSON
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            </div>

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
                                    style={{ '--progress': `${Math.min(100, leadGoalPercent)}%` } as React.CSSProperties} />
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
                                    style={{ '--progress': `${Math.min(100, convGoalPercent)}%` } as React.CSSProperties} />
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
