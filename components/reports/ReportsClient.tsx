"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend,
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from "recharts";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { Users, TrendingUp, Target, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const COLORS = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export default function ReportsClient() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getDashboardStats().then(setData);
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

    return (
        <div className="p-8 space-y-8 bg-background/50">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Analytics Reports</h2>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl border-t-4 border-t-violet-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                        <div className="p-2 bg-violet-500/10 rounded-xl">
                            <Users className="h-4 w-4 text-violet-500" />
                        </div>
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
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <Target className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{data.customers}</div>
                        <p className="text-[10px] text-emerald-500 mt-2 font-medium">Converted to customer</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl border-t-4 border-t-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{conversionRate}%</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">Lead → Customer rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Monthly Trends Area Chart */}
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
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#aaa', fontSize: 11 }}
                                />
                                <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2.5} fill="url(#areaGradient)" dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Leads by Status Bar Chart */}
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
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
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
                {/* Distribution Donut */}
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
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    fill="#8884d8"
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusData.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            style={{ filter: `drop-shadow(0 0 6px ${COLORS[index % COLORS.length]}40)` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Lead Sources Bar Chart */}
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
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="url(#sourceGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
