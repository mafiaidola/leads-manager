/**
 * @component ActivityHeartbeat
 * @description Invisible component that sends activity heartbeats every 5 minutes
 * while the tab is active, and fires a sendBeacon on tab close for auto-checkout.
 *
 * Mounted in the dashboard layout for all authenticated users.
 */
"use client";

import { useEffect, useRef } from "react";
import { recordActivity } from "@/lib/actions/attendance";

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function ActivityHeartbeat() {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isVisibleRef = useRef(true);

    useEffect(() => {
        // Send heartbeat
        const sendHeartbeat = () => {
            if (isVisibleRef.current) {
                recordActivity().catch(() => {});
            }
        };

        // Start interval
        sendHeartbeat(); // immediate first heartbeat
        intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // Visibility change handler — pause when tab is hidden
        const handleVisibility = () => {
            isVisibleRef.current = document.visibilityState === "visible";
            if (isVisibleRef.current) {
                // Tab became visible again — send immediate heartbeat
                sendHeartbeat();
            }
        };

        // Before unload — send beacon for checkout
        const handleBeforeUnload = () => {
            try {
                navigator.sendBeacon("/api/attendance/logout");
            } catch {
                // silent
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    // Invisible component — renders nothing
    return null;
}
