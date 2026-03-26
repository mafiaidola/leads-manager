/**
 * @component SessionTimeoutWarning
 * @description Monitors user activity and warns before session expires.
 * Shows a dialog 5 minutes before the 8-hour JWT session expires,
 * allowing users to extend the session or log out gracefully.
 *
 * Activity events (mouse, keyboard, scroll, touch) reset the idle timer.
 * If the user is idle for (SESSION_MAX_AGE - WARNING_BEFORE) seconds,
 * the warning dialog appears with a countdown.
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut, RefreshCw } from "lucide-react";
import { signOut } from "next-auth/react";

const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds (matches auth.config.ts)
const WARNING_BEFORE = 5 * 60;       // Show warning 5 minutes before expiry
const IDLE_THRESHOLD = SESSION_MAX_AGE - WARNING_BEFORE; // Seconds of idle before warning
const COUNTDOWN_SECONDS = WARNING_BEFORE; // 5 minute countdown in warning dialog

export function SessionTimeoutWarning() {
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const lastActivityRef = useRef(Date.now());
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const resetActivity = useCallback(() => {
        lastActivityRef.current = Date.now();

        // Clear existing timers
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        // Set new warning timer
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
            setCountdown(COUNTDOWN_SECONDS);

            // Start countdown
            countdownIntervalRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        // Session expired — force logout
                        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                        signOut({ callbackUrl: "/login" });
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, IDLE_THRESHOLD * 1000);
    }, []);

    const handleExtendSession = useCallback(async () => {
        setShowWarning(false);
        setCountdown(COUNTDOWN_SECONDS);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        // Ping the session endpoint to refresh the JWT token
        try {
            await fetch("/api/auth/session");
        } catch {
            // Session refresh is best-effort
        }

        resetActivity();
    }, [resetActivity]);

    const handleLogout = useCallback(() => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        signOut({ callbackUrl: "/login" });
    }, []);

    useEffect(() => {
        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"] as const;

        const handleActivity = () => {
            if (!showWarning) {
                resetActivity();
            }
        };

        events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
        resetActivity(); // Initialize timer

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [resetActivity, showWarning]);

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    return (
        <Dialog open={showWarning} onOpenChange={(open) => { if (!open) handleExtendSession(); }}>
            <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl max-w-md">
                <DialogHeader className="space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-amber-500 animate-pulse" />
                    </div>
                    <DialogTitle className="text-center text-xl">Session Expiring Soon</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        Your session will expire due to inactivity. You will be logged out automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center py-4">
                    <div className="text-center">
                        <div className="text-5xl font-bold font-mono tabular-nums text-amber-500">
                            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Time remaining</p>
                    </div>
                </div>

                {/* Progress bar showing time remaining */}
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{
                            width: `${(countdown / COUNTDOWN_SECONDS) * 100}%`,
                            background: countdown > 120
                                ? "linear-gradient(90deg, #f59e0b, #eab308)"
                                : countdown > 30
                                ? "linear-gradient(90deg, #f97316, #ef4444)"
                                : "#ef4444",
                        }}
                    />
                </div>

                <DialogFooter className="gap-2 sm:gap-2 mt-2">
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="rounded-xl border-white/10 flex-1"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log Out Now
                    </Button>
                    <Button
                        onClick={handleExtendSession}
                        className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold flex-1 shadow-lg shadow-amber-500/20"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Stay Signed In
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
