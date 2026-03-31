"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Copy, Save, Users, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { setTarget, getTargets, copyLastMonthTargets } from "@/lib/actions/targets";
import { updateGoals } from "@/lib/actions/settings";

interface Props {
    users: { _id: string; name: string; role: string }[];
    defaultCurrency: string;
    orgGoals: { monthlyLeadTarget: number; monthlyConversionTarget: number };
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export function TargetsTab({ users, defaultCurrency, orgGoals }: Props) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [targets, setTargets] = useState<any[]>([]);
    const [editState, setEditState] = useState<Record<string, { leads: number; revenue: number }>>({});
    const [loading, setLoading] = useState(true);

    // Org-wide goals state
    const [orgLeadTarget, setOrgLeadTarget] = useState(orgGoals.monthlyLeadTarget);
    const [orgConvTarget, setOrgConvTarget] = useState(orgGoals.monthlyConversionTarget);

    // Fetch targets when month changes
    const fetchTargets = useCallback(() => {
        setLoading(true);
        getTargets(selectedMonth, selectedYear).then(data => {
            setTargets(data);
            const state: Record<string, { leads: number; revenue: number }> = {};
            data.forEach((t: any) => {
                state[t.userId?._id || t.userId] = {
                    leads: t.leadsTarget || 0,
                    revenue: t.revenueTarget || 0,
                };
            });
            setEditState(state);
            setLoading(false);
        });
    }, [selectedMonth, selectedYear]);

    useEffect(() => { fetchTargets(); }, [fetchTargets]);

    const handleSaveTarget = async (userId: string) => {
        const vals = editState[userId];
        if (!vals) return;
        startTransition(async () => {
            const res = await setTarget({
                userId,
                month: selectedMonth,
                year: selectedYear,
                leadsTarget: vals.leads,
                revenueTarget: vals.revenue,
            });
            toast({ title: res.success ? "✅ Target saved" : res.message, variant: res.success ? "default" : "destructive" });
            if (res.success) fetchTargets();
        });
    };

    const handleSaveAllTargets = async () => {
        startTransition(async () => {
            let saved = 0;
            for (const user of targetableUsers) {
                const vals = editState[user._id];
                if (!vals || (vals.leads === 0 && vals.revenue === 0)) continue;
                const res = await setTarget({
                    userId: user._id,
                    month: selectedMonth,
                    year: selectedYear,
                    leadsTarget: vals.leads,
                    revenueTarget: vals.revenue,
                });
                if (res.success) saved++;
            }
            toast({ title: `✅ Saved ${saved} target${saved !== 1 ? "s" : ""}` });
            fetchTargets();
        });
    };

    const handleCopyLastMonth = () => {
        startTransition(async () => {
            const res = await copyLastMonthTargets();
            toast({ title: res.success ? `✅ ${res.message}` : res.message, variant: res.success ? "default" : "destructive" });
            if (res.success) fetchTargets();
        });
    };

    const handleSaveOrgGoals = async () => {
        startTransition(async () => {
            const result = await updateGoals({
                monthlyLeadTarget: orgLeadTarget,
                monthlyConversionTarget: orgConvTarget,
            });
            if (result?.success) {
                toast({ title: "✅ Organization goals updated" });
            } else {
                toast({ title: (result as any)?.error || "Error saving goals", variant: "destructive" });
            }
        });
    };

    // All users that can have targets (SALES / MARKETING)
    const targetableUsers = users.filter(u => u.role === "SALES" || u.role === "MARKETING" || u.role === "IQA");

    // Summary calculations
    const totalLeadTargets = Object.values(editState).reduce((sum, v) => sum + (v.leads || 0), 0);
    const totalRevenueTargets = Object.values(editState).reduce((sum, v) => sum + (v.revenue || 0), 0);

