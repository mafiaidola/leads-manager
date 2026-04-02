/**
 * @component CheckInOutWidget
 * @description Professional check-in/check-out attendance widget with:
 *   - Non-dismissible check-in popup on first login (mandatory)
 *   - Live ticking timer in header showing hours worked
 *   - Color-coded timer (green → amber → red based on schedule)
 *   - Late arrival warning with exact minutes
 *   - Beautiful checkout summary dialog
 *   - Real-time clock in check-in modal
 */
"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, LogOut, Clock, CheckCircle2, ShieldCheck, AlertTriangle, Sparkles, Timer, Zap } from "lucide-react";
import { getMyAttendanceToday, checkIn, checkOut } from "@/lib/actions/attendance";
import { useToast } from "@/hooks/use-toast";

interface WorkSchedule {
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
}

interface AttendanceState {
    loaded: boolean;
    checkedIn: boolean;
    checkedOut: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalMinutes: number | null;
    lateMinutes: number;
    overtimeMinutes: number;
    autoCheckedOut: boolean;
    status: string | null;
    workSchedule: WorkSchedule | null;
}

// Timer status colors
function getTimerStatus(elapsedMinutes: number, schedule: WorkSchedule | null): "normal" | "warning" | "overtime" {
    if (!schedule) return "normal";
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const totalWorkMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const warningThreshold = totalWorkMinutes - 30; // Last 30 min

    if (elapsedMinutes >= totalWorkMinutes) return "overtime";
    if (elapsedMinutes >= warningThreshold) return "warning";
    return "normal";
}

const TIMER_STYLES = {
    normal: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        icon: "text-emerald-500",
        glow: "",
    },
    warning: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        icon: "text-amber-500",
        glow: "animate-pulse",
    },
    overtime: {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-400",
        icon: "text-red-500",
        glow: "animate-pulse",
    },
};

