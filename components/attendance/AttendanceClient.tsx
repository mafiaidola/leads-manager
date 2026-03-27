/**
 * @component AttendanceClient
 * @description Interactive attendance dashboard for admins.
 *
 * Features:
 * - Daily view: who logged in, login/logout times, status badges
 * - Monthly summary: table with total days, late count, avg hours
 * - Work schedule settings: start/end time, grace period, work days
 * - Export to CSV
 * - Date picker for daily view, month/year picker for summary
 */
"use client";

import React, { useState, useCallback, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CalendarDays, Clock, Download, Settings2, Users,
    CheckCircle2, AlertTriangle, XCircle, LogIn, LogOut,
    TrendingUp, Timer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getAttendanceLogs, getAttendanceSummary, updateWorkSchedule } from "@/lib/actions/attendance";

interface AttendanceClientProps {
    initialLogs: any[];
    initialSummary: any[];
    workSchedule: any;
    orgUsers: any[];
    initialDate: string;
    initialMonth: number;
    initialYear: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    PRESENT: { label: "Present", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", icon: CheckCircle2 },
    LATE: { label: "Late", color: "bg-amber-500/15 text-amber-500 border-amber-500/30", icon: AlertTriangle },
    EARLY_LEAVE: { label: "Early Leave", color: "bg-orange-500/15 text-orange-500 border-orange-500/30", icon: LogOut },
    ABSENT: { label: "Absent", color: "bg-red-500/15 text-red-500 border-red-500/30", icon: XCircle },
};

function formatTime(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDuration(minutes: number | null): string {
    if (!minutes) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AttendanceClient({
    initialLogs,
    initialSummary,
    workSchedule: initialSchedule,
    orgUsers,
    initialDate,
    initialMonth,
    initialYear,
}: AttendanceClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // Daily view state
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [dailyLogs, setDailyLogs] = useState(initialLogs);

    // Monthly view state
    const [selectedMonth, setSelectedMonth] = useState(initialMonth);
    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [monthlySummary, setMonthlySummary] = useState(initialSummary);

    // Settings state
    const [schedule, setSchedule] = useState(initialSchedule || {
        enabled: false,
        startTime: "09:00",
        endTime: "17:00",
        gracePeriodMinutes: 15,
        workDays: [1, 2, 3, 4, 5],
        timezone: "Asia/Dubai",
    });

    // ─── Fetch daily logs ──────────────────────────────────────────────
    const fetchDailyLogs = useCallback(async (date: string) => {
        setSelectedDate(date);
        startTransition(async () => {
            const logs = await getAttendanceLogs(date);
            setDailyLogs(logs);
        });
    }, []);

    // ─── Fetch monthly summary ─────────────────────────────────────────
    const fetchMonthlySummary = useCallback(async (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
        startTransition(async () => {
            const summary = await getAttendanceSummary(month, year);
            setMonthlySummary(summary);
        });
    }, []);

    // ─── Save schedule ─────────────────────────────────────────────────
    const handleSaveSchedule = useCallback(async () => {
        startTransition(async () => {
            const result = await updateWorkSchedule(schedule);
            if (result.success) {
                toast({ title: "Work schedule updated" });
            } else {
                toast({ title: result.message || "Error", variant: "destructive" });
            }
        });
    }, [schedule, toast]);

    // ─── Export CSV ─────────────────────────────────────────────────────
    const handleExportDaily = useCallback(() => {
        const headers = ["Name", "Date", "Check In", "Check Out", "Duration", "Status", "Login Count"];
        const rows = dailyLogs.map((log: any) => [
            log.userName,
            log.date,
            formatTime(log.firstLogin),
            formatTime(log.lastLogout),
            formatDuration(log.totalMinutes),
            log.status,
            log.loginCount,
        ]);
        const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_${selectedDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Attendance exported" });
    }, [dailyLogs, selectedDate, toast]);

    const handleExportMonthly = useCallback(() => {
        const headers = ["Name", "Total Days", "Late Days", "Early Leave", "Avg Hours/Day"];
        const rows = monthlySummary.map((u: any) => [
            u.userName,
            u.totalDays,
            u.lateDays,
            u.earlyLeaveDays,
            formatDuration(u.avgMinutes),
        ]);
        const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Monthly report exported" });
    }, [monthlySummary, selectedMonth, selectedYear, toast]);

    // ─── Stats cards ───────────────────────────────────────────────────
    const dailyStats = useMemo(() => {
        const present = dailyLogs.filter((l: any) => l.status === "PRESENT").length;
        const late = dailyLogs.filter((l: any) => l.status === "LATE").length;
        const earlyLeave = dailyLogs.filter((l: any) => l.status === "EARLY_LEAVE").length;
        const absent = orgUsers.length - dailyLogs.length;
        return { present, late, earlyLeave, absent: Math.max(0, absent), total: dailyLogs.length };
    }, [dailyLogs, orgUsers]);

    return (
        <Tabs defaultValue="daily" className="space-y-6">
            <TabsList className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-1">
                <TabsTrigger value="daily" className="rounded-xl gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <CalendarDays className="h-4 w-4" /> Daily View
                </TabsTrigger>
                <TabsTrigger value="monthly" className="rounded-xl gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <TrendingUp className="h-4 w-4" /> Monthly Report
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-xl gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Settings2 className="h-4 w-4" /> Work Schedule
                </TabsTrigger>
            </TabsList>

            {/* ─── Daily View Tab ──────────────────────────────────────── */}
            <TabsContent value="daily" className="space-y-6">
                {/* Date Picker & Export */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => fetchDailyLogs(e.target.value)}
                            className="rounded-xl border-white/10 bg-card/40 backdrop-blur-xl w-48"
                        />
                        {isPending && <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>}
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl border-white/10 gap-1.5" onClick={handleExportDaily}>
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl border-t-4 border-t-emerald-500">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Present</p>
                                    <p className="text-2xl font-black text-emerald-500">{dailyStats.present}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-emerald-500/20" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl border-t-4 border-t-amber-500">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Late</p>
                                    <p className="text-2xl font-black text-amber-500">{dailyStats.late}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-amber-500/20" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl border-t-4 border-t-orange-500">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Early Leave</p>
                                    <p className="text-2xl font-black text-orange-500">{dailyStats.earlyLeave}</p>
                                </div>
                                <LogOut className="h-8 w-8 text-orange-500/20" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl border-t-4 border-t-red-500">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Absent</p>
                                    <p className="text-2xl font-black text-red-500">{dailyStats.absent}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-500/20" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Daily Attendance Table */}
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Attendance — {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {dailyLogs.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No attendance records for this date</p>
                                <p className="text-sm mt-1">Try selecting a different date</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Check In</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Check Out</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Logins</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyLogs.map((log: any) => {
                                            const config = STATUS_CONFIG[log.status] || STATUS_CONFIG.PRESENT;
                                            const StatusIcon = config.icon;
                                            return (
                                                <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                                                <span className="text-sm font-bold text-primary">
                                                                    {log.userName?.charAt(0)?.toUpperCase() || "?"}
                                                                </span>
                                                            </div>
                                                            <span className="font-medium text-sm">{log.userName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <LogIn className="h-3.5 w-3.5 text-emerald-500" />
                                                            <span className="font-mono">{formatTime(log.firstLogin)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <LogOut className="h-3.5 w-3.5 text-red-400" />
                                                            <span className="font-mono">{formatTime(log.lastLogout)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="font-mono">{formatDuration(log.totalMinutes)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-center">{log.loginCount}</td>
                                                    <td className="px-4 py-4">
                                                        <Badge variant="outline" className={cn("gap-1 rounded-lg", config.color)}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {config.label}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ─── Monthly Report Tab ────────────────────────────────── */}
            <TabsContent value="monthly" className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <select
                            title="Select month"
                            value={selectedMonth}
                            onChange={(e) => fetchMonthlySummary(Number(e.target.value), selectedYear)}
                            className="rounded-xl border border-white/10 bg-card/40 backdrop-blur-xl px-3 py-2 text-sm"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(2025, i).toLocaleString("en-US", { month: "long" })}
                                </option>
                            ))}
                        </select>
                        <select
                            title="Select year"
                            value={selectedYear}
                            onChange={(e) => fetchMonthlySummary(selectedMonth, Number(e.target.value))}
                            className="rounded-xl border border-white/10 bg-card/40 backdrop-blur-xl px-3 py-2 text-sm"
                        >
                            {[2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        {isPending && <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>}
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl border-white/10 gap-1.5" onClick={handleExportMonthly}>
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                </div>

                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Monthly Summary — {new Date(selectedYear, selectedMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {monthlySummary.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No attendance data for this month</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Days</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">On Time</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Late</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Early Leave</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Hours/Day</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlySummary.map((user: any) => (
                                            <tr key={user.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <span className="text-sm font-bold text-primary">
                                                                {user.userName?.charAt(0)?.toUpperCase() || "?"}
                                                            </span>
                                                        </div>
                                                        <span className="font-medium text-sm">{user.userName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-bold text-lg">{user.totalDays}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 rounded-lg">
                                                        {user.totalDays - user.lateDays - user.earlyLeaveDays}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {user.lateDays > 0 ? (
                                                        <Badge variant="outline" className="bg-amber-500/15 text-amber-500 border-amber-500/30 rounded-lg">
                                                            {user.lateDays}
                                                        </Badge>
                                                    ) : <span className="text-muted-foreground">0</span>}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {user.earlyLeaveDays > 0 ? (
                                                        <Badge variant="outline" className="bg-orange-500/15 text-orange-500 border-orange-500/30 rounded-lg">
                                                            {user.earlyLeaveDays}
                                                        </Badge>
                                                    ) : <span className="text-muted-foreground">0</span>}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-mono text-sm">{formatDuration(user.avgMinutes)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ─── Work Schedule Settings Tab ────────────────────────── */}
            <TabsContent value="settings" className="space-y-6">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-primary" />
                            Work Schedule Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Enable/Disable */}
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
                            <div>
                                <p className="font-medium">Enable Attendance Tracking</p>
                                <p className="text-sm text-muted-foreground">Track late arrivals and early departures</p>
                            </div>
                            <Switch
                                checked={schedule.enabled}
                                onCheckedChange={(checked) => setSchedule((prev: any) => ({ ...prev, enabled: checked }))}
                            />
                        </div>

                        {schedule.enabled && (
                            <>
                                {/* Work Hours */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider">Work Start Time</Label>
                                        <Input
                                            type="time"
                                            value={schedule.startTime}
                                            onChange={(e) => setSchedule((prev: any) => ({ ...prev, startTime: e.target.value }))}
                                            className="rounded-xl border-white/10 bg-black/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider">Work End Time</Label>
                                        <Input
                                            type="time"
                                            value={schedule.endTime}
                                            onChange={(e) => setSchedule((prev: any) => ({ ...prev, endTime: e.target.value }))}
                                            className="rounded-xl border-white/10 bg-black/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider">Grace Period (minutes)</Label>
                                        <Input
                                            type="number"
                                            value={schedule.gracePeriodMinutes}
                                            onChange={(e) => setSchedule((prev: any) => ({ ...prev, gracePeriodMinutes: Number(e.target.value) }))}
                                            className="rounded-xl border-white/10 bg-black/20"
                                            min={0}
                                            max={60}
                                        />
                                    </div>
                                </div>

                                {/* Work Days */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider">Work Days</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAY_NAMES.map((day, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    const days = schedule.workDays.includes(i)
                                                        ? schedule.workDays.filter((d: number) => d !== i)
                                                        : [...schedule.workDays, i].sort();
                                                    setSchedule((prev: any) => ({ ...prev, workDays: days }));
                                                }}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                                    schedule.workDays.includes(i)
                                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                        : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"
                                                )}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Timezone */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider">Timezone</Label>
                                    <select
                                        title="Select timezone"
                                        value={schedule.timezone}
                                        onChange={(e) => setSchedule((prev: any) => ({ ...prev, timezone: e.target.value }))}
                                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                                    >
                                        <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                                        <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                                        <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                                        <option value="Europe/London">Europe/London (GMT+0/+1)</option>
                                        <option value="America/New_York">America/New_York (GMT-5)</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <Button
                            className="rounded-xl bg-primary w-full sm:w-auto"
                            onClick={handleSaveSchedule}
                            disabled={isPending}
                        >
                            {isPending ? "Saving..." : "Save Schedule"}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
