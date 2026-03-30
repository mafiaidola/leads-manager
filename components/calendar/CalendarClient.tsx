"use client";

import { useState, useCallback, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft, ChevronRight, CalendarDays, Clock,
    AlertTriangle, CheckCircle2, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getFollowUpEvents, rescheduleFollowUp } from "@/lib/actions/calendar";
import Link from "next/link";

interface Props {
    currentUserId: string;
    currentUserRole: string;
    isAdmin: boolean;
}

interface FollowUpEvent {
    _id: string;
    leadName: string;
    serialNumber?: number;
    status: string;
    followUpDate: string;
    assignedTo: string;
    assignedToId?: string;
    isFromAdditional: boolean;
    isOverdue: boolean;
    isToday: boolean;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function CalendarClient({ currentUserId, currentUserRole, isAdmin }: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [events, setEvents] = useState<FollowUpEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [dragEvent, setDragEvent] = useState<string | null>(null);

    // Fetch events when month changes
    useEffect(() => {
        setLoading(true);
        getFollowUpEvents(currentMonth, currentYear).then(data => {
            setEvents(data);
            setLoading(false);
        });
    }, [currentMonth, currentYear]);

    // Navigate months
    const prevMonth = useCallback(() => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    }, [currentMonth]);

    const nextMonth = useCallback(() => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    }, [currentMonth]);

    const goToday = useCallback(() => {
        setCurrentMonth(now.getMonth() + 1);
        setCurrentYear(now.getFullYear());
    }, []);

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth - 1, 1);
        const lastDay = new Date(currentYear, currentMonth, 0);
        const daysInMonth = lastDay.getDate();

        // 0=Sun, adjust to Mon=0
        let startDow = firstDay.getDay() - 1;
        if (startDow < 0) startDow = 6;

        const days: { date: number; isCurrentMonth: boolean; dateStr: string }[] = [];

        // Previous month padding
        const prevMonthLast = new Date(currentYear, currentMonth - 1, 0).getDate();
        for (let i = startDow - 1; i >= 0; i--) {
            const d = prevMonthLast - i;
            const m = currentMonth - 1 < 1 ? 12 : currentMonth - 1;
            const y = currentMonth - 1 < 1 ? currentYear - 1 : currentYear;
            days.push({ date: d, isCurrentMonth: false, dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
        }

        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            days.push({
                date: d,
                isCurrentMonth: true,
                dateStr: `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
            });
        }

        // Next month padding to fill 6 rows
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            const m = currentMonth + 1 > 12 ? 1 : currentMonth + 1;
            const y = currentMonth + 1 > 12 ? currentYear + 1 : currentYear;
            days.push({ date: d, isCurrentMonth: false, dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
        }

        return days;
    }, [currentMonth, currentYear]);

    // Group events by date string
    const eventsByDate = useMemo(() => {
        const map: Record<string, FollowUpEvent[]> = {};
        events.forEach(ev => {
            const dateStr = new Date(ev.followUpDate).toISOString().split("T")[0];
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(ev);
        });
        return map;
    }, [events]);

    // Stats
    const stats = useMemo(() => {
        const total = events.length;
        const overdue = events.filter(e => e.isOverdue).length;
        const today = events.filter(e => e.isToday).length;
        const upcoming = total - overdue - today;
        return { total, overdue, today, upcoming };
    }, [events]);

    // Drag & Drop handlers
    const handleDragStart = useCallback((eventId: string) => {
        setDragEvent(eventId);
    }, []);

    const handleDrop = useCallback((dateStr: string) => {
        if (!dragEvent) return;
        startTransition(async () => {
            const res = await rescheduleFollowUp(dragEvent, dateStr);
            if (res.success) {
                toast({ title: "✅ Follow-up rescheduled" });
                // Refresh events
                getFollowUpEvents(currentMonth, currentYear).then(setEvents);
            } else {
                toast({ title: res.message, variant: "destructive" });
            }
            setDragEvent(null);
        });
    }, [dragEvent, currentMonth, currentYear, toast]);

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total Follow-ups", value: stats.total, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
                    { label: "Overdue", value: stats.overdue, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                    { label: "Today", value: stats.today, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                    { label: "Upcoming", value: stats.upcoming, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                ].map(card => (
                    <div key={card.label} className={cn("p-4 rounded-2xl border text-center transition-all hover:scale-[1.02]", card.bg)}>
                        <div className={cn("text-2xl font-extrabold", card.color)}>{card.value}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl hover:bg-white/10 h-9 w-9">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-bold min-w-[200px] text-center">
                        {MONTH_NAMES[currentMonth - 1]} {currentYear}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl hover:bg-white/10 h-9 w-9">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button variant="outline" size="sm" onClick={goToday} className="rounded-xl border-white/10 bg-white/5 text-xs">
                    <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Today
                </Button>
            </div>

            {/* Calendar Grid */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardContent className="p-0">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-white/10">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="px-2 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Day Cells */}
                    {loading ? (
                        <div className="h-[600px] flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, idx) => {
                                const dayEvents = eventsByDate[day.dateStr] || [];
                                const isToday = day.dateStr === todayStr;
                                const hasOverdue = dayEvents.some(e => e.isOverdue);

                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "min-h-[100px] md:min-h-[120px] border-b border-r border-white/5 p-1.5 transition-colors",
                                            !day.isCurrentMonth && "opacity-30",
                                            isToday && "bg-primary/[0.06]",
                                            dragEvent && "hover:bg-primary/10 cursor-crosshair"
                                        )}
                                        onDragOver={(e) => { e.preventDefault(); }}
                                        onDrop={() => handleDrop(day.dateStr)}
                                    >
                                        {/* Date number */}
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={cn(
                                                "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                                isToday && "bg-primary text-white font-bold",
                                                hasOverdue && !isToday && "text-red-400"
                                            )}>
                                                {day.date}
                                            </span>
                                            {dayEvents.length > 0 && (
                                                <span className="text-[9px] text-muted-foreground">{dayEvents.length}</span>
                                            )}
                                        </div>

                                        {/* Events */}
                                        <div className="space-y-0.5">
                                            {dayEvents.slice(0, 3).map(ev => (
                                                <Link
                                                    key={ev._id}
                                                    href={`/leads/${ev._id}`}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.stopPropagation();
                                                        handleDragStart(ev._id);
                                                    }}
                                                    className={cn(
                                                        "block px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate cursor-grab active:cursor-grabbing transition-all hover:ring-1 hover:ring-primary/30",
                                                        ev.isOverdue
                                                            ? "bg-red-500/15 text-red-300 border-l-2 border-red-500"
                                                            : ev.isToday
                                                                ? "bg-amber-500/15 text-amber-300 border-l-2 border-amber-500 animate-pulse"
                                                                : "bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500"
                                                    )}
                                                    title={`${ev.leadName} — ${ev.assignedTo} — ${ev.status}`}
                                                >
                                                    {ev.serialNumber ? `#${ev.serialNumber} ` : ""}{ev.leadName}
                                                </Link>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[9px] text-muted-foreground pl-1.5">
                                                    +{dayEvents.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-500/15 border-l-2 border-red-500" />
                    <span>Overdue</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500/15 border-l-2 border-amber-500" />
                    <span>Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500/10 border-l-2 border-emerald-500" />
                    <span>Upcoming</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3" />
                    <span>Drag & drop to reschedule</span>
                </div>
            </div>
        </div>
    );
}