export function CheckInOutWidget({ userName }: { userName?: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [showPopup, setShowPopup] = useState(false);
    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
    const [showCheckoutSummary, setShowCheckoutSummary] = useState(false);
    const [checkoutResult, setCheckoutResult] = useState<any>(null);
    const [attendance, setAttendance] = useState<AttendanceState>({
        loaded: false,
        checkedIn: false,
        checkedOut: false,
        checkInTime: null,
        checkOutTime: null,
        totalMinutes: null,
        lateMinutes: 0,
        overtimeMinutes: 0,
        autoCheckedOut: false,
        status: null,
        workSchedule: null,
    });

    // Check-in form state
    const [nameInput, setNameInput] = useState(userName || "");
    const [attestation, setAttestation] = useState(false);
    const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);

    // Live timer state
    const [elapsed, setElapsed] = useState(0); // seconds
    const [liveClock, setLiveClock] = useState("");
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Pre-fill name
    useEffect(() => {
        if (userName) setNameInput(userName);
    }, [userName]);

    // Live clock for popup
    useEffect(() => {
        const updateClock = () => {
            setLiveClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        };
        updateClock();
        clockRef.current = setInterval(updateClock, 1000);
        return () => { if (clockRef.current) clearInterval(clockRef.current); };
    }, []);

    // Check attendance on mount
    useEffect(() => {
        getMyAttendanceToday().then(data => {
            if (data && data.checkedIn) {
                setAttendance({
                    loaded: true,
                    checkedIn: true,
                    checkedOut: data.checkedOut,
                    checkInTime: data.firstLogin || null,
                    checkOutTime: data.lastLogout || null,
                    totalMinutes: data.totalMinutes || null,
                    lateMinutes: data.lateMinutes || 0,
                    overtimeMinutes: data.overtimeMinutes || 0,
                    autoCheckedOut: data.autoCheckedOut || false,
                    status: data.status || null,
                    workSchedule: data.workSchedule || null,
                });
            } else {
                // Not checked in today — show mandatory popup
                setAttendance(prev => ({
                    ...prev,
                    loaded: true,
                    workSchedule: data?.workSchedule || null,
                }));
                setShowPopup(true);
            }
        });
    }, []);

    // Live elapsed timer (runs when checked in and not checked out)
    useEffect(() => {
        if (attendance.checkedIn && !attendance.checkedOut && attendance.checkInTime) {
            const checkInMs = new Date(attendance.checkInTime).getTime();
            const updateElapsed = () => {
                setElapsed(Math.floor((Date.now() - checkInMs) / 1000));
            };
            updateElapsed();
            timerRef.current = setInterval(updateElapsed, 1000);
            return () => { if (timerRef.current) clearInterval(timerRef.current); };
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [attendance.checkedIn, attendance.checkedOut, attendance.checkInTime]);

    const handleCheckIn = useCallback(() => {
        if (!nameInput.trim() || !attestation) return;
        startTransition(async () => {
            const res = await checkIn();
            if (res.success) {
                toast({ title: `✅ ${res.message}` });
                // Re-fetch to get full data including schedule
                const data = await getMyAttendanceToday();
                if (data && data.checkedIn) {
                    setAttendance({
                        loaded: true,
                        checkedIn: true,
                        checkedOut: false,
                        checkInTime: data.firstLogin || res.time || new Date().toISOString(),
                        checkOutTime: null,
                        totalMinutes: null,
                        lateMinutes: data.lateMinutes || 0,
                        overtimeMinutes: 0,
                        autoCheckedOut: false,
                        status: data.status || (res as any).status || "PRESENT",
                        workSchedule: data.workSchedule || null,
                    });
                }
                setShowPopup(false);
                setAttestation(false);
            } else {
                toast({ title: res.message, variant: "destructive" });
                if (res.message === "Already checked in today") {
                    setShowPopup(false);
                    // Re-fetch
                    const data = await getMyAttendanceToday();
                    if (data && data.checkedIn) {
                        setAttendance({
                            loaded: true,
                            checkedIn: true,
                            checkedOut: data.checkedOut,
                            checkInTime: data.firstLogin || null,
                            checkOutTime: data.lastLogout || null,
                            totalMinutes: data.totalMinutes || null,
                            lateMinutes: data.lateMinutes || 0,
                            overtimeMinutes: data.overtimeMinutes || 0,
                            autoCheckedOut: data.autoCheckedOut || false,
                            status: data.status || null,
                            workSchedule: data.workSchedule || null,
                        });
                    }
                }
            }
        });
    }, [toast, nameInput, attestation]);

    const handleCheckOut = useCallback(() => {
        if (!checkoutConfirmed) return;
        startTransition(async () => {
            const res = await checkOut();
            if (res.success) {
                setCheckoutResult(res);
                setAttendance(prev => ({
                    ...prev,
                    checkedOut: true,
                    checkOutTime: res.time || new Date().toISOString(),
                    totalMinutes: res.totalMinutes || null,
                    overtimeMinutes: res.overtimeMinutes || 0,
                    status: res.status || prev.status,
                }));
                setShowCheckoutConfirm(false);
                setCheckoutConfirmed(false);
                // Show beautiful summary
                setShowCheckoutSummary(true);
            } else {
                toast({ title: res.message, variant: "destructive" });
                setShowCheckoutConfirm(false);
                setCheckoutConfirmed(false);
            }
        });
    }, [toast, checkoutConfirmed]);

    const formatTime = (iso: string | null) => {
        if (!iso) return "--:--";
        return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatElapsed = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
        return `${m}m ${String(s).padStart(2, "0")}s`;
    };

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const isLateNow = () => {
        const sched = attendance.workSchedule;
        if (!sched) return false;
        const [startH, startM] = sched.startTime.split(":").map(Number);
        const grace = sched.gracePeriodMinutes || 0;
        const startMin = startH * 60 + startM + grace;
        const now = new Date();
        return (now.getHours() * 60 + now.getMinutes()) > startMin;
    };

    const canCheckIn = nameInput.trim().length > 0 && attestation;
    const timerStatus = getTimerStatus(Math.floor(elapsed / 60), attendance.workSchedule);
    const timerStyle = TIMER_STYLES[timerStatus];

    if (!attendance.loaded) return null;

    return (
        <>
            {/* ── Header: Not checked in → pulsing Check In button ──── */}
            {!attendance.checkedIn && (
                <Button
                    size="sm"
                    onClick={() => setShowPopup(true)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold h-8 px-3 shadow-lg shadow-emerald-500/20 animate-pulse"
                >
                    <LogIn className="h-3.5 w-3.5 mr-1.5" />
                    Check In
                </Button>
            )}

            {/* ── Header: Checked in → Live timer button ──── */}
            {attendance.checkedIn && !attendance.checkedOut && (
                <button
                    onClick={() => {
                        setCheckoutConfirmed(false);
                        setShowCheckoutConfirm(true);
                    }}
                    disabled={isPending}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all hover:scale-[1.02] ${timerStyle.bg} ${timerStyle.border} ${timerStyle.glow}`}
                >
                    <LogOut className={`h-3.5 w-3.5 ${timerStyle.icon}`} />
                    <span className="font-mono text-foreground">{formatElapsed(elapsed)}</span>
                    <span className={`text-[10px] ${timerStyle.text}`}>
                        ({formatTime(attendance.checkInTime)})
                    </span>
                </button>
            )}

            {/* ── Header: Checked out → Summary badge ──── */}
            {attendance.checkedIn && attendance.checkedOut && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                        {formatTime(attendance.checkInTime)} — {formatTime(attendance.checkOutTime)}
                    </span>
                    {attendance.totalMinutes && (
                        <span className="text-[10px] opacity-70">
                            ({formatDuration(attendance.totalMinutes)})
                        </span>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                CHECK-IN POPUP — NON-DISMISSIBLE
               ══════════════════════════════════════════════════════════ */}
            <Dialog open={showPopup} onOpenChange={() => { /* cannot dismiss */ }}>
                <DialogContent
                    className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl max-w-md"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    // Hide the close button
                    hideCloseButton
                >
                    <DialogHeader className="text-center pb-2">
                        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-teal-500/5 flex items-center justify-center mb-3 shadow-xl shadow-emerald-500/10">
                            <Clock className="h-10 w-10 text-emerald-400" />
                        </div>
                        <DialogTitle className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}! 👋
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Please confirm your attendance to start your day.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        {/* Date + Live Clock */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Date</span>
                                <span className="text-sm font-bold mt-1">
                                    {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                </span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Current Time</span>
                                <span className="text-lg font-black font-mono mt-0.5 text-emerald-400">
                                    {liveClock}
                                </span>
                            </div>
                        </div>

                        {/* Late Warning */}
                        {isLateNow() && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 animate-pulse">
                                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-amber-400">Late Arrival</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Work started at {attendance.workSchedule?.startTime} — you&apos;re checking in late
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Name Input (Digital Signature) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">
                                Digital Signature <span className="text-red-400">*</span>
                            </label>
                            <Input
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="Type your full name to confirm"
                                className="rounded-xl border-white/10 bg-white/5 focus:ring-emerald-500/20 text-base py-5"
                                autoFocus
                            />
                        </div>

                        {/* Attestation */}
                        <label className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/15 cursor-pointer hover:bg-emerald-500/10 transition-all select-none group">
                            <div className="relative mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={attestation}
                                    onChange={(e) => setAttestation(e.target.checked)}
                                    className="h-5 w-5 rounded-md border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/20 accent-emerald-500 cursor-pointer"
                                />
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-bold leading-tight group-hover:text-emerald-400 transition-colors">
                                    I confirm I am present and attending at the office
                                </span>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    This digital signature is recorded in your attendance log
                                </p>
                            </div>
                        </label>
                    </div>

                    <DialogFooter className="flex gap-2 sm:flex-col pt-2">
                        <Button
                            onClick={handleCheckIn}
                            disabled={isPending || !canCheckIn}
                            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-base py-6 shadow-xl shadow-emerald-500/25 disabled:opacity-40 transition-all hover:scale-[1.01]"
                        >
                            {isPending ? (
                                <span className="flex items-center"><Sparkles className="h-5 w-5 mr-2 animate-spin" /> Checking In…</span>
                            ) : (
                                <span className="flex items-center"><LogIn className="h-5 w-5 mr-2" /> Check In Now</span>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════════════════════════
                CHECK-OUT CONFIRMATION
               ══════════════════════════════════════════════════════════ */}
            <Dialog open={showCheckoutConfirm} onOpenChange={(open) => { if (!open) { setShowCheckoutConfirm(false); setCheckoutConfirmed(false); } }}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl max-w-sm">
                    <DialogHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center mb-3">
                            <ShieldCheck className="h-8 w-8 text-red-400" />
                        </div>
                        <DialogTitle className="text-xl font-bold">
                            End Your Day?
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            You&apos;re about to check out and finalize your attendance.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        {/* Work Summary */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col items-center p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Checked In</span>
                                <span className="text-sm font-bold text-emerald-400 mt-1">
                                    {formatTime(attendance.checkInTime)}
                                </span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Time Worked</span>
                                <span className="text-sm font-bold font-mono mt-1">
                                    {formatElapsed(elapsed)}
                                </span>
                            </div>
                        </div>

                        {/* Confirmation Checkbox */}
                        <label className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-all select-none group">
                            <input
                                type="checkbox"
                                checked={checkoutConfirmed}
                                onChange={(e) => setCheckoutConfirmed(e.target.checked)}
                                className="mt-0.5 h-5 w-5 rounded-md border-red-500/30 bg-white/5 text-red-500 focus:ring-red-500/20 accent-red-500"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-bold leading-tight text-red-400 group-hover:text-red-300 transition-colors">
                                    I confirm I want to check out for today
                                </span>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    You won&apos;t be able to check in again today
                                </p>
                            </div>
                        </label>
                    </div>

                    <DialogFooter className="flex gap-2 sm:flex-col">
                        <Button
                            onClick={handleCheckOut}
                            disabled={isPending || !checkoutConfirmed}
                            className="w-full rounded-2xl bg-red-600 hover:bg-red-500 font-bold text-base py-5 shadow-lg shadow-red-500/25 disabled:opacity-40"
                        >
                            <LogOut className="h-5 w-5 mr-2" />
                            {isPending ? "Checking Out…" : "Confirm Check Out"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => { setShowCheckoutConfirm(false); setCheckoutConfirmed(false); }}
                            className="w-full rounded-xl text-xs text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════════════════════════
                CHECKOUT SUMMARY — Beautiful end-of-day report
               ══════════════════════════════════════════════════════════ */}
            <Dialog open={showCheckoutSummary} onOpenChange={setShowCheckoutSummary}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl max-w-sm">
                    <DialogHeader className="text-center pb-2">
                        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-blue-500/10 flex items-center justify-center mb-3 shadow-xl shadow-emerald-500/10">
                            <Sparkles className="h-10 w-10 text-emerald-400" />
                        </div>
                        <DialogTitle className="text-2xl font-black">
                            Great Work Today! 🎉
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Here&apos;s your day summary
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        {/* Timeline */}
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-violet-500/5 border border-white/10">
                            <div className="flex flex-col items-center">
                                <LogIn className="h-4 w-4 text-emerald-400 mb-1" />
                                <span className="text-xs font-bold text-emerald-400">
                                    {formatTime(attendance.checkInTime)}
                                </span>
                            </div>
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-emerald-500/40 via-blue-500/40 to-red-400/40 rounded-full" />
                            <div className="flex flex-col items-center">
                                <LogOut className="h-4 w-4 text-red-400 mb-1" />
                                <span className="text-xs font-bold text-red-400">
                                    {formatTime(attendance.checkOutTime)}
                                </span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col items-center p-3 rounded-2xl bg-blue-500/5 border border-blue-500/15">
                                <Timer className="h-4 w-4 text-blue-400 mb-1" />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Hours</span>
                                <span className="text-lg font-black text-blue-400 font-mono">
                                    {attendance.totalMinutes ? formatDuration(attendance.totalMinutes) : "--"}
                                </span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                                <Zap className="h-4 w-4 text-primary mb-1" />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Status</span>
                                <span className={`text-sm font-bold mt-1 ${
                                    attendance.status === "PRESENT" ? "text-emerald-400" :
                                    attendance.status === "LATE" ? "text-amber-400" :
                                    attendance.status === "EARLY_LEAVE" ? "text-orange-400" : "text-foreground"
                                }`}>
                                    {attendance.status === "PRESENT" ? "On Time ✅" :
                                     attendance.status === "LATE" ? "Late ⏰" :
                                     attendance.status === "EARLY_LEAVE" ? "Early Leave ⚡" : attendance.status}
                                </span>
                            </div>
                        </div>

                        {/* Overtime / Late Info */}
                        {(attendance.lateMinutes > 0 || attendance.overtimeMinutes > 0) && (
                            <div className="flex gap-3">
                                {attendance.lateMinutes > 0 && (
                                    <div className="flex-1 p-2 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
                                        <span className="text-[10px] text-muted-foreground block">Late By</span>
                                        <span className="text-sm font-bold text-amber-400">{attendance.lateMinutes}m</span>
                                    </div>
                                )}
                                {attendance.overtimeMinutes > 0 && (
                                    <div className="flex-1 p-2 rounded-xl bg-violet-500/5 border border-violet-500/15 text-center">
                                        <span className="text-[10px] text-muted-foreground block">Overtime</span>
                                        <span className="text-sm font-bold text-violet-400">{attendance.overtimeMinutes}m</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Motivational Message */}
                        <div className="text-center p-3 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/10">
                            <p className="text-sm text-muted-foreground">
                                {attendance.totalMinutes && attendance.totalMinutes >= 480
                                    ? "💪 Excellent productivity! Full day completed."
                                    : attendance.totalMinutes && attendance.totalMinutes >= 360
                                    ? "👍 Solid work session! Keep it up."
                                    : "🌟 Every hour counts. See you tomorrow!"}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => setShowCheckoutSummary(false)}
                            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold py-5"
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
