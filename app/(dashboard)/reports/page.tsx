"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/actions/dashboard";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getDashboardStats().then(setData);
    }, []);

    if (!data) return <div className="p-8">Loading reports...</div>;

    const statusData = data.leadsByStatus.map((item: any) => ({
        name: item.status.replace(/_/g, " "),
        value: item.count
    }));

    return (
        <div className="p-8 space-y-8 bg-background/50">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Analytics Reports</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-primary rounded-full" />
                            Leads by Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                            Lead Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusData.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            style={{ filter: `drop-shadow(0 0 8px ${COLORS[index % COLORS.length]}40)` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:bg-white/5 transition-all border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{data.totalLeads}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">Lifetime cumulative</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:bg-white/5 transition-all border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">New This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">{data.newLeadsLast30Days}</div>
                        <p className="text-[10px] text-blue-500 mt-2 font-medium">+15% vs previous period</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:bg-white/5 transition-all border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Customers Won</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-300 bg-clip-text text-transparent">{data.customers}</div>
                        <p className="text-[10px] text-emerald-500 mt-2 font-medium">Success conversion rate</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
