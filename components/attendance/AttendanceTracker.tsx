/**
 * @component CheckInOutWidget
 * @description Explicit check-in/check-out attendance widget with enhanced UX.
 *
 * Check-in flow:
 *   - On first daily login, shows a mandatory popup with:
 *     1. Name input (pre-filled from session, required)
 *     2. Attestation checkbox ("I confirm I am present and attending at the office")
 *     3. Check-in button (disabled until both conditions met)
 *
 * Check-out flow:
 *   - Button in header triggers a confirmation dialog with:
 *     1. Checkbox: "I understand I will not be able to check in again today"
 *     2. Confirm button (disabled until checkbox checked)
 *
 * After check-out: shows summary badge, no re-check-in allowed.
 */
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, LogOut, Clock, CheckCircle2, ShieldCheck } from "lucide-react";
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

export function CheckInOutWidget({ userName }: { userName?: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [showPopup, setShowPopup] = useState(false);
    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
    const [attendance, setAttendance] = useState<AttendanceState>({
        loaded: false,
        checkedIn: false,
        checkedOut: false,
        checkInTime: null,
        checkOutTime: null,
        totalMinutes: null,
        status: null,
    });

    // Check-in form state
    const [nameInput, setNameInput] = useState(userName || "");
    const [attestation, setAttestation] = useState(false);

    // Check-out confirmation state
    const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);

    // Pre-fill name when userName prop changes
    useEffect(() => {
        if (userName) setNameInput(userName);
    }, [userName]);

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
                const dismissed = sessionStorage.getItem("attendance_popup_dismissed");
                if (!dismissed) {
                    setShowPopup(true);
                }
            }
        });
    }, []);

    const handleCheckIn = useCallback(() => {
        if (!nameInput.trim() || !attestation) return;
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
                setAttestation(false);
            } else {
                toast({ title: res.message, variant: "destructive" });
                setShowPopup(false);
            }
        });
    }, [toast, nameInput, attestation]);

    const handleCheckOut = useCallback(() => {
        if (!checkoutConfirmed) return;
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
                setShowCheckoutConfirm(false);
                setCheckoutConfirmed(false);
            } else {
                toast({ title: res.message, variant: "destructive" });
                setShowCheckoutConfirm(false);
                setCheckoutConfirmed(false);
            }
        });
    }, [toast, checkoutConfirmed]);

    const dismissPopup = useCallback(() => {
        setShowPopup(false);
        sessionStorage.setItem("attendance_popup_dismissed", "1");
    }, []);

    const formatTime = (iso: string | null) => {
        if (!iso) return "--:--";
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const canCheckIn = nameInput.trim().length > 0 && attestation;

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
                    onClick={() => {
                        setCheckoutConfirmed(false);
                        setShowCheckoutConfirm(true);
                    }}
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
                            Ready to start your day? Please confirm your attendance below.
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

                        {/* Name Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground ml-1">
                                Your Full Name <span className="text-red-400">*</span>
                            </label>
                            <Input
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="Type your full name"
                                className="rounded-xl border-white/10 bg-white/5 focus:ring-emerald-500/20"
                                autoFocus
                            />
                        </div>

                        {/* Attestation Checkbox */}
                        <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors select-none">
                            <input
                                type="checkbox"
                                checked={attestation}
                                onChange={(e) => setAttestation(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/20 accent-emerald-500"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium leading-tight">
                                    I confirm I am present and attending at the office
                                </span>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    This will be recorded in your attendance log
                                </p>
                            </div>
                        </label>
                    </div>

                    <DialogFooter className="flex gap-2 sm:flex-col">
                        <Button
                            onClick={handleCheckIn}
                            disabled={isPending || !canCheckIn}
                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-base py-5 shadow-lg shadow-emerald-500/25 disabled:opacity-40"
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

            {/* ── Check-Out Confirmation Modal ────────────────────── */}
            <Dialog open={showCheckoutConfirm} onOpenChange={(open) => { if (!open) { setShowCheckoutConfirm(false); setCheckoutConfirmed(false); } }}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl max-w-sm">
                    <DialogHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center mb-3">
                            <ShieldCheck className="h-8 w-8 text-red-400" />
                        </div>
                        <DialogTitle className="text-xl font-bold">
                            Check Out Confirmation
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Are you sure you want to check out for today?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-xs text-muted-foreground">Checked In At</span>
                            <span className="text-sm font-semibold text-emerald-400">{formatTime(attendance.checkInTime)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-xs text-muted-foreground">Current Time</span>
                            <span className="text-sm font-semibold">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        {/* Confirmation Checkbox */}
                        <label className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-colors select-none">
                            <input
                                type="checkbox"
                                checked={checkoutConfirmed}
                                onChange={(e) => setCheckoutConfirmed(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-red-500/30 bg-white/5 text-red-500 focus:ring-red-500/20 accent-red-500"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium leading-tight text-red-400">
                                    I understand I will not be able to check in again today
                                </span>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Once checked out, your attendance for today is finalized
                                </p>
                            </div>
                        </label>
                    </div>

                    <DialogFooter className="flex gap-2 sm:flex-col">
                        <Button
                            onClick={handleCheckOut}
                            disabled={isPending || !checkoutConfirmed}
                            className="w-full rounded-xl bg-red-600 hover:bg-red-500 font-bold text-base py-5 shadow-lg shadow-red-500/25 disabled:opacity-40"
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
        </>
    );
}
