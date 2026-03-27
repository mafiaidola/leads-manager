/**
 * @component AttendanceClient
 * @description Interactive attendance dashboard for admins.
 *
 * Features:
 * - Daily view: who logged in, login/logout times, status badges, absent employees
 * - Monthly summary: table with total days, late count, avg hours, attendance rate
 * - Work schedule settings: start/end time, grace period, work days, holidays
 * - Export to CSV (daily + monthly)
 * - Date picker for daily view, month/year picker for summary
 */
"use client";

import React, { useState, useCallback, useTransition, useMemo } from "react";
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
    TrendingUp, Timer, Plus, Trash2, CalendarOff, BarChart3,
    UserX, PartyPopper,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    getAttendanceLogs, getAttendanceSummary, updateWorkSchedule,
    addHoliday, removeHoliday,
} from "@/lib/actions/attendance";

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
        holidays: [],
    });

    // Holiday form state
    const [newHolidayDate, setNewHolidayDate] = useState("");
    const [newHolidayName, setNewHolidayName] = useState("");

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

    // ─── Add Holiday ───────────────────────────────────────────────────
    const handleAddHoliday = useCallback(async () => {
        if (!newHolidayDate || !newHolidayName.trim()) {
            toast({ title: "Please enter both date and name", variant: "destructive" });
            return;
        }
        startTransition(async () => {
            const result = await addHoliday({ date: newHolidayDate, name: newHolidayName.trim() });
            if (result.success) {
                setSchedule((prev: any) => ({
                    ...prev,
                    holidays: [...(prev.holidays || []), { date: newHolidayDate, name: newHolidayName.trim() }],
                }));
                setNewHolidayDate("");
                setNewHolidayName("");
                toast({ title: "Holiday added" });
            }
        });
    }, [newHolidayDate, newHolidayName, toast]);

    // ─── Remove Holiday ────────────────────────────────────────────────
    const handleRemoveHoliday = useCallback(async (date: string) => {
        startTransition(async () => {
            const result = await removeHoliday(date);
            if (result.success) {
                setSchedule((prev: any) => ({
                    ...prev,
                    holidays: (prev.holidays || []).filter((h: any) => h.date !== date),
                }));
                toast({ title: "Holiday removed" });
            }
        });
    }, [toast]);

    // ─── Export CSV ─────────────────────────────────────────────────────
    const handleExportDaily = useCallback(() => {
        const headers = ["Name", "Date", "Check In", "Check Out", "Duration (min)", "Status", "Login Count", "IP Address"];
        const rows = dailyLogs.map((log: any) => [
            log.userName,
            log.date,
            formatTime(log.firstLogin),
            formatTime(log.lastLogout),
            log.totalMinutes || 0,
            log.status,
            log.loginCount,
            log.ipAddress || "",
        ]);
        // Add absent employees
        const loggedUserIds = new Set(dailyLogs.map((l: any) => l.userId));
        orgUsers.forEach((u: any) => {
            if (!loggedUserIds.has(u._id)) {
                rows.push([u.name, selectedDate, "", "", 0, "ABSENT", 0, ""]);
            }
        });
        const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_${selectedDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Attendance exported" });
    }, [dailyLogs, orgUsers, selectedDate, toast]);

    const handleExportMonthly = useCallback(() => {
        const headers = ["Name", "Total Days", "On Time", "Late Days", "Early Leave", "Attendance Rate", "Avg Hours/Day"];
        const workDaysInMonth = getWorkDaysInMonth(selectedMonth, selectedYear, schedule.workDays, schedule.holidays);
        const rows = monthlySummary.map((u: any) => {
            const onTime = u.totalDays - u.lateDays - u.earlyLeaveDays;
            const rate = workDaysInMonth > 0 ? Math.round((u.totalDays / workDaysInMonth) * 100) : 0;
            return [
                u.userName,
                u.totalDays,
                onTime,
                u.lateDays,
                u.earlyLeaveDays,
                `${rate}%`,
                formatDuration(u.avgMinutes),
            ];
        });
        const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Monthly report exported" });
    }, [monthlySummary, selectedMonth, selectedYear, schedule, toast]);

    // ─── Stats cards ───────────────────────────────────────────────────
    const dailyStats = useMemo(() => {
        const present = dailyLogs.filter((l: any) => l.status === "PRESENT").length;
        const late = dailyLogs.filter((l: any) => l.status === "LATE").length;
        const earlyLeave = dailyLogs.filter((l: any) => l.status === "EARLY_LEAVE").length;
        const absent = orgUsers.length - dailyLogs.length;
        const totalWorkMinutes = dailyLogs.reduce((sum: number, l: any) => sum + (l.totalMinutes || 0), 0);
        const avgWorkMinutes = dailyLogs.length > 0 ? Math.round(totalWorkMinutes / dailyLogs.length) : 0;
        return { present, late, earlyLeave, absent: Math.max(0, absent), total: dailyLogs.length, avgWorkMinutes };
    }, [dailyLogs, orgUsers]);

    // Absent employees list
    const absentEmployees = useMemo(() => {
        const loggedUserIds = new Set(dailyLogs.map((l: any) => l.userId));
        return orgUsers.filter((u: any) => !loggedUserIds.has(u._id));
    }, [dailyLogs, orgUsers]);

    // Monthly stats
    const monthlyStats = useMemo(() => {
        const workDaysInMonth = getWorkDaysInMonth(selectedMonth, selectedYear, schedule.workDays, schedule.holidays);
        return { workDaysInMonth };
    }, [selectedMonth, selectedYear, schedule]);

    // Check if selected date is a holiday
    const isHoliday = useMemo(() => {
        return (schedule.holidays || []).some((h: any) => h.date === selectedDate);
    }, [schedule.holidays, selectedDate]);

    const holidayName = useMemo(() => {
        return (schedule.holidays || []).find((h: any) => h.date === selectedDate)?.name || "";
    }, [schedule.holidays, selectedDate]);

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

                {/* Holiday Banner */}
                {isHoliday && (
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/20">
                        <PartyPopper className="h-5 w-5 text-amber-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-amber-400">Holiday — {holidayName}</p>
                            <p className="text-xs text-muted-foreground">This day is marked as a holiday for the organization</p>
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl border-t-4 border-t-blue-500">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Work</p>
                                    <p className="text-lg font-black text-blue-500">{formatDuration(dailyStats.avgWorkMinutes)}</p>
                                </div>
                                <Timer className="h-8 w-8 text-blue-500/20" />
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
                        {dailyLogs.length === 0 && absentEmployees.length === 0 ? (
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
                                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">IP</th>
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
                                                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px] block">
                                                            {log.ipAddress || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Badge variant="outline" className={cn("gap-1 rounded-lg", config.color)}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {config.label}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Absent Employees */}
                                        {absentEmployees.map((user: any) => (
                                            <tr key={`absent-${user._id}`} className="border-b border-white/5 bg-red-500/[0.02]">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                                                            <span className="text-sm font-bold text-red-400">
                                                                {user.name?.charAt(0)?.toUpperCase() || "?"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-sm">{user.name}</span>
                                                            <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1 bg-white/5 text-muted-foreground">
                                                                {user.role}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-muted-foreground/40 text-sm">—</td>
                                                <td className="px-4 py-4 text-muted-foreground/40 text-sm">—</td>
                                                <td className="px-4 py-4 text-muted-foreground/40 text-sm">—</td>
                                                <td className="px-4 py-4 text-muted-foreground/40 text-sm text-center">0</td>
                                                <td className="px-4 py-4 text-muted-foreground/40 text-sm">—</td>
                                                <td className="px-4 py-4">
                                                    <Badge variant="outline" className="gap-1 rounded-lg bg-red-500/15 text-red-500 border-red-500/30">
                                                        <UserX className="h-3 w-3" />
                                                        Absent
                                                    </Badge>
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

                {/* Monthly Overview Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl border-t-4 border-t-primary">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Work Days</p>
                                    <p className="text-2xl font-black text-primary">{monthlyStats.workDaysInMonth}</p>
                                </div>
                                <CalendarDays className="h-8 w-8 text-primary/20" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl border-t-4 border-t-emerald-500">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Employees</p>
                                    <p className="text-2xl font-black text-emerald-500">{monthlySummary.length}</p>
                                </div>
                                <Users className="h-8 w-8 text-emerald-500/20" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl border-t-4 border-t-amber-500">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Late</p>
                                    <p className="text-2xl font-black text-amber-500">
                                        {monthlySummary.reduce((sum: number, u: any) => sum + u.lateDays, 0)}
                                    </p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-amber-500/20" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl border-t-4 border-t-blue-500">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Rate</p>
                                    <p className="text-2xl font-black text-blue-500">
                                        {monthlySummary.length > 0 && monthlyStats.workDaysInMonth > 0
                                            ? Math.round(
                                                monthlySummary.reduce((sum: number, u: any) => sum + u.totalDays, 0) /
                                                (monthlySummary.length * monthlyStats.workDaysInMonth) * 100
                                            ) : 0}%
                                    </p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-blue-500/20" />
                            </div>
                        </CardContent>
                    </Card>
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
                                            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Rate</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Hours/Day</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlySummary.map((user: any) => {
                                            const onTime = user.totalDays - user.lateDays - user.earlyLeaveDays;
                                            const rate = monthlyStats.workDaysInMonth > 0
                                                ? Math.round((user.totalDays / monthlyStats.workDaysInMonth) * 100)
                                                : 0;
                                            return (
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
                                                        <span className="text-xs text-muted-foreground">/{monthlyStats.workDaysInMonth}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 rounded-lg">
                                                            {onTime}
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
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={cn(
                                                                "font-bold text-sm",
                                                                rate >= 90 ? "text-emerald-500" : rate >= 70 ? "text-amber-500" : "text-red-500"
                                                            )}>
                                                                {rate}%
                                                            </span>
                                                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all duration-500",
                                                                        rate >= 90 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-red-500"
                                                                    )}
                                                                    style={{ width: `${Math.min(rate, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="font-mono text-sm">{formatDuration(user.avgMinutes)}</span>
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

                {/* Holidays / Days Off Management */}
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <CalendarOff className="h-5 w-5 text-amber-500" />
                            Holidays & Days Off
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Add official holidays and days off. Employees will not be marked as absent on these dates.
                        </p>

                        {/* Add Holiday Form */}
                        <div className="flex flex-col sm:flex-row items-end gap-3 p-4 rounded-2xl border border-white/10 bg-white/5">
                            <div className="space-y-2 flex-1 w-full sm:w-auto">
                                <Label className="text-xs font-bold uppercase tracking-wider">Date</Label>
                                <Input
                                    type="date"
                                    value={newHolidayDate}
                                    onChange={(e) => setNewHolidayDate(e.target.value)}
                                    className="rounded-xl border-white/10 bg-black/20"
                                />
                            </div>
                            <div className="space-y-2 flex-1 w-full sm:w-auto">
                                <Label className="text-xs font-bold uppercase tracking-wider">Holiday Name</Label>
                                <Input
                                    value={newHolidayName}
                                    onChange={(e) => setNewHolidayName(e.target.value)}
                                    placeholder="e.g. National Day"
                                    className="rounded-xl border-white/10 bg-black/20"
                                />
                            </div>
                            <Button
                                onClick={handleAddHoliday}
                                disabled={isPending || !newHolidayDate || !newHolidayName.trim()}
                                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5 w-full sm:w-auto"
                            >
                                <Plus className="h-4 w-4" />
                                Add Holiday
                            </Button>
                        </div>

                        {/* Holiday List */}
                        {(schedule.holidays || []).length > 0 ? (
                            <div className="space-y-2">
                                {(schedule.holidays || [])
                                    .sort((a: any, b: any) => a.date.localeCompare(b.date))
                                    .map((holiday: any) => {
                                        const isPast = new Date(holiday.date) < new Date(new Date().toISOString().split("T")[0]);
                                        return (
                                            <div
                                                key={holiday.date}
                                                className={cn(
                                                    "flex items-center justify-between px-4 py-3 rounded-xl border transition-colors",
                                                    isPast
                                                        ? "border-white/5 bg-white/[0.02] opacity-60"
                                                        : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                                        <PartyPopper className="h-5 w-5 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{holiday.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(holiday.date + "T00:00:00").toLocaleDateString("en-US", {
                                                                weekday: "long",
                                                                month: "long",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                            {isPast && <span className="ml-2 text-muted-foreground/50">(Past)</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveHoliday(holiday.date)}
                                                    disabled={isPending}
                                                    className="h-8 w-8 p-0 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-muted-foreground rounded-xl border border-dashed border-white/10">
                                <CalendarOff className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">No holidays configured</p>
                                <p className="text-xs mt-1">Add holidays above to exclude them from attendance calculations</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

// ─── Helper: count work days in a given month ──────────────────────────────────
function getWorkDaysInMonth(
    month: number,
    year: number,
    workDays: number[],
    holidays: { date: string; name: string }[] = []
): number {
    const holidayDates = new Set(holidays.map(h => h.date));
    let count = 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const dayOfWeek = date.getDay();
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (workDays.includes(dayOfWeek) && !holidayDates.has(dateStr)) {
            count++;
        }
    }
    return count;
}
