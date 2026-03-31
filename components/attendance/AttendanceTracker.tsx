/**
 * @component CheckInOutWidget
 * @description Explicit check-in/check-out attendance widget.
 * 
 * On mount: checks if user has checked in today.
 * - If NOT checked in: shows a one-time popup modal to check in.
 * - If checked in but NOT checked out: shows a header "Check Out" button.
 * - If checked out: shows a summary badge in header.
 * 
 * Also provides header-level buttons for manual check-in/check-out
 * if the user dismisses the popup.
 */
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, LogOut, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyAttendanceToday, checkIn, checkOut } from "@/lib/actions/attendance";
import { useToast } from "@/hooks/use-toast";

interface AttendanceState {
    loaded: boolean;
    checkedIn: boolean;
    checkedOut: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalMinutes: number | null;
    status: string | null;
}

export function CheckInOutWidget() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [showPopup, setShowPopup] = useState(false);
    const [attendance, setAttendance] = useState<AttendanceState>({
        loaded: false,
        checkedIn: false,
        checkedOut: false,
        checkInTime: null,
        checkOutTime: null,
        totalMinutes: null,
        status: null,
    });

    // Check attendance on mount
    useEffect(() => {
        getMyAttendanceToday().then(data => {
            if (data) {
                setAttendance({
                    loaded: true,
                    checkedIn: data.checkedIn,
                    checkedOut: data.checkedOut,
                    checkInTime: data.firstLogin,
                    checkOutTime: data.lastLogout,
                    totalMinutes: data.totalMinutes,
                    status: data.status,
                });
            } else {
                // Not checked in today — show popup once
                setAttendance(prev => ({ ...prev, loaded: true }));
                // Only show popup if we haven't dismissed it this session
                const dismissed = sessionStorage.getItem("attendance_popup_dismissed");
                if (!dismissed) {
                    setShowPopup(true);
                }
            }
        });
    }, []);

    const handleCheckIn = useCallback(() => {
        startTransition(async () => {
            const res = await checkIn();
            if (res.success) {
                toast({ title: `✅ ${res.message}` });
                setAttendance({
                    loaded: true,
                    checkedIn: true,
                    checkedOut: false,
                    checkInTime: res.time || new Date().toISOString(),
                    checkOutTime: null,
                    totalMinutes: null,
                    status: (res as any).status || "PRESENT",
                });
                setShowPopup(false);
            } else {
                toast({ title: res.message, variant: "destructive" });
                setShowPopup(false);
            }
        });
    }, [toast]);

    const handleCheckOut = useCallback(() => {
        startTransition(async () => {
            const res = await checkOut();
            if (res.success) {
                toast({ title: `✅ ${res.message}` });
                setAttendance(prev => ({
                    ...prev,
                    checkedOut: true,
                    checkOutTime: res.time || new Date().toISOString(),
                    totalMinutes: res.totalMinutes || null,
                }));
            } else {
                toast({ title: res.message, variant: "destructive" });
            }
        });
    }, [toast]);

    const dismissPopup = useCallback(() => {
        setShowPopup(false);
        sessionStorage.setItem("attendance_popup_dismissed", "1");
    }, []);

    const formatTime = (iso: string | null) => {
        if (!iso) return "--:--";
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    if (!attendance.loaded) return null;

    return (
        <>
            {/* ── Header Button ──────────────────────────────────── */}
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

            {attendance.checkedIn && !attendance.checkedOut && (
                <Button
                    size="sm"
                    onClick={handleCheckOut}
                    disabled={isPending}
                    variant="outline"
                    className="rounded-xl border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold h-8 px-3"
                >
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    Check Out
                    <span className="ml-1.5 text-[10px] opacity-70">
                        ({formatTime(attendance.checkInTime)})
                    </span>
                </Button>
            )}

            {attendance.checkedIn && attendance.checkedOut && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                        {formatTime(attendance.checkInTime)} — {formatTime(attendance.checkOutTime)}
                    </span>
                    {attendance.totalMinutes && (
                        <span className="text-[10px] opacity-70">
                            ({Math.floor(attendance.totalMinutes / 60)}h {attendance.totalMinutes % 60}m)
                        </span>
                    )}
                </div>
            )}

            {/* ── Check-In Popup Modal ───────────────────────────── */}
            <Dialog open={showPopup} onOpenChange={(open) => { if (!open) dismissPopup(); }}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl max-w-sm">
                    <DialogHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-3">
                            <Clock className="h-8 w-8 text-emerald-400" />
                        </div>
                        <DialogTitle className="text-xl font-bold">
                            Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}! 👋
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Ready to start your day? Check in to record your attendance.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-xs text-muted-foreground">Date</span>
                            <span className="text-sm font-semibold">
                                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-xs text-muted-foreground">Current Time</span>
                            <span className="text-sm font-semibold">
                                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:flex-col">
                        <Button
                            onClick={handleCheckIn}
                            disabled={isPending}
                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-base py-5 shadow-lg shadow-emerald-500/25"
                        >
                            <LogIn className="h-5 w-5 mr-2" />
                            {isPending ? "Checking In…" : "Check In Now"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={dismissPopup}
                            className="w-full rounded-xl text-xs text-muted-foreground hover:text-foreground"
                        >
                            I&apos;ll check in later
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
