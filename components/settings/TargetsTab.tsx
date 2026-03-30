"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Copy, Save, Users, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { setTarget, getTargets, copyLastMonthTargets } from "@/lib/actions/targets";

interface Props {
    users: { _id: string; name: string; role: string }[];
    defaultCurrency: string;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export function TargetsTab({ users, defaultCurrency }: Props) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [targets, setTargets] = useState<any[]>([]);
    const [editState, setEditState] = useState<Record<string, { leads: number; revenue: number }>>({});
    const [loading, setLoading] = useState(true);

    // Fetch targets when month changes
    const fetchTargets = useCallback(() => {
        setLoading(true);
        getTargets(selectedMonth, selectedYear).then(data => {
            setTargets(data);
            // Initialize edit state
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

    const handleCopyLastMonth = () => {
        startTransition(async () => {
            const res = await copyLastMonthTargets();
            toast({ title: res.success ? `✅ ${res.message}` : res.message, variant: res.success ? "default" : "destructive" });
            if (res.success) fetchTargets();
        });
    };

    // All users that can have targets (SALES / MARKETING)
    const targetableUsers = users.filter(u => u.role === "SALES" || u.role === "MARKETING" || u.role === "IQA");

    return (
        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Target className="h-5 w-5 text-emerald-500" />
                            Monthly Targets
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Set lead count & revenue targets for each team member
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
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
                            const existing = targets.find((t: any) => (t.userId?._id || t.userId) === user._id);
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
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
