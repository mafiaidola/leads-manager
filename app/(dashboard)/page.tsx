export const dynamic = "force-dynamic";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { serialize } from "@/lib/serialize";
import { getSettings } from "@/lib/actions/settings";
import { auth } from "@/auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, CheckCircle2, TrendingUp, Sparkles, Activity } from "lucide-react";
import { LeadTrendsChart } from "@/components/dashboard/LeadTrendsChart";
import { LeadsBySourceChart } from "@/components/dashboard/LeadsBySourceChart";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { FadeIn, CountUp, Sparkline } from "@/components/dashboard/DashboardAnimations";
import { GoalProgressRing } from "@/components/dashboard/GoalProgressRing";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default async function DashboardPage() {
    const [rawStats, session, settings] = await Promise.all([
        getDashboardStats(),
        auth(),
        getSettings(),
    ]);

    if (!rawStats) return <div>Loading...</div>;

    // Serialize Mongoose docs (ObjectId/Date → primitives) for Client Components
    const stats = serialize(rawStats);
    const conversionRate = stats.totalLeads > 0 ? parseFloat(((stats.customers / stats.totalLeads) * 100).toFixed(1)) : 0;

    const greeting = "مرحبا";
    const firstName = session?.user?.name?.split(" ")[0] || "";

    // Sparkline data from monthly trends
    const trendLine = stats.monthlyTrends.map((m: { total: number }) => m.total);

    // Goals from settings
    const monthlyLeadTarget = settings?.goals?.monthlyLeadTarget || 50;
    const monthlyConversionTarget = settings?.goals?.monthlyConversionTarget || 10;
    const currentMonthLeads = stats.newLeadsLast30Days || 0;

    return (
        <div className="p-6 md:p-8 space-y-8 bg-background/50 min-h-[calc(100vh-80px)]">
            {/* Hero Section with gradient mesh */}
            <FadeIn delay={0}>
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-card/60 to-primary/5 border border-white/10 backdrop-blur-xl p-8 md:p-10">
                    {/* Animated mesh */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                <span className="bg-gradient-to-r from-primary via-primary to-foreground bg-clip-text text-transparent">
                                    {greeting}, {firstName}
                                </span>
                                <Sparkles className="inline-block ml-2 h-6 w-6 text-amber-400 animate-pulse" />
                            </h2>
                            <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                                Here&apos;s what&apos;s happening with your leads today. Stay on top of your pipeline and hit your targets.
                            </p>
                            <div className="mt-4">
                                <QuickActions />
                            </div>
                        </div>
                        <div className="hidden md:block text-right text-sm text-muted-foreground shrink-0">
                            <div className="font-semibold text-foreground text-lg">
                                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            </div>
                            <div className="flex items-center gap-1.5 justify-end mt-1">
                                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-bold text-xs">System Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </FadeIn>

            {/* Stat Cards */}
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
                <FadeIn delay={80}>
                    <Card className="group rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-primary/15 transition-all duration-300 border-t-4 border-t-primary hover:-translate-y-1 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                            <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                                <Users className="h-4 w-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                        <CountUp end={stats.totalLeads} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">All time across pipeline</p>
                                </div>
                                <Sparkline data={trendLine} color="var(--primary)" />
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>

                <FadeIn delay={160}>
                    <Card className="group rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-blue-500/15 transition-all duration-300 border-t-4 border-t-blue-500 hover:-translate-y-1 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">New (7d)</CardTitle>
                            <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                                <UserPlus className="h-4 w-4 text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                        <CountUp end={stats.newLeadsLast7Days} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Added in the last 7 days</p>
                                </div>
                                <Sparkline data={trendLine} color="#3b82f6" />
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>

                <FadeIn delay={240}>
                    <Card className="group rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-emerald-500/15 transition-all duration-300 border-t-4 border-t-emerald-500 hover:-translate-y-1 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                        <CountUp end={stats.customers} />
                                    </div>
                                    <p className="text-xs text-emerald-500 mt-1 font-medium">Converted to customer</p>
                                </div>
                                <Sparkline data={trendLine} color="#10b981" />
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>

                <FadeIn delay={320}>
                    <Card className="group rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-amber-500/15 transition-all duration-300 border-t-4 border-t-amber-500 hover:-translate-y-1 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion</CardTitle>
                            <div className="p-2.5 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                                <TrendingUp className="h-4 w-4 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                        <CountUp end={conversionRate} suffix="%" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Lead → Customer rate</p>
                                </div>
                                <Sparkline data={trendLine} color="#f59e0b" />
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>
            </div>

            {/* Goal Progress + Charts Row */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                <FadeIn delay={400} className="lg:col-span-2">
                    <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 shadow-xl h-full">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                            Monthly Goals
                        </h3>
                        <div className="flex flex-col items-center gap-6">
                            <GoalProgressRing
                                current={currentMonthLeads}
                                target={monthlyLeadTarget}
                                label="Lead Target"
                                color="var(--primary)"
                            />
                            <GoalProgressRing
                                current={stats.customers}
                                target={monthlyConversionTarget}
                                label="Conversion Target"
                                color="#10b981"
                            />
                        </div>
                    </div>
                </FadeIn>
                <FadeIn delay={450} className="lg:col-span-3">
                    <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 shadow-xl overflow-hidden h-full">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-gradient-to-b from-primary to-primary/60 rounded-full" />
                            Lead Trends
                        </h3>
                        <LeadTrendsChart data={stats.monthlyTrends} />
                    </div>
                </FadeIn>
                <FadeIn delay={500} className="lg:col-span-2">
                    <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 shadow-xl overflow-hidden h-full">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                            By Source
                        </h3>
                        <LeadsBySourceChart data={stats.leadsBySource} />
                    </div>
                </FadeIn>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                <FadeIn delay={560} className="lg:col-span-4">
                    <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 shadow-xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-gradient-to-b from-primary to-primary/40 rounded-full" />
                            Status Overview
                        </h3>
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                            {stats.leadsByStatus.map((stat: { status: string; count: number }, i: number) => (
                                <FadeIn key={stat.status} delay={600 + i * 60}>
                                    <Card className="rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-200 cursor-default border-none hover:scale-[1.02]">
                                        <CardHeader className="pb-1 pt-4 px-4">
                                            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                {stat.status.replace(/_/g, " ")}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4">
                                            <div className="text-2xl font-extrabold">
                                                <CountUp end={stat.count} duration={800} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </FadeIn>
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <FadeIn delay={640}>
                        <RecentLeads leads={stats.recentLeads} />
                    </FadeIn>
                    <FadeIn delay={720}>
                        <RecentActivity activities={stats.recentActivity} />
                    </FadeIn>
                </div>
            </div>
        </div>
    );
}