    return (
        <div className="space-y-6">
            {/* ── Org-Wide Goals (moved from General tab) ──────────────── */}
            <Card className="rounded-3xl border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-amber-500" />
                        Organization Goals
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Org-wide targets used by the Reports &quot;Goal vs Actual&quot; charts. These apply to the whole organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-xs ml-1 flex items-center gap-1.5">
                                <Users className="h-3 w-3 text-amber-400" />
                                Monthly Lead Target
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                value={orgLeadTarget}
                                onChange={e => setOrgLeadTarget(Number(e.target.value))}
                                className="rounded-xl border-white/10 bg-black/20 text-lg font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs ml-1 flex items-center gap-1.5">
                                <TrendingUp className="h-3 w-3 text-amber-400" />
                                Monthly Conversion Target
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                value={orgConvTarget}
                                onChange={e => setOrgConvTarget(Number(e.target.value))}
                                className="rounded-xl border-white/10 bg-black/20 text-lg font-bold"
                            />
                        </div>
                    </div>
                    <div className="pt-5">
                        <Button
                            onClick={handleSaveOrgGoals}
                            disabled={isPending}
                            className="rounded-xl bg-amber-500 hover:bg-amber-600 px-8 shadow-lg shadow-amber-500/20 font-bold"
                        >
                            <Save className="h-4 w-4 mr-2" /> Save Organization Goals
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Per-User Targets ────────────────────────────────────── */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Target className="h-5 w-5 text-emerald-500" />
                                Individual Targets
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Set lead count &amp; revenue targets for each team member per month.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Month/Year selector */}
                            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-0.5">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    title="Select month"
                                    className="bg-transparent text-xs font-medium outline-none cursor-pointer text-foreground px-2 py-1.5 rounded-lg"
                                >
                                    {MONTH_NAMES.map((name, i) => (
                                        <option key={i + 1} value={i + 1} className="bg-card">{name}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    title="Select year"
                                    className="bg-transparent text-xs font-medium outline-none cursor-pointer text-foreground px-2 py-1.5 rounded-lg"
                                >
                                    {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                                        <option key={y} value={y} className="bg-card">{y}</option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLastMonth}
                                disabled={isPending}
                                className="rounded-xl border-white/10 bg-white/5 text-xs"
                            >
                                <Copy className="h-3.5 w-3.5 mr-1.5" />
                                Copy Last Month
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveAllTargets}
                                disabled={isPending}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold"
                            >
                                <Save className="h-3.5 w-3.5 mr-1.5" />
                                Save All
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                <div className="col-span-4">Team Member</div>
                                <div className="col-span-3 text-center">Leads Target</div>
                                <div className="col-span-3 text-center">Revenue Target ({defaultCurrency})</div>
                                <div className="col-span-2 text-center">Actions</div>
                            </div>

                            {targetableUsers.map(user => {
                                const vals = editState[user._id] || { leads: 0, revenue: 0 };
                                const roleColors: Record<string, string> = {
                                    SALES: "text-blue-400",
                                    MARKETING: "text-emerald-400",
                                    IQA: "text-orange-400",
                                };

                                return (
                                    <div
                                        key={user._id}
                                        className="grid grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                                    >
                                        <div className="col-span-4 flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold truncate">{user.name}</div>
                                                <div className={cn("text-[10px] font-bold uppercase", roleColors[user.role] || "text-muted-foreground")}>{user.role}</div>
                                            </div>
                                        </div>
                                        <div className="col-span-3 flex items-center justify-center gap-1.5">
                                            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <Input
                                                type="number"
                                                min={0}
                                                value={vals.leads}
                                                onChange={e => setEditState(prev => ({
                                                    ...prev,
                                                    [user._id]: { ...prev[user._id] || { leads: 0, revenue: 0 }, leads: Number(e.target.value) }
                                                }))}
                                                className="h-8 w-20 text-center rounded-lg text-xs bg-white/5 border-white/10"
                                            />
                                        </div>
                                        <div className="col-span-3 flex items-center justify-center gap-1.5">
                                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <Input
                                                type="number"
                                                min={0}
                                                value={vals.revenue}
                                                onChange={e => setEditState(prev => ({
                                                    ...prev,
                                                    [user._id]: { ...prev[user._id] || { leads: 0, revenue: 0 }, revenue: Number(e.target.value) }
                                                }))}
                                                className="h-8 w-24 text-center rounded-lg text-xs bg-white/5 border-white/10"
                                            />
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <Button
                                                size="sm"
                                                onClick={() => handleSaveTarget(user._id)}
                                                disabled={isPending}
                                                className="h-7 px-3 rounded-lg text-[10px] bg-emerald-600 hover:bg-emerald-500"
                                            >
                                                <Save className="h-3 w-3 mr-1" /> Save
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {targetableUsers.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground text-sm">
                                    No team members found. Add SALES or MARKETING users first.
                                </div>
                            )}

                            {/* Summary row */}
                            {targetableUsers.length > 0 && (
                                <div className="grid grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-primary/5 border border-primary/10 mt-2">
                                    <div className="col-span-4 text-sm font-bold text-primary">
                                        Team Total
                                    </div>
                                    <div className="col-span-3 text-center text-sm font-bold text-primary">
                                        {totalLeadTargets} leads
                                    </div>
                                    <div className="col-span-3 text-center text-sm font-bold text-primary">
                                        {defaultCurrency} {totalRevenueTargets.toLocaleString()}
                                    </div>
                                    <div className="col-span-2" />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
