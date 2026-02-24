"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, BellRing, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
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

const TYPE_ICONS: Record<string, string> = {
    new_lead: "🆕",
    lead_assigned: "👤",
    status_changed: "🔄",
    follow_up_due: "🔔",
    lead_restored: "♻️",
    lead_deleted: "🗑️",
};

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isRinging, setIsRinging] = useState(false);
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

    const handleMarkOneRead = async (id: string, leadId: string | null) => {
        await markNotificationRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        if (leadId) router.push(`/leads/${leadId}`);
    };

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

            <DropdownMenuContent align="end" className="w-80 rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <DropdownMenuLabel className="p-0 text-sm font-semibold text-foreground">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                {unreadCount} unread
                            </span>
                        )}
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                            onClick={handleMarkAllRead}
                        >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* List */}
                <div className="max-h-[380px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                            <Bell className="h-8 w-8 opacity-30" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n._id}
                                onClick={() => !n.read && handleMarkOneRead(n._id, n.leadId)}
                                className={cn(
                                    "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 last:border-0",
                                    !n.read && "bg-primary/5"
                                )}
                            >
                                <span className="text-lg mt-0.5 shrink-0">{TYPE_ICONS[n.type] || "🔔"}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-1">
                                        <p className={cn("text-sm leading-snug", !n.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                                            {n.title}
                                        </p>
                                        {!n.read && (
                                            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] text-muted-foreground/60">{timeAgo(n.createdAt)}</span>
                                        {n.leadId && (
                                            <Link href={`/leads/${n.leadId}`} onClick={(e) => e.stopPropagation()}
                                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                                                View Lead <ExternalLink className="h-2.5 w-2.5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-white/10">
                        <p className="text-[11px] text-center text-muted-foreground/50">
                            Updates every 10 seconds
                        </p>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
