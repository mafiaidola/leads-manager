"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OnlineUser {
    userId: string;
    name: string;
    page: string;
    color: string;
    lastSeen: number;
}

const PRESENCE_COLORS = [
    "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
];

/**
 * @component PresenceIndicator
 * @description Shows which team members are currently online and what page they're viewing.
 * Uses localStorage-based presence (works for same-browser tabs; can be upgraded to SSE/WebSocket).
 */
export function PresenceIndicator({ currentUserId, currentUserName, currentPage }: {
    currentUserId: string;
    currentUserName: string;
    currentPage: string;
}) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    // Get a consistent color for a user
    const getColor = useCallback((userId: string) => {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
            hash |= 0;
        }
        return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
    }, []);

    // Update presence
    useEffect(() => {
        const key = `presence_${currentUserId}`;
        const update = () => {
            const entry: OnlineUser = {
                userId: currentUserId,
                name: currentUserName,
                page: currentPage,
                color: getColor(currentUserId),
                lastSeen: Date.now(),
            };
            try { localStorage.setItem(key, JSON.stringify(entry)); } catch {}
        };

        update();
        const interval = setInterval(update, 3000);

        return () => {
            clearInterval(interval);
            try { localStorage.removeItem(key); } catch {}
        };
    }, [currentUserId, currentUserName, currentPage, getColor]);

    // Read all presence entries
    useEffect(() => {
        const readPresence = () => {
            const users: OnlineUser[] = [];
            const now = Date.now();
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k?.startsWith("presence_")) {
                    try {
                        const entry = JSON.parse(localStorage.getItem(k) || "");
                        // Consider online if last seen within 10 seconds
                        if (now - entry.lastSeen < 10000 && entry.userId !== currentUserId) {
                            users.push(entry);
                        }
                    } catch {}
                }
            }
            setOnlineUsers(users);
        };

        readPresence();
        const interval = setInterval(readPresence, 2000);
        return () => clearInterval(interval);
    }, [currentUserId]);

    const totalOnline = onlineUsers.length;
    if (totalOnline === 0) return null;

    const pageNames: Record<string, string> = {
        "/": "Dashboard",
        "/leads": "Leads",
        "/reports": "Reports",
        "/settings": "Settings",
        "/audit": "Audit Log",
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                title={`${totalOnline} team member${totalOnline > 1 ? "s" : ""} online`}
            >
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <div className="flex -space-x-1.5">
                    {onlineUsers.slice(0, 3).map((u) => (
                        <div
                            key={u.userId}
                            className="w-5 h-5 rounded-full border-2 border-card flex items-center justify-center text-[8px] font-bold text-white presence-avatar"
                            ref={el => { if (el) el.style.setProperty('--avatar-color', u.color); }}
                            title={u.name}
                        >
                            {u.name.charAt(0)}
                        </div>
                    ))}
                    {totalOnline > 3 && (
                        <div className="w-5 h-5 rounded-full border-2 border-card bg-white/10 flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                            +{totalOnline - 3}
                        </div>
                    )}
                </div>
            </button>

            {isExpanded && (
                <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-top-1 duration-150 z-50">
                    <div className="px-3 py-2 border-b border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team Online</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {onlineUsers.map((u) => (
                            <div key={u.userId} className="px-3 py-2 flex items-center gap-2.5">
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white presence-avatar"
                                    ref={el => { if (el) el.style.setProperty('--avatar-color', u.color); }}
                                >
                                    {u.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{u.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{pageNames[u.page] || u.page}</p>
                                </div>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
