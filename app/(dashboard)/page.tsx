export const dynamic = "force-dynamic";
import { getDashboardStats } from "@/lib/actions/dashboard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, CheckCircle2 } from "lucide-react";
import { LeadTrendsChart } from "@/components/dashboard/LeadTrendsChart";
import { LeadsBySourceChart } from "@/components/dashboard/LeadsBySourceChart";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default async function DashboardPage() {
    const rawStats = await getDashboardStats();

    if (!rawStats) return <div>Loading...</div>;

    // Deep serialization for Client Components
    const stats = JSON.parse(JSON.stringify(rawStats));

    return (
        <div className="p-8 space-y-8 bg-background/50">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Dashboard Overview</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-violet-500/10 transition-all border-t-4 border-t-violet-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                        <div className="p-2 bg-violet-500/10 rounded-xl">
                            <Users className="h-4 w-4 text-violet-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalLeads}</div>
                        <p className="text-xs text-muted-foreground mt-1">Growth +12% from last month</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-blue-500/10 transition-all border-t-4 border-t-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">New (7d)</CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <UserPlus className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.newLeadsLast7Days}</div>
                        <p className="text-xs text-muted-foreground mt-1">Acquisition pace is high</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-emerald-500/10 transition-all border-t-4 border-t-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.customers}</div>
                        <p className="text-xs text-green-500 mt-1">Conversion rate 8.4%</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 shadow-xl overflow-hidden">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-primary rounded-full" />
                        Lead Trends
                    </h3>
                    <LeadTrendsChart data={stats.monthlyTrends} />
                </div>
                <div className="lg:col-span-3 rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 shadow-xl overflow-hidden">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                        Distribution by Source
                    </h3>
                    <LeadsBySourceChart data={stats.leadsBySource} />
                </div>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 shadow-xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-violet-500 rounded-full" />
                            Status Overview
                        </h3>
                        <div className="grid gap-4 grid-cols-2">
                            {stats.leadsByStatus.map((stat: { status: string; count: number }) => (
                                <Card key={stat.status} className="rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-default border-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.status.replace(/_/g, " ")}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stat.count}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <RecentLeads leads={stats.recentLeads} />
                    <RecentActivity activities={stats.recentActivity} />
                </div>
            </div>
        </div>
    );
}
