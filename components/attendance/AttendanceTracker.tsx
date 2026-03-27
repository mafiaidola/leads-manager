/**
 * @component AttendanceTracker
 * @description Client component that detects tab/window close and sends
 * a logout beacon to record checkout time for attendance.
 *
 * Uses navigator.sendBeacon for reliable delivery even during page unload.
 * Also periodically pings to keep lastLogout updated (heartbeat every 5 min).
 */
"use client";

import { useEffect } from "react";

export function AttendanceTracker() {
    useEffect(() => {
        const handleBeforeUnload = () => {
            // sendBeacon is fire-and-forget, works during page unload
            navigator.sendBeacon("/api/attendance/logout", "{}");
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                // User switched away / minimized — update logout time
                navigator.sendBeacon("/api/attendance/logout", "{}");
            }
        };

        // Heartbeat: update lastLogout every 5 minutes while tab is active
        const heartbeat = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetch("/api/attendance/logout", { method: "POST", keepalive: true }).catch(() => {});
            }
        }, 5 * 60 * 1000);

        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            clearInterval(heartbeat);
        };
    }, []);

    return null; // Invisible component
}
