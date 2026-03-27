/**
 * @component NotificationBell
 * @description Header notification bell with SSE-powered real-time updates.
 * Opens dropdown panel with full notification history, mark-as-read, clear-all,
 * and deep-linking to lead detail pages.
 *
 * Features:
 * - SSE auto-reconnect for real-time updates
 * - Animated bell ring on new notifications
 * - Unread badge counter (99+ cap)
 * - Read/unread visual distinction
 * - Type-specific icons and colors
 * - Time-ago timestamps
 * - Mark individual / all as read
 * - Clear all notifications
 * - Click to navigate to lead detail
 */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
    Bell, BellRing, Check, CheckCheck, ExternalLink,
    Trash2, UserPlus, FileEdit, ArrowRightLeft, Trash,
    Plus, RefreshCcw, Layers, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
    markNotificationRead,
    markAllNotificationsRead,
    deleteAllNotifications,
} from "@/lib/actions/notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    leadId: string | null;
    read: boolean;
    createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
    new_lead:           { icon: Plus,            color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
    lead_assigned:      { icon: UserPlus,        color: "text-blue-400",    bgColor: "bg-blue-500/15" },
    lead_updated:       { icon: FileEdit,        color: "text-violet-400",  bgColor: "bg-violet-500/15" },
    status_changed:     { icon: RefreshCcw,      color: "text-amber-400",   bgColor: "bg-amber-500/15" },
    lead_transferred:   { icon: ArrowRightLeft,  color: "text-cyan-400",    bgColor: "bg-cyan-500/15" },
    follow_up_due:      { icon: Bell,            color: "text-orange-400",  bgColor: "bg-orange-500/15" },
    lead_restored:      { icon: RefreshCcw,      color: "text-green-400",   bgColor: "bg-green-500/15" },
    lead_deleted:       { icon: Trash,           color: "text-red-400",     bgColor: "bg-red-500/15" },
    bulk_status_change: { icon: Layers,          color: "text-amber-400",   bgColor: "bg-amber-500/15" },
    bulk_assignment:    { icon: Layers,          color: "text-blue-400",    bgColor: "bg-blue-500/15" },
    bulk_deleted:       { icon: Layers,          color: "text-red-400",     bgColor: "bg-red-500/15" },
};

const DEFAULT_CONFIG = { icon: AlertTriangle, color: "text-muted-foreground", bgColor: "bg-white/10" };

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isRinging, setIsRinging] = useState(false);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const prevCount = useRef(0);
    const esRef = useRef<EventSource | null>(null);

    const connectSSE = useCallback(() => {
        // Close existing connection
        if (esRef.current) esRef.current.close();

        const es = new EventSource("/api/notifications/stream");
        esRef.current = es;

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "ping") return;
                if (data.type === "notifications") {
                    setNotifications(data.notifications);
                    setUnreadCount(data.count);
                    // Ring the bell if new notifications arrived
                    if (data.count > prevCount.current) {
                        setIsRinging(true);
                        setTimeout(() => setIsRinging(false), 2000);
                    }
                    prevCount.current = data.count;
                }
            } catch { /* ignore parse errors */ }
        };

        es.onerror = () => {
            es.close();
            // Auto-reconnect after 5 seconds
            setTimeout(connectSSE, 5000);
        };
    }, []);

    useEffect(() => {
        connectSSE();
        return () => { esRef.current?.close(); };
    }, [connectSSE]);

    const handleMarkAllRead = async () => {
        await markAllNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        prevCount.current = 0;
    };

    const handleClearAll = async () => {
        await deleteAllNotifications();
        setNotifications([]);
        setUnreadCount(0);
        prevCount.current = 0;
    };

    const handleMarkOneRead = async (id: string, leadId: string | null) => {
        await markNotificationRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        if (leadId) router.push(`/leads/${leadId}`);
    };

    const filteredNotifications = filter === "unread"
        ? notifications.filter(n => !n.read)
        : notifications;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9 hover:bg-primary/10" aria-label="Notifications">
                    {isRinging ? (
                        <BellRing className="h-5 w-5 text-primary animate-bounce" />
                    ) : (
                        <Bell className="h-5 w-5 text-muted-foreground" />
                    )}
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96 rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <DropdownMenuLabel className="p-0 text-sm font-semibold text-foreground">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </DropdownMenuLabel>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                                onClick={handleMarkAllRead}
                            >
                                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                                Read all
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                onClick={handleClearAll}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter tabs */}
                {notifications.length > 0 && (
                    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
                        <button
                            onClick={() => setFilter("all")}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                                filter === "all" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                                filter === "unread" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>
                )}

                {/* List */}
                <div className="max-h-[420px] overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                            <Bell className="h-8 w-8 opacity-30" />
                            <p className="text-sm">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
                        </div>
                    ) : (
                        filteredNotifications.map((n) => {
                            const config = TYPE_CONFIG[n.type] || DEFAULT_CONFIG;
                            const IconComponent = config.icon;
                            return (
                                <div
                                    key={n._id}
                                    onClick={() => handleMarkOneRead(n._id, n.leadId)}
                                    className={cn(
                                        "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 last:border-0",
                                        !n.read && "bg-primary/[0.04]"
                                    )}
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0",
                                        config.bgColor
                                    )}>
                                        <IconComponent className={cn("h-4 w-4", config.color)} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                            <p className={cn("text-sm leading-snug", !n.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                                                {n.title}
                                            </p>
                                            {!n.read && (
                                                <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                                            )}
                                        </div>
                                        <p className={cn(
                                            "text-xs mt-0.5 line-clamp-2",
                                            !n.read ? "text-muted-foreground" : "text-muted-foreground/60"
                                        )}>
                                            {n.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-[10px] text-muted-foreground/50">{timeAgo(n.createdAt)}</span>
                                            <div className="flex items-center gap-2">
                                                {n.leadId && (
                                                    <Link href={`/leads/${n.leadId}`} onClick={(e) => e.stopPropagation()}
                                                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                                                        View Lead <ExternalLink className="h-2.5 w-2.5" />
                                                    </Link>
                                                )}
                                                {!n.read && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMarkOneRead(n._id, null); }}
                                                        className="text-[10px] text-muted-foreground/50 hover:text-primary flex items-center gap-0.5"
                                                    >
                                                        <Check className="h-2.5 w-2.5" /> Mark read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-white/10 bg-white/[0.02]">
                        <p className="text-[11px] text-center text-muted-foreground/50">
                            Live updates every 10 seconds • {notifications.length} total
                        </p>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
