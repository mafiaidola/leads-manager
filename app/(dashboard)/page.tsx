export const dynamic = "force-dynamic";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { auth } from "@/auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import { LeadTrendsChart } from "@/components/dashboard/LeadTrendsChart";
import { LeadsBySourceChart } from "@/components/dashboard/LeadsBySourceChart";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { FadeIn, CountUp } from "@/components/dashboard/DashboardAnimations";

export default async function DashboardPage() {
    const rawStats = await getDashboardStats();
    const session = await auth();

    if (!rawStats) return <div>Loading...</div>;

    // Deep serialization for Client Components
    const stats = JSON.parse(JSON.stringify(rawStats));
    const conversionRate = stats.totalLeads > 0 ? parseFloat(((stats.customers / stats.totalLeads) * 100).toFixed(1)) : 0;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const firstName = session?.user?.name?.split(" ")[0] || "there";

    return (
        <div className="p-6 md:p-8 space-y-8 bg-background/50 min-h-[calc(100vh-80px)]">
            {/* Greeting Section */}
            <FadeIn delay={0}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent animate-gradient">
                                {greeting}, {firstName}
                            </span>
                            <Sparkles className="inline-block ml-2 h-6 w-6 text-amber-400 animate-pulse" />
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Here&apos;s what&apos;s happening with your leads today.
                        </p>
                    </div>
                    <div className="hidden md:block text-right text-sm text-muted-foreground">
                        <div className="font-semibold text-foreground">
                            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </div>
                    </div>
                </div>
            </FadeIn>

            {/* Stat Cards */}
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
                <FadeIn delay={80}>
                    <Card className="group rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-violet-500/15 transition-all duration-300 border-t-4 border-t-violet-500 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                            <div className="p-2.5 bg-violet-500/10 rounded-xl group-hover:bg-violet-500/20 transition-colors">
                                <Users className="h-4 w-4 text-violet-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                <CountUp end={stats.totalLeads} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">All time across pipeline</p>
                        </CardContent>
                    </Card>
                </FadeIn>

                <FadeIn delay={160}>
                    <Card className="group rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-blue-500/15 transition-all duration-300 border-t-4 border-t-blue-500 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">New (7d)</CardTitle>
                            <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                                <UserPlus className="h-4 w-4 text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                <CountUp end={stats.newLeadsLast7Days} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Added in the last 7 days</p>
                        </CardContent>
                    </Card>
                </FadeIn>

                <FadeIn delay={240}>
                    <Card className="group rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-emerald-500/15 transition-all duration-300 border-t-4 border-t-emerald-500 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                <CountUp end={stats.customers} />
                            </div>
                            <p className="text-xs text-emerald-500 mt-1 font-medium">Converted to customer</p>
                        </CardContent>
                    </Card>
                </FadeIn>

                <FadeIn delay={320}>
                    <Card className="group rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl hover:shadow-amber-500/15 transition-all duration-300 border-t-4 border-t-amber-500 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion</CardTitle>
                            <div className="p-2.5 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                                <TrendingUp className="h-4 w-4 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                <CountUp end={conversionRate} suffix="%" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Lead → Customer rate</p>
                        </CardContent>
                    </Card>
                </FadeIn>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                <FadeIn delay={400} className="lg:col-span-4">
                    <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 shadow-xl overflow-hidden h-full">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-gradient-to-b from-primary to-violet-600 rounded-full" />
                            Lead Trends
                        </h3>
                        <LeadTrendsChart data={stats.monthlyTrends} />
                    </div>
                </FadeIn>
                <FadeIn delay={480} className="lg:col-span-3">
                    <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 shadow-xl overflow-hidden h-full">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                            Distribution by Source
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
                            <span className="w-1.5 h-5 bg-gradient-to-b from-violet-500 to-pink-500 rounded-full" />
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
